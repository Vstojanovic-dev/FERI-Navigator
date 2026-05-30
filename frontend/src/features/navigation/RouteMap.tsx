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
  const activeFromIndex = segment.path.findIndex(
    (point) => point.nodeId === activeStep?.fromNodeId
  );
  const activeToIndex = segment.path.findIndex((point) => point.nodeId === activeStep?.toNodeId);
  const donePoints =
    activeFromIndex >= 0
      ? segment.path
          .slice(0, activeFromIndex + 1)
          .map((point) => `${point.x},${point.y}`)
          .join(' ')
      : '';
  const activePoints =
    activeFromIndex >= 0 && activeToIndex >= activeFromIndex
      ? segment.path
          .slice(activeFromIndex, activeToIndex + 1)
          .map((point) => `${point.x},${point.y}`)
          .join(' ')
      : '';
  const remainingPoints =
    activeToIndex >= 0
      ? segment.path
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
          viewBox={`0 0 ${segment.coordinateWidth} ${segment.coordinateHeight}`}
          className={styles.mapOverlay}
          aria-hidden="true"
        >
          <polyline
            points={pathPoints}
            fill="none"
            stroke="#cbd5e1"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="10"
            opacity="0.55"
          />
          {remainingPoints && activeToIndex < segment.path.length - 1 && (
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
          {donePoints && (
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
          {segment.path[0] && <RouteMarker point={segment.path[0]} label="A" fill="#64748b" />}
          {segment.path.at(-1) && (
            <RouteMarker point={segment.path.at(-1)!} label="B" fill="#dc2626" />
          )}
          {activeTo && <RouteMarker point={activeTo} label="" fill="#dc2626" radius={11} />}
          {activeTo && (
            <circle cx={activeTo.x} cy={activeTo.y} r="22" fill="#dc2626" opacity="0.22" />
          )}
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
