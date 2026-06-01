import { useMemo } from 'react';
import { resolveAssetUrl } from '../../services/api';
import type { RouteSegment } from '../../types/navigation';
import styles from './NavigationView.module.css';

type RouteMapProps = {
  segment: RouteSegment;
  activeStepIndex: number;
};

function RouteMap({ segment, activeStepIndex }: RouteMapProps) {
  const safeWidth =
    Number.isFinite(segment.coordinateWidth) && segment.coordinateWidth > 0
      ? segment.coordinateWidth
      : 1000;
  const safeHeight =
    Number.isFinite(segment.coordinateHeight) && segment.coordinateHeight > 0
      ? segment.coordinateHeight
      : 1000;
  const safePath = useMemo(
    () => (Array.isArray(segment.path) ? segment.path.filter(isValidRoutePoint) : []),
    [segment.path]
  );
  const safeSteps = Array.isArray(segment.steps) ? segment.steps : [];
  const pathPoints = useMemo(
    () => safePath.map((point) => `${point.x},${point.y}`).join(' '),
    [safePath]
  );
  const hasPolyline = safePath.length >= 2;
  const activeStep = safeSteps[activeStepIndex];
  const activeFrom = safePath.find((point) => point.nodeId === activeStep?.fromNodeId);
  const activeTo = safePath.find((point) => point.nodeId === activeStep?.toNodeId);
  const activeFromIndex = safePath.findIndex((point) => point.nodeId === activeStep?.fromNodeId);
  const activeToIndex = safePath.findIndex((point) => point.nodeId === activeStep?.toNodeId);
  const donePoints =
    activeFromIndex >= 0
      ? safePath
          .slice(0, activeFromIndex + 1)
          .map((point) => `${point.x},${point.y}`)
          .join(' ')
      : '';
  const activePoints =
    activeFromIndex >= 0 && activeToIndex >= activeFromIndex
      ? safePath
          .slice(activeFromIndex, activeToIndex + 1)
          .map((point) => `${point.x},${point.y}`)
          .join(' ')
      : '';
  const remainingPoints =
    activeToIndex >= 0
      ? safePath
          .slice(activeToIndex)
          .map((point) => `${point.x},${point.y}`)
          .join(' ')
      : pathPoints;
  const imageUrl = resolveAssetUrl(segment.mapImageUrl);

  return (
    <div className={styles.mapPanel}>
      <div className={styles.mapTitleRow}>
        <p className={styles.mapTitle}>{segment.buildingName}</p>
        <p className={styles.mapMeta}>{segment.floorLabel}</p>
      </div>
      <div className={styles.mapViewport}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={`${segment.buildingName} ${segment.floorLabel}`}
            className={styles.mapImage}
          />
        )}
        <svg
          viewBox={`0 0 ${safeWidth} ${safeHeight}`}
          className={styles.mapOverlay}
          aria-hidden="true"
        >
          {hasPolyline && (
            <polyline
              points={pathPoints}
              fill="none"
              stroke="#cbd5e1"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="10"
              opacity="0.55"
            />
          )}
          {hasPolyline && remainingPoints && activeToIndex < safePath.length - 1 && (
            <polyline
              points={remainingPoints}
              fill="none"
              stroke="#94a3b8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="12"
              opacity="0.75"
            />
          )}
          {hasPolyline && donePoints && (
            <polyline
              points={donePoints}
              fill="none"
              stroke="#94a3b8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="14"
              opacity="0.85"
            />
          )}
          {activePoints && (
            <polyline
              points={activePoints}
              fill="none"
              stroke="#dc2626"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="20"
              opacity="1"
            />
          )}
          {activeFrom && activeTo && (
            <line
              x1={activeFrom.x}
              y1={activeFrom.y}
              x2={activeTo.x}
              y2={activeTo.y}
              stroke="#dc2626"
              strokeLinecap="round"
              strokeWidth="22"
              opacity="1"
            />
          )}
          {safePath[0] && <RouteMarker point={safePath[0]} label="A" fill="#64748b" />}
          {safePath.at(-1) && <RouteMarker point={safePath.at(-1)!} label="B" fill="#dc2626" />}
          {activeTo && <RouteMarker point={activeTo} label="" fill="#dc2626" radius={11} />}
          {activeTo && <circle cx={activeTo.x} cy={activeTo.y} r="22" fill="#dc2626" opacity="0.22" />}
        </svg>
      </div>
    </div>
  );
}

function isValidRoutePoint(point: unknown): point is { nodeId: number; x: number; y: number } {
  if (!point || typeof point !== 'object') {
    return false;
  }

  const routePoint = point as { nodeId?: unknown; x?: unknown; y?: unknown };
  return (
    Number.isFinite(routePoint.nodeId) &&
    Number.isFinite(routePoint.x) &&
    Number.isFinite(routePoint.y)
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
      <circle cx={point.x} cy={point.y} r={radius} fill={fill} stroke="#fff" strokeWidth="2" />
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

export default RouteMap;
