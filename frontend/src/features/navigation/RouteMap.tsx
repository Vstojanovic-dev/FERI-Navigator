import { useMemo } from 'react';
import { resolveAssetUrl } from '../../services/api';
import type { RouteSegment } from '../../types/navigation';
import styles from './NavigationView.module.css';

type RouteMapProps = {
  segment: RouteSegment;
  activeStepIndex: number;
};

function RouteMap({ segment, activeStepIndex }: RouteMapProps) {
  const pathPoints = useMemo(
    () => segment.path.map((point) => `${point.x},${point.y}`).join(' '),
    [segment.path]
  );
  const activeStep = segment.steps[activeStepIndex];
  const activeFrom = segment.path.find((point) => point.nodeId === activeStep?.fromNodeId);
  const activeTo = segment.path.find((point) => point.nodeId === activeStep?.toNodeId);
  const activeFromIndex = segment.path.findIndex((point) => point.nodeId === activeStep?.fromNodeId);
  const activeToIndex = segment.path.findIndex((point) => point.nodeId === activeStep?.toNodeId);
  const donePoints =
    activeFromIndex >= 0
      ? segment.path
          .slice(0, activeFromIndex + 1)
          .map((point) => `${point.x},${point.y}`)
          .join(' ')
      : '';
  const remainingPoints =
    activeFromIndex >= 0
      ? segment.path
          .slice(activeFromIndex)
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
        {imageUrl && <img src={imageUrl} alt={`${segment.buildingName} ${segment.floorLabel}`} className={styles.mapImage} />}
        <svg
          viewBox={`0 0 ${segment.coordinateWidth} ${segment.coordinateHeight}`}
          className={styles.mapOverlay}
          aria-hidden="true"
        >
          <polyline
            points={pathPoints}
            fill="none"
            stroke="#d6e0ec"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="14"
            opacity="0.78"
          />
          {remainingPoints && (
            <polyline
              points={remainingPoints}
              fill="none"
              stroke="#f09d18"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="11"
              strokeDasharray="2 0"
              opacity="0.9"
            />
          )}
          {donePoints && (
            <polyline
              points={donePoints}
              fill="none"
              stroke="#172033"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="11"
              opacity="0.56"
            />
          )}
          {activeFrom && activeTo && (
            <line
              x1={activeFrom.x}
              y1={activeFrom.y}
              x2={activeTo.x}
              y2={activeTo.y}
              stroke="#2563eb"
              strokeLinecap="round"
              strokeWidth="16"
              opacity="0.98"
            />
          )}
          {segment.path[0] && <RouteMarker point={segment.path[0]} label="A" fill="#172033" />}
          {segment.path.at(-1) && <RouteMarker point={segment.path.at(-1)!} label="B" fill="#f09d18" />}
          {activeTo && <RouteMarker point={activeTo} label="" fill="#1d4ed8" radius={9} />}
          {activeFromIndex >= 0 && segment.path[activeFromIndex] && (
            <RouteMarker point={segment.path[activeFromIndex]} label="" fill="#172033" radius={8} />
          )}
          {activeToIndex >= 0 && segment.path[activeToIndex] && (
            <circle cx={segment.path[activeToIndex].x} cy={segment.path[activeToIndex].y} r="14" fill="#1d4ed8" opacity="0.2" />
          )}
          {activeTo && <circle cx={activeTo.x} cy={activeTo.y} r="18" fill="#1d4ed8" opacity="0.12" />}
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
        <text x={point.x} y={point.y + 4} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="800">
          {label}
        </text>
      )}
    </>
  );
}

export default RouteMap;
