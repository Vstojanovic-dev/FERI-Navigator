export type RouteGeometryPoint = {
  nodeId: number;
  x: number;
  y: number;
};

export type RouteGeometryStep = {
  fromNodeId: number;
  toNodeId: number;
};

export type ActiveStepGeometry = {
  stepPoints: RouteGeometryPoint[];
  directDistance: number;
  polylineLength: number;
  pathToDirectRatio: number;
  maxDeviation: number;
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

export type StepResolutionStrategy = 'strict' | 'boundary-entry' | 'boundary-exit';

export type StepPathBounds = {
  fromIndex: number;
  toIndex: number;
  strategy: StepResolutionStrategy;
};

const EPSILON = 1e-6;

export const DIRECT_LINE_MIN_POINTS = 2;
export const DIRECT_LINE_MAX_DEVIATION = 12;
export const DIRECT_LINE_MAX_LENGTH_RATIO = 1.05;
export const DIRECT_LINE_MAX_TURN_ANGLE_DEG = 18;

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

  const turnAngles: number[] = [];
  for (let i = 1; i < stepPoints.length - 1; i += 1) {
    turnAngles.push(turnAngleDeg(stepPoints[i - 1], stepPoints[i], stepPoints[i + 1]));
  }

  const maxTurnAngleDeg = turnAngles.length > 0 ? Math.max(...turnAngles) : 0;
  const isGroupedStep = stepPoints.length > DIRECT_LINE_MIN_POINTS;
  const renderMode =
    stepPoints.length === DIRECT_LINE_MIN_POINTS ||
    (directDistance >= EPSILON &&
      maxDeviation <= DIRECT_LINE_MAX_DEVIATION &&
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
    maxTurnAngleDeg,
    isGroupedStep,
    renderMode,
  };
}

export function isSuspiciousGroupedStep(geometry: ActiveStepGeometry): boolean {
  return geometry.isGroupedStep && geometry.renderMode === 'polyline';
}

function collectMatchingIndices(
  path: RouteGeometryPoint[],
  nodeId: number,
  fromIndex: number
): number[] {
  const matches: number[] = [];
  for (let index = fromIndex; index < path.length; index += 1) {
    if (path[index]?.nodeId === nodeId) {
      matches.push(index);
    }
  }
  return matches;
}

function findFirstIndex(path: RouteGeometryPoint[], nodeId: number): number {
  return path.findIndex((point) => point.nodeId === nodeId);
}

function findLastIndex(path: RouteGeometryPoint[], nodeId: number): number {
  for (let index = path.length - 1; index >= 0; index -= 1) {
    if (path[index]?.nodeId === nodeId) {
      return index;
    }
  }
  return -1;
}

function resolveSingleStrictStep(
  path: RouteGeometryPoint[],
  step: RouteGeometryStep | undefined
): StepPathBounds | null {
  if (!step) {
    return null;
  }

  const fromMatches = collectMatchingIndices(path, step.fromNodeId, 0);
  for (const fromIndex of fromMatches) {
    const toMatches = collectMatchingIndices(path, step.toNodeId, fromIndex);
    for (const toIndex of toMatches) {
      return {
        fromIndex,
        toIndex,
        strategy: 'strict',
      };
    }
  }

  return null;
}

function resolveBoundaryEntryStep(
  path: RouteGeometryPoint[],
  steps: RouteGeometryStep[],
  stepIndex: number
): StepPathBounds | null {
  if (stepIndex !== 0 || path.length === 0) {
    return null;
  }

  const step = steps[stepIndex];
  if (!step) {
    return null;
  }

  const fromIndex = findFirstIndex(path, step.fromNodeId);
  const toIndex = findFirstIndex(path, step.toNodeId);

  if (fromIndex >= 0 || toIndex < 0) {
    return null;
  }

  const visibleToIndex =
    toIndex === 0 && path.length > 1
      ? 1
      : toIndex;

  return {
    fromIndex: 0,
    toIndex: visibleToIndex,
    strategy: 'boundary-entry',
  };
}

function resolveBoundaryExitStep(
  path: RouteGeometryPoint[],
  steps: RouteGeometryStep[],
  stepIndex: number
): StepPathBounds | null {
  if (stepIndex !== steps.length - 1 || path.length === 0) {
    return null;
  }

  const step = steps[stepIndex];
  if (!step) {
    return null;
  }

  const fromIndex = findLastIndex(path, step.fromNodeId);
  const toIndex = findLastIndex(path, step.toNodeId);

  if (fromIndex < 0 || toIndex >= 0) {
    return null;
  }

  const visibleFromIndex =
    fromIndex === path.length - 1 && path.length > 1
      ? path.length - 2
      : fromIndex;

  return {
    fromIndex: visibleFromIndex,
    toIndex: path.length - 1,
    strategy: 'boundary-exit',
  };
}

function resolveStepBoundsRecursive(
  path: RouteGeometryPoint[],
  steps: RouteGeometryStep[],
  stepIndex: number,
  searchStartIndex: number,
  previousBounds: StepPathBounds | null,
  previousStep: RouteGeometryStep | null
): StepPathBounds[] | null {
  if (stepIndex >= steps.length) {
    return [];
  }

  const step = steps[stepIndex];
  if (!step || !Number.isFinite(step.fromNodeId) || !Number.isFinite(step.toNodeId)) {
    return null;
  }

  const canReuseBoundaryNode =
    previousBounds &&
    previousStep &&
    previousStep.toNodeId === step.fromNodeId;
  const minimumFromIndex =
    previousBounds && !canReuseBoundaryNode
      ? Math.min(previousBounds.toIndex + 1, path.length)
      : searchStartIndex;
  const fromMatches = collectMatchingIndices(path, step.fromNodeId, minimumFromIndex);

  for (const fromIndex of fromMatches) {
    const toMatches = collectMatchingIndices(path, step.toNodeId, fromIndex);
    for (const toIndex of toMatches) {
      const bounds: StepPathBounds = { fromIndex, toIndex, strategy: 'strict' };
      const remainder = resolveStepBoundsRecursive(
        path,
        steps,
        stepIndex + 1,
        toIndex,
        bounds,
        step
      );
      if (remainder) {
        return [bounds, ...remainder];
      }
    }
  }

  return null;
}

export function resolveStepPathBounds(
  path: RouteGeometryPoint[],
  steps: RouteGeometryStep[]
): Array<StepPathBounds | null> {
  if (!Array.isArray(path) || !Array.isArray(steps) || path.length === 0 || steps.length === 0) {
    return steps.map(() => null);
  }

  const strictResolved = resolveStepBoundsRecursive(path, steps, 0, 0, null, null);
  if (strictResolved) {
    return strictResolved;
  }

  return steps.map((step, stepIndex) => {
    const singleStrict = resolveSingleStrictStep(path, step);
    if (singleStrict) {
      return singleStrict;
    }

    const entryFallback = resolveBoundaryEntryStep(path, steps, stepIndex);
    if (entryFallback) {
      return entryFallback;
    }

    const exitFallback = resolveBoundaryExitStep(path, steps, stepIndex);
    if (exitFallback) {
      return exitFallback;
    }

    return null;
  });
}

export function resolveActiveStepGeometry(
  path: RouteGeometryPoint[],
  steps: RouteGeometryStep[],
  activeStepIndex: number
): ActiveStepGeometry {
  const bounds = resolveStepPathBounds(path, steps);
  const activeBounds = bounds[activeStepIndex];

  if (!activeBounds) {
    return analyzeActiveStepGeometry([]);
  }

  return analyzeActiveStepGeometry(path.slice(activeBounds.fromIndex, activeBounds.toIndex + 1));
}
