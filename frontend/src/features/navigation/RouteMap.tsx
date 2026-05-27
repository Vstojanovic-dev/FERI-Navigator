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
          {segment.path.at(-1) && <RouteMarker point={segment.path.at(-1)!} label="B" fill="#f09d18" />}
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
        <text x={point.x} y={point.y + 4} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="800">
          {label}
        </text>
      )}
    </>
  );
}

export default RouteMap;
