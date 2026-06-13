import { useEffect, useMemo } from 'react';
import { resolveAssetUrl } from '../../services/api';
import type { RouteSegment } from '../../types/navigation';
import { getSegmentViewport } from './mapViewport';
import { resolveActiveStepGeometry, resolveStepPathBounds } from './routeGeometry';
import styles from './NavigationView.module.css';

type RouteMapProps = {
  segment: RouteSegment;
  activeStepIndex: number;
};

function RouteMap({ segment, activeStepIndex }: RouteMapProps) {
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
  const stepBounds = useMemo(
    () => resolveStepPathBounds(safePath, safeSteps),
    [safePath, safeSteps]
  );
  const activeBounds = stepBounds[activeStepIndex] ?? null;
  const activeFromIndex = activeBounds?.fromIndex ?? -1;
  const activeToIndex = activeBounds?.toIndex ?? -1;
  const activeGeometry = useMemo(
    () => resolveActiveStepGeometry(safePath, safeSteps, activeStepIndex),
    [activeStepIndex, safePath, safeSteps]
  );
  const activeStepPoints = useMemo(
    () => activeGeometry.stepPoints.map((point) => `${point.x},${point.y}`).join(' '),
    [activeGeometry.stepPoints]
  );
  const activeStepStart = activeGeometry.stepPoints[0];
  const activeStepEnd = activeGeometry.stepPoints.at(-1);
  const activeMarkerPoint = activeStepEnd ?? null;
  const shouldWarnSuspiciousActiveStep =
    import.meta.env.DEV && activeGeometry.isGroupedStep && activeGeometry.renderMode === 'polyline';

  useEffect(() => {
    if (!shouldWarnSuspiciousActiveStep) {
      return;
    }

    console.warn('[route-geometry:suspicious-step]', {
      buildingCode: segment.buildingCode,
      floorCode: segment.floorCode,
      floorLabel: segment.floorLabel,
      stepIndex: activeStep?.index ?? activeStepIndex,
      fromNodeId: activeStep?.fromNodeId,
      toNodeId: activeStep?.toNodeId,
      pointCount: activeGeometry.stepPoints.length,
      maxDeviation: activeGeometry.maxDeviation,
      pathToDirectRatio: activeGeometry.pathToDirectRatio,
      maxTurnAngleDeg: activeGeometry.maxTurnAngleDeg,
      points: activeGeometry.stepPoints,
    });
  }, [
    activeGeometry.maxDeviation,
    activeGeometry.maxTurnAngleDeg,
    activeGeometry.pathToDirectRatio,
    activeGeometry.stepPoints,
    activeStep?.fromNodeId,
    activeStep?.index,
    activeStep?.toNodeId,
    activeStepIndex,
    segment.buildingCode,
    segment.floorCode,
    segment.floorLabel,
    shouldWarnSuspiciousActiveStep,
  ]);
  const donePoints =
    activeFromIndex >= 0
      ? safePath
          .slice(0, activeFromIndex + 1)
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
  const viewport = getSegmentViewport(segment);

  return (
    <div className={styles.mapPanel}>
      <div className={styles.mapTitleRow}>
        <p className={styles.mapTitle}>{segment.buildingName}</p>
        <p className={styles.mapMeta}>{segment.floorLabel}</p>
      </div>
      <div className={styles.mapViewport} style={{ aspectRatio: viewport.aspectRatio }}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={`${segment.buildingName} ${segment.floorLabel}`}
            className={styles.mapImage}
            style={{
              width: `${viewport.imageScaleX * 100}%`,
              height: `${viewport.imageScaleY * 100}%`,
              left: `${viewport.imageTranslateXPercent}%`,
              top: `${viewport.imageTranslateYPercent}%`,
              maxWidth: 'none',
            }}
          />
        )}
        <svg
          viewBox={`${viewport.viewBoxX} ${viewport.viewBoxY} ${viewport.viewBoxWidth} ${viewport.viewBoxHeight}`}
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
          {activeGeometry.renderMode === 'polyline' && activeStepPoints && (
            <polyline
              data-testid="active-step-polyline"
              points={activeStepPoints}
              fill="none"
              stroke="#dc2626"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="20"
              opacity="1"
            />
          )}
          {activeGeometry.renderMode === 'direct' && activeStepStart && activeStepEnd && (
            <line
              data-testid="active-step-direct-line"
              x1={activeStepStart.x}
              y1={activeStepStart.y}
              x2={activeStepEnd.x}
              y2={activeStepEnd.y}
              stroke="#dc2626"
              strokeLinecap="round"
              strokeWidth="22"
              opacity="1"
            />
          )}
          {safePath[0] && <RouteMarker point={safePath[0]} label="A" fill="#64748b" />}
          {safePath.at(-1) && <RouteMarker point={safePath.at(-1)!} label="B" fill="#dc2626" />}
          {activeMarkerPoint && (
            <RouteMarker point={activeMarkerPoint} label="" fill="#dc2626" radius={11} />
          )}
          {activeMarkerPoint && (
            <circle
              cx={activeMarkerPoint.x}
              cy={activeMarkerPoint.y}
              r="22"
              fill="#dc2626"
              opacity="0.22"
            />
          )}
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
