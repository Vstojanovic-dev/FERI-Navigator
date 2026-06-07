export type RouteGeometryPoint = {
  nodeId: number;
  x: number;
  y: number;
};

export type ActiveStepGeometry = {
  stepPoints: RouteGeometryPoint[];
  directDistance: number;
  polylineLength: number;
  pathToDirectRatio: number;
  maxDeviation: number;
  maxDeviationRatio: number;
  maxTurnAngleDeg: number;
  isGroupedStep: boolean;
  renderMode: 'direct' | 'polyline' | 'none';
};

export type SuspiciousStepZone = {
  stepIndex: number;
  fromNodeId: number;
  toNodeId: number;
  pointCount: number;
  maxDeviation: number;
  pathToDirectRatio: number;
  maxTurnAngleDeg: number;
};

const EPSILON = 1e-6;

export const DIRECT_LINE_MIN_POINTS = 2;
export const DIRECT_LINE_MAX_DEVIATION_RATIO = 0.08;
export const DIRECT_LINE_MAX_LENGTH_RATIO = 1.05;
export const DIRECT_LINE_MAX_TURN_ANGLE_DEG = 18;

export function getStepPathPointsByIndex(
  path: RouteGeometryPoint[],
  fromIndex: number | undefined,
  toIndex: number | undefined
): RouteGeometryPoint[] {
  if (
    !Number.isInteger(fromIndex) ||
    !Number.isInteger(toIndex) ||
    fromIndex === undefined ||
    toIndex === undefined ||
    fromIndex < 0 ||
    toIndex < fromIndex ||
    toIndex >= path.length
  ) {
    return [];
  }

  return path.slice(fromIndex, toIndex + 1);
}

function distance(a: RouteGeometryPoint, b: RouteGeometryPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function getPolylineLength(points: RouteGeometryPoint[]): number {
  return points.slice(1).reduce((sum, point, index) => sum + distance(points[index], point), 0);
}

function distanceFromLine(
  point: RouteGeometryPoint,
  start: RouteGeometryPoint,
  end: RouteGeometryPoint
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const denominator = Math.hypot(dx, dy);

  if (denominator < EPSILON) {
    return 0;
  }

  return Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x) / denominator;
}

function turnAngleDeg(
  previous: RouteGeometryPoint,
  current: RouteGeometryPoint,
  next: RouteGeometryPoint
): number {
  const ax = current.x - previous.x;
  const ay = current.y - previous.y;
  const bx = next.x - current.x;
  const by = next.y - current.y;

  const aLength = Math.hypot(ax, ay);
  const bLength = Math.hypot(bx, by);

  if (aLength < EPSILON || bLength < EPSILON) {
    return 0;
  }

  const cosine = (ax * bx + ay * by) / (aLength * bLength);
  const normalized = Math.max(-1, Math.min(1, cosine));
  return Math.acos(normalized) * (180 / Math.PI);
}

export function analyzeActiveStepGeometry(stepPoints: RouteGeometryPoint[]): ActiveStepGeometry {
  if (stepPoints.length < DIRECT_LINE_MIN_POINTS) {
    return {
      stepPoints,
      directDistance: 0,
      polylineLength: 0,
      pathToDirectRatio: 0,
      maxDeviation: 0,
      maxDeviationRatio: 0,
      maxTurnAngleDeg: 0,
      isGroupedStep: false,
      renderMode: 'none',
    };
  }

  const start = stepPoints[0];
  const end = stepPoints[stepPoints.length - 1];
  const directDistance = distance(start, end);
  const polylineLength = getPolylineLength(stepPoints);
  const pathToDirectRatio =
    directDistance < EPSILON ? Number.POSITIVE_INFINITY : polylineLength / directDistance;
  const deviations = stepPoints.slice(1, -1).map((point) => distanceFromLine(point, start, end));
  const maxDeviation = deviations.length > 0 ? Math.max(...deviations) : 0;
  const maxDeviationRatio = directDistance < EPSILON ? Number.POSITIVE_INFINITY : maxDeviation / directDistance;

  const turnAngles: number[] = [];
  for (let i = 1; i < stepPoints.length - 1; i += 1) {
    turnAngles.push(turnAngleDeg(stepPoints[i - 1], stepPoints[i], stepPoints[i + 1]));
  }

  const maxTurnAngleDeg = turnAngles.length > 0 ? Math.max(...turnAngles) : 0;
  const isGroupedStep = stepPoints.length > DIRECT_LINE_MIN_POINTS;
  const renderMode =
    stepPoints.length === DIRECT_LINE_MIN_POINTS ||
    (directDistance >= EPSILON &&
      maxDeviationRatio <= DIRECT_LINE_MAX_DEVIATION_RATIO &&
      pathToDirectRatio <= DIRECT_LINE_MAX_LENGTH_RATIO &&
      maxTurnAngleDeg <= DIRECT_LINE_MAX_TURN_ANGLE_DEG)
      ? 'direct'
      : 'polyline';

  return {
    stepPoints,
    directDistance,
    polylineLength,
    pathToDirectRatio,
    maxDeviation,
    maxDeviationRatio,
    maxTurnAngleDeg,
    isGroupedStep,
    renderMode,
  };
}

export function isSuspiciousGroupedStep(geometry: ActiveStepGeometry): boolean {
  return geometry.isGroupedStep && geometry.renderMode === 'polyline';
}
