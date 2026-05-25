import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { sharedStyles as styles } from '../styles/sharedStyles';
import type {
  NavigationApiError,
  NavigationLocation,
  NavigationRoute,
  RouteSegment,
} from '../types/navigation';

type NavigacijaPageProps = {
  initialTarget: string;
  onBack: () => void;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

type NearestTarget = {
  kind: 'nearest';
  id: 'nearest-wc';
  displayName: string;
  targetType: 'wc';
  meta: string;
};

type TargetSelection = NavigationLocation | NearestTarget;

const NEAREST_WC_TARGET: NearestTarget = {
  kind: 'nearest',
  id: 'nearest-wc',
  displayName: 'Najblizi WC',
  targetType: 'wc',
  meta: 'Najkraca dostupna ruta do WC-a',
};

function isNearestTarget(target: TargetSelection): target is NearestTarget {
  return 'kind' in target && target.kind === 'nearest';
}

function NavigacijaPage({ initialTarget, onBack }: NavigacijaPageProps) {
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState(initialTarget);
  const [fromLocation, setFromLocation] = useState<NavigationLocation | null>(null);
  const [toTarget, setToTarget] = useState<TargetSelection | null>(null);
  const [fromResults, setFromResults] = useState<NavigationLocation[]>([]);
  const [toResults, setToResults] = useState<NavigationLocation[]>([]);
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isRouting, setIsRouting] = useState(false);
  const [error, setError] = useState('');

  useLocationSearch(fromQuery, setFromResults);
  useLocationSearch(toQuery, setToResults);

  const activeSegment = route?.segments[activeSegmentIndex] ?? null;
  const canRoute = Boolean(fromLocation && toTarget && !isRouting);

  const handleRoute = async () => {
    if (!fromLocation || !toTarget) {
      setError('Izberi zacetno in ciljno lokacijo iz seznama.');
      return;
    }

    setIsRouting(true);
    setError('');

    try {
      const params = new URLSearchParams({
        fromLocationId: String(fromLocation.id),
        allowElevator: 'true',
      });
      if (isNearestTarget(toTarget)) {
        params.set('targetType', toTarget.targetType);
      } else {
        params.set('toLocationId', String(toTarget.id));
      }
      const response = await fetch(`${API_BASE_URL}/api/navigation/route?${params}`);

      if (!response.ok) {
        const apiError = (await response.json().catch(() => ({}))) as NavigationApiError;
        throw new Error(apiError.message || 'Pot za izbrani lokaciji se ni na voljo.');
      }

      const nextRoute = (await response.json()) as NavigationRoute;
      setRoute(nextRoute);
      setActiveSegmentIndex(0);
      setActiveStepIndex(0);
    } catch (routeError) {
      setRoute(null);
      setError(routeError instanceof Error ? routeError.message : 'Napaka pri racunanju poti.');
    } finally {
      setIsRouting(false);
    }
  };

  const moveStep = (direction: 1 | -1) => {
    if (!route) {
      return;
    }

    const segment = route.segments[activeSegmentIndex];
    const nextStepIndex = activeStepIndex + direction;

    if (nextStepIndex >= 0 && nextStepIndex < segment.steps.length) {
      setActiveStepIndex(nextStepIndex);
      return;
    }

    const nextSegmentIndex = activeSegmentIndex + direction;
    const nextSegment = route.segments[nextSegmentIndex];

    if (!nextSegment) {
      return;
    }

    setActiveSegmentIndex(nextSegmentIndex);
    setActiveStepIndex(direction > 0 ? 0 : Math.max(nextSegment.steps.length - 1, 0));
  };

  const selectSegment = (index: number) => {
    setActiveSegmentIndex(index);
    setActiveStepIndex(0);
  };

  return (
    <main style={styles.pageShell}>
      <section style={styles.phoneCanvas}>
        <header style={styles.subPageHeader}>
          <button type="button" style={styles.backButton} onClick={onBack}>
            &lt; Nazaj
          </button>
          <h1 style={styles.subPageTitle}>Navigacija</h1>
        </header>

        <section style={pageStyles.content}>
          <LocationPicker
            id="start-location"
            label="Zacetna lokacija"
            placeholder="Poisci zacetno lokacijo"
            query={fromQuery}
            selected={fromLocation}
            results={fromResults}
            onQueryChange={(value) => {
              setFromQuery(value);
              setFromLocation(null);
              setRoute(null);
            }}
            onSelect={(location) => {
              if (isNearestTarget(location)) {
                return;
              }
              setFromLocation(location);
              setFromQuery(location.displayName);
            }}
          />

          <LocationPicker
            id="target-location"
            label="Ciljna lokacija"
            placeholder="Poisci cilj"
            query={toQuery}
            selected={toTarget}
            results={toResults}
            nearestTarget={NEAREST_WC_TARGET}
            onQueryChange={(value) => {
              setToQuery(value);
              setToTarget(null);
              setRoute(null);
            }}
            onSelect={(target) => {
              setToTarget(target);
              setToQuery(target.displayName);
            }}
          />

          <button
            type="button"
            style={{
              ...pageStyles.primaryButton,
              ...(canRoute ? null : pageStyles.disabledButton),
            }}
            onClick={handleRoute}
            disabled={!canRoute}
          >
            {isRouting ? 'Racunam pot...' : 'Prikazi pot'}
          </button>

          {error && <p style={pageStyles.errorText}>{error}</p>}

          {route && activeSegment && (
            <>
              <SegmentTabs
                segments={route.segments}
                activeSegmentIndex={activeSegmentIndex}
                onSelect={selectSegment}
              />

              <RouteMap segment={activeSegment} activeStepIndex={activeStepIndex} />

              <StepList
                segment={activeSegment}
                activeStepIndex={activeStepIndex}
                onSelectStep={setActiveStepIndex}
              />

              <div style={pageStyles.stepControls}>
                <button
                  type="button"
                  style={pageStyles.secondaryButton}
                  onClick={() => moveStep(-1)}
                >
                  Prejsnji
                </button>
                <button
                  type="button"
                  style={pageStyles.secondaryButton}
                  onClick={() => moveStep(1)}
                >
                  Naslednji
                </button>
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function useLocationSearch(query: string, setResults: (locations: NavigationLocation[]) => void) {
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ query: query.trim(), limit: '20' });

    fetch(`${API_BASE_URL}/api/navigation/locations?${params}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((locations: NavigationLocation[]) => setResults(locations))
      .catch((searchError) => {
        if (searchError instanceof DOMException && searchError.name === 'AbortError') {
          return;
        }
        setResults([]);
      });

    return () => controller.abort();
  }, [query, setResults]);
}

type LocationPickerProps = {
  id: string;
  label: string;
  placeholder: string;
  query: string;
  selected: TargetSelection | null;
  results: NavigationLocation[];
  nearestTarget?: NearestTarget;
  onQueryChange: (value: string) => void;
  onSelect: (location: TargetSelection) => void;
};

function LocationPicker({
  id,
  label,
  placeholder,
  query,
  selected,
  results,
  nearestTarget,
  onQueryChange,
  onSelect,
}: LocationPickerProps) {
  const showResults = !selected && query.trim().length > 0;
  const hasResults = results.length > 0 || Boolean(nearestTarget);

  return (
    <div style={pageStyles.picker}>
      <label style={pageStyles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        style={pageStyles.input}
        autoComplete="off"
      />
      {selected && (
        <p style={pageStyles.selectionText}>
          {isNearestTarget(selected)
            ? selected.meta
            : `${selected.buildingCode} - ${selected.floorLabel}`}
        </p>
      )}
      {showResults && hasResults && (
        <div style={pageStyles.resultsBox}>
          {nearestTarget && (
            <button
              key={nearestTarget.id}
              type="button"
              style={pageStyles.resultButton}
              onClick={() => onSelect(nearestTarget)}
            >
              <span style={pageStyles.resultName}>{nearestTarget.displayName}</span>
              <span style={pageStyles.resultMeta}>{nearestTarget.meta}</span>
            </button>
          )}
          {results.map((location) => (
            <button
              key={location.id}
              type="button"
              style={pageStyles.resultButton}
              onClick={() => onSelect(location)}
            >
              <span style={pageStyles.resultName}>{location.displayName}</span>
              <span style={pageStyles.resultMeta}>
                {location.buildingCode} - {location.floorLabel}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SegmentTabs({
  segments,
  activeSegmentIndex,
  onSelect,
}: {
  segments: RouteSegment[];
  activeSegmentIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div style={pageStyles.segmentTabs}>
      {segments.map((segment, index) => (
        <button
          key={`${segment.floorId}-${index}`}
          type="button"
          style={{
            ...pageStyles.segmentTab,
            ...(activeSegmentIndex === index ? pageStyles.segmentTabActive : null),
          }}
          onClick={() => onSelect(index)}
        >
          {segment.floorLabel}
        </button>
      ))}
    </div>
  );
}

function RouteMap({
  segment,
  activeStepIndex,
}: {
  segment: RouteSegment;
  activeStepIndex: number;
}) {
  const pathPoints = useMemo(
    () => segment.path.map((point) => `${point.x},${point.y}`).join(' '),
    [segment.path]
  );
  const activeStep = segment.steps[activeStepIndex];
  const activeFrom = segment.path.find((point) => point.nodeId === activeStep?.fromNodeId);
  const activeTo = segment.path.find((point) => point.nodeId === activeStep?.toNodeId);

  return (
    <div style={pageStyles.mapPanel}>
      <div style={pageStyles.mapTitleRow}>
        <p style={pageStyles.mapTitle}>{segment.buildingName}</p>
        <p style={pageStyles.mapMeta}>{segment.floorLabel}</p>
      </div>
      <div style={pageStyles.mapViewport}>
        <img
          src={resolveAssetUrl(segment.mapImageUrl)}
          alt={`${segment.buildingName} ${segment.floorLabel}`}
          style={pageStyles.mapImage}
        />
        <svg
          viewBox={`0 0 ${segment.coordinateWidth} ${segment.coordinateHeight}`}
          style={pageStyles.mapOverlay}
          aria-hidden="true"
        >
          <polyline
            points={pathPoints}
            fill="none"
            stroke="#f09d18"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="10"
            opacity="0.82"
          />
          {activeFrom && activeTo && (
            <line
              x1={activeFrom.x}
              y1={activeFrom.y}
              x2={activeTo.x}
              y2={activeTo.y}
              stroke="#172033"
              strokeLinecap="round"
              strokeWidth="14"
              opacity="0.9"
            />
          )}
          {segment.path[0] && <RouteMarker point={segment.path[0]} label="A" fill="#172033" />}
          {segment.path.at(-1) && (
            <RouteMarker point={segment.path.at(-1)!} label="B" fill="#f09d18" />
          )}
          {activeTo && <RouteMarker point={activeTo} label="" fill="#1d4ed8" radius={9} />}
        </svg>
      </div>
    </div>
  );
}

function RouteMarker({
  point,
  label,
  fill,
  radius = 13,
}: {
  point: { x: number; y: number };
  label: string;
  fill: string;
  radius?: number;
}) {
  return (
    <>
      <circle cx={point.x} cy={point.y} r={radius} fill={fill} />
      {label && (
        <text
          x={point.x}
          y={point.y + 4}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="12"
          fontWeight="800"
        >
          {label}
        </text>
      )}
    </>
  );
}

function StepList({
  segment,
  activeStepIndex,
  onSelectStep,
}: {
  segment: RouteSegment;
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
}) {
  return (
    <div style={pageStyles.stepsBox}>
      {segment.steps.map((step, index) => (
        <button
          key={`${step.fromNodeId}-${step.toNodeId}-${index}`}
          type="button"
          style={{
            ...pageStyles.stepButton,
            ...(activeStepIndex === index ? pageStyles.stepButtonActive : null),
          }}
          onClick={() => onSelectStep(index)}
        >
          <span style={pageStyles.stepNumber}>{index + 1}</span>
          <span style={pageStyles.stepText}>{step.text}</span>
        </button>
      ))}
    </div>
  );
}

function resolveAssetUrl(path: string) {
  if (path.startsWith('http')) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

const pageStyles: Record<string, CSSProperties> = {
  content: {
    display: 'grid',
    gap: 12,
    padding: '16px 16px 28px',
  },
  picker: {
    display: 'grid',
    gap: 7,
    position: 'relative',
  },
  label: {
    color: '#172033',
    fontSize: 14,
    fontWeight: 900,
    marginTop: 4,
  },
  input: {
    background: '#ffffff',
    border: '1px solid #d8dee8',
    borderRadius: 16,
    boxSizing: 'border-box',
    color: '#172033',
    fontSize: 15,
    outline: 'none',
    padding: '13px 14px',
    width: '100%',
  },
  selectionText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 800,
    margin: '-2px 0 0',
  },
  resultsBox: {
    background: '#ffffff',
    border: '1px solid #d8dee8',
    borderRadius: 12,
    boxShadow: '0 14px 28px rgba(23, 32, 51, 0.13)',
    display: 'grid',
    left: 0,
    maxHeight: 220,
    overflowY: 'auto',
    position: 'absolute',
    right: 0,
    top: '100%',
    zIndex: 5,
  },
  resultButton: {
    background: '#ffffff',
    border: 0,
    borderBottom: '1px solid #edf1f7',
    cursor: 'pointer',
    display: 'grid',
    gap: 2,
    padding: '10px 12px',
    textAlign: 'left',
  },
  resultName: {
    color: '#172033',
    fontSize: 14,
    fontWeight: 900,
  },
  resultMeta: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 800,
  },
  primaryButton: {
    background: '#172033',
    border: 0,
    borderRadius: 16,
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 900,
    marginTop: 2,
    padding: '14px 16px',
    width: '100%',
  },
  disabledButton: {
    cursor: 'not-allowed',
    opacity: 0.48,
  },
  errorText: {
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: 10,
    color: '#9a3412',
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.35,
    margin: 0,
    padding: '10px 12px',
  },
  segmentTabs: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    paddingTop: 4,
  },
  segmentTab: {
    background: '#ffffff',
    border: '1px solid #d8dee8',
    borderRadius: 999,
    color: '#334155',
    cursor: 'pointer',
    flex: '0 0 auto',
    fontSize: 13,
    fontWeight: 900,
    padding: '9px 12px',
  },
  segmentTabActive: {
    background: '#172033',
    borderColor: '#172033',
    color: '#ffffff',
  },
  mapPanel: {
    background: '#ffffff',
    border: '1px solid #d8dee8',
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapTitleRow: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '11px 12px',
  },
  mapTitle: {
    color: '#172033',
    fontSize: 13,
    fontWeight: 900,
    margin: 0,
  },
  mapMeta: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 900,
    margin: 0,
  },
  mapViewport: {
    aspectRatio: '1190 / 842',
    background: '#f8fafc',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  mapImage: {
    display: 'block',
    height: '100%',
    objectFit: 'contain',
    width: '100%',
  },
  mapOverlay: {
    inset: 0,
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  stepsBox: {
    display: 'grid',
    gap: 8,
  },
  stepButton: {
    alignItems: 'flex-start',
    background: '#ffffff',
    border: '1px solid #d8dee8',
    borderRadius: 12,
    color: '#172033',
    cursor: 'pointer',
    display: 'grid',
    gap: 10,
    gridTemplateColumns: '28px 1fr',
    padding: '11px 12px',
    textAlign: 'left',
    width: '100%',
  },
  stepButtonActive: {
    borderColor: '#f09d18',
    boxShadow: '0 0 0 2px rgba(240, 157, 24, 0.18)',
  },
  stepNumber: {
    alignItems: 'center',
    background: '#172033',
    borderRadius: 999,
    color: '#ffffff',
    display: 'inline-flex',
    fontSize: 12,
    fontWeight: 900,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  stepText: {
    color: '#172033',
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1.35,
  },
  stepControls: {
    display: 'grid',
    gap: 10,
    gridTemplateColumns: '1fr 1fr',
  },
  secondaryButton: {
    background: '#ffffff',
    border: '1px solid #d8dee8',
    borderRadius: 14,
    color: '#172033',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 900,
    padding: '12px 10px',
  },
};

export default NavigacijaPage;
