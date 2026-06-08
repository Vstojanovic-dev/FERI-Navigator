# Route Step Geometry Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the duplicated active-step rendering bug across all route segments by making each grouped step render in exactly one mode: a single direct line for geometrically straight chunks, or a single polyline that follows the actual waypoint chain for bent chunks.

**Architecture:** Keep backend step grouping unchanged. Add a dedicated frontend geometry analyzer that inspects the actual path slice between `fromNodeId` and `toNodeId`, computes deviation/length/turn metrics, and decides whether the active step should render as `direct` or `polyline`. `RouteMap` will use that result to render one active red shape only, and will emit development-time diagnostics for grouped-but-not-line-safe steps so QA can identify problematic map zones generically across all buildings and floors.

**Tech Stack:** React 19, TypeScript, SVG overlays, Vite, Playwright end-to-end tests, existing route DTOs.

---

## File Structure

**Create:**
- `frontend/src/features/navigation/routeGeometry.ts`
- `frontend/tests/fixtures/routeStepGeometryFixtures.ts`
- `frontend/tests/navigation-step-rendering.spec.ts`

**Modify:**
- `frontend/src/features/navigation/RouteMap.tsx`
- `frontend/tests/app-smoke.spec.ts`

**Why these files:**
- `routeGeometry.ts` isolates the root-cause analysis logic from rendering, so geometry rules are explicit and reusable.
- `RouteMap.tsx` is the only production rendering site where the doubled active-step shape appears.
- `routeStepGeometryFixtures.ts` keeps the problematic-step fixtures readable and reusable across tests.
- `navigation-step-rendering.spec.ts` verifies the two acceptance rules directly: straight chunk renders only a direct line; bent chunk renders only the waypoint-following polyline.
- `app-smoke.spec.ts` remains the broad regression check for the navigation page shell and route flow.

---

## Root Cause Summary

The current bug is not that the backend groups too many steps by itself. The visible failure happens because the frontend renders **both**:

1. the active grouped-step polyline through the actual intermediate path points, and
2. a second red direct `<line>` from `fromNodeId` to `toNodeId`.

For straight chunks, the duplication is mostly hidden because the two shapes overlap. For bent chunks, the direct `<line>` cuts through walls and produces the “double image” seen in G2 and potentially in any other segment whose grouped step contains a bend.

The implementation must preserve one grouped instruction step while making the active red overlay exclusive:

- `direct` mode: render only the start-to-end line
- `polyline` mode: render only the true waypoint-following path

Never both.

---

## Geometry Rules

The analyzer must be generic across all segments, not G2-specific.

Use the path slice between `step.fromNodeId` and `step.toNodeId` as the only geometric truth for the active grouped step.

For each active step, compute:

- `stepPoints`: ordered route points from `fromNodeId` through all intermediate nodes to `toNodeId`
- `directDistance`: Euclidean distance from first point to last point
- `polylineLength`: sum of distances across all consecutive step points
- `pathToDirectRatio`: `polylineLength / directDistance`
- `maxDeviation`: maximum perpendicular distance of any intermediate point from the direct start-end line
- `maxTurnAngleDeg`: maximum interior turn angle between consecutive step segments
- `isGroupedStep`: `stepPoints.length > 2`

Recommended initial thresholds:

- `DIRECT_LINE_MIN_POINTS = 2`
- `DIRECT_LINE_MAX_DEVIATION = 12`
- `DIRECT_LINE_MAX_LENGTH_RATIO = 1.05`
- `DIRECT_LINE_MAX_TURN_ANGLE_DEG = 18`

Final render rule:

- If `stepPoints.length < 2`: render nothing active
- If `stepPoints.length === 2`: render `direct`
- If `stepPoints.length > 2` and all thresholds pass: render `direct`
- Otherwise: render `polyline`

These values should live in one file as exported constants so they can be tuned without hunting through JSX.

---

### Task 1: Create A Dedicated Step Geometry Analyzer

**Files:**
- Create: `frontend/src/features/navigation/routeGeometry.ts`

- [ ] **Step 1: Create explicit geometry types and thresholds**

```ts
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
  maxTurnAngleDeg: number;
  isGroupedStep: boolean;
  renderMode: 'direct' | 'polyline' | 'none';
};

export const DIRECT_LINE_MAX_DEVIATION = 12;
export const DIRECT_LINE_MAX_LENGTH_RATIO = 1.05;
export const DIRECT_LINE_MAX_TURN_ANGLE_DEG = 18;
```

- [ ] **Step 2: Implement a safe path-slice extractor from `fromNodeId` to `toNodeId`**

```ts
export function getStepPathPoints(
  path: RouteGeometryPoint[],
  fromNodeId: number | undefined,
  toNodeId: number | undefined
): RouteGeometryPoint[] {
  const fromIndex = path.findIndex((point) => point.nodeId === fromNodeId);
  const toIndex = path.findIndex((point) => point.nodeId === toNodeId);

  if (fromIndex < 0 || toIndex < fromIndex) {
    return [];
  }

  return path.slice(fromIndex, toIndex + 1);
}
```

- [ ] **Step 3: Implement the metric primitives**

```ts
function distance(a: RouteGeometryPoint, b: RouteGeometryPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function polylineLength(points: RouteGeometryPoint[]): number {
  return points.slice(1).reduce((sum, point, index) => {
    return sum + distance(points[index], point);
  }, 0);
}

function distanceFromLine(
  point: RouteGeometryPoint,
  start: RouteGeometryPoint,
  end: RouteGeometryPoint
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const denominator = Math.hypot(dx, dy);

  if (denominator < 1e-6) {
    return 0;
  }

  return Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x) / denominator;
}
```

- [ ] **Step 4: Implement the turn-angle metric**

```ts
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

  if (aLength < 1e-6 || bLength < 1e-6) {
    return 0;
  }

  const cosine = (ax * bx + ay * by) / (aLength * bLength);
  const normalized = Math.max(-1, Math.min(1, cosine));
  return Math.acos(normalized) * (180 / Math.PI);
}
```

- [ ] **Step 5: Implement the final analyzer that returns one render mode**

```ts
export function analyzeActiveStepGeometry(
  path: RouteGeometryPoint[],
  fromNodeId: number | undefined,
  toNodeId: number | undefined
): ActiveStepGeometry {
  const stepPoints = getStepPathPoints(path, fromNodeId, toNodeId);

  if (stepPoints.length < 2) {
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
  const totalPolylineLength = polylineLength(stepPoints);
  const ratio = directDistance < 1e-6 ? Number.POSITIVE_INFINITY : totalPolylineLength / directDistance;
  const deviations = stepPoints.slice(1, -1).map((point) => distanceFromLine(point, start, end));
  const maxDeviation = deviations.length > 0 ? Math.max(...deviations) : 0;

  const turnAngles: number[] = [];
  for (let i = 1; i < stepPoints.length - 1; i += 1) {
    turnAngles.push(turnAngleDeg(stepPoints[i - 1], stepPoints[i], stepPoints[i + 1]));
  }
  const maxTurnAngleDeg = turnAngles.length > 0 ? Math.max(...turnAngles) : 0;

  const isGroupedStep = stepPoints.length > 2;
  const isDirectSafe =
    stepPoints.length === 2 ||
    (
      directDistance >= 1e-6 &&
      maxDeviation <= DIRECT_LINE_MAX_DEVIATION &&
      ratio <= DIRECT_LINE_MAX_LENGTH_RATIO &&
      maxTurnAngleDeg <= DIRECT_LINE_MAX_TURN_ANGLE_DEG
    );

  return {
    stepPoints,
    directDistance,
    polylineLength: totalPolylineLength,
    pathToDirectRatio: ratio,
    maxDeviation,
    maxTurnAngleDeg,
    isGroupedStep,
    renderMode: isDirectSafe ? 'direct' : 'polyline',
  };
}
```

- [ ] **Step 6: Add a generic suspicious-zone helper for debugging**

```ts
export type SuspiciousStepZone = {
  stepIndex: number;
  fromNodeId: number;
  toNodeId: number;
  pointCount: number;
  maxDeviation: number;
  pathToDirectRatio: number;
  maxTurnAngleDeg: number;
};

export function isSuspiciousGroupedStep(geometry: ActiveStepGeometry): boolean {
  return geometry.isGroupedStep && geometry.renderMode === 'polyline';
}
```

- [ ] **Step 7: Run a compile check**

Run: `npm.cmd --prefix frontend run build`

Expected: frontend build succeeds with the new helper file compiled and imported nowhere yet.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/features/navigation/routeGeometry.ts
git commit -m "refactor: add route step geometry analyzer"
```

---

### Task 2: Use Geometry Analysis To Identify Problematic Zones At Runtime

**Files:**
- Modify: `frontend/src/features/navigation/RouteMap.tsx`

- [ ] **Step 1: Replace ad hoc active-step path slicing with `analyzeActiveStepGeometry`**

```ts
import {
  analyzeActiveStepGeometry,
  isSuspiciousGroupedStep,
} from './routeGeometry';
```

```ts
const activeGeometry = useMemo(
  () => analyzeActiveStepGeometry(safePath, activeStep?.fromNodeId, activeStep?.toNodeId),
  [safePath, activeStep?.fromNodeId, activeStep?.toNodeId]
);

const activeStepPoints = activeGeometry.stepPoints;
const activePoints = useMemo(
  () => activeStepPoints.map((point) => `${point.x},${point.y}`).join(' '),
  [activeStepPoints]
);
```

- [ ] **Step 2: Add a development-only diagnostic for suspicious grouped steps**

```ts
useMemo(() => {
  if (!import.meta.env.DEV) {
    return;
  }

  if (!activeStep || !isSuspiciousGroupedStep(activeGeometry)) {
    return;
  }

  console.warn('[route-geometry:suspicious-step]', {
    buildingCode: segment.buildingCode,
    floorCode: segment.floorCode,
    floorLabel: segment.floorLabel,
    stepIndex: activeStep.index,
    fromNodeId: activeStep.fromNodeId,
    toNodeId: activeStep.toNodeId,
    pointCount: activeGeometry.stepPoints.length,
    maxDeviation: activeGeometry.maxDeviation,
    pathToDirectRatio: activeGeometry.pathToDirectRatio,
    maxTurnAngleDeg: activeGeometry.maxTurnAngleDeg,
    points: activeGeometry.stepPoints,
  });
}, [activeGeometry, activeStep, segment.buildingCode, segment.floorCode, segment.floorLabel]);
```

If the repo’s lint rules reject `useMemo` for side effects, convert this exact logic into `useEffect` instead.

- [ ] **Step 3: Add stable SVG test hooks so Playwright can assert the active render mode**

```tsx
{activeGeometry.renderMode === 'polyline' && activePoints && (
  <polyline
    data-testid="active-step-polyline"
    points={activePoints}
    fill="none"
    stroke="#dc2626"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="20"
    opacity="1"
  />
)}
```

```tsx
{activeGeometry.renderMode === 'direct' && activeFrom && activeTo && (
  <line
    data-testid="active-step-direct-line"
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
```

- [ ] **Step 4: Remove the doubled active-step rendering**

Delete the old unconditional active `<polyline>` + unconditional active `<line>` combination. After the change, the active red shape must be rendered from `activeGeometry.renderMode` only.

- [ ] **Step 5: Preserve all non-active route overlays**

Do **not** change:

- the gray full-route background polyline
- the blue-gray remaining-route polyline
- the already-completed polyline
- the start/end markers
- the segment viewport math

Only the active red overlay logic changes in this task.

- [ ] **Step 6: Build after the render refactor**

Run: `npm.cmd --prefix frontend run build`

Expected: build succeeds and `RouteMap.tsx` compiles with exactly one active render mode.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/navigation/RouteMap.tsx
git commit -m "fix: render active route step in one geometry mode"
```

---

### Task 3: Add Deterministic Fixtures For Straight And Bent Grouped Steps

**Files:**
- Create: `frontend/tests/fixtures/routeStepGeometryFixtures.ts`

- [ ] **Step 1: Create a straight grouped-step fixture**

```ts
export const straightGroupedRoute = {
  routeId: 'straight-grouped',
  from: { /* reuse minimal valid location dto */ },
  to: { /* reuse minimal valid location dto */ },
  totalCost: 10,
  segments: [
    {
      index: 0,
      buildingId: 1,
      buildingCode: 'TEST',
      buildingName: 'Straight Building',
      floorId: 1,
      floorCode: 'floor_1',
      floorLabel: 'Floor 1',
      mapImageUrl: '/maps/1_pritlicje.png',
      coordinateWidth: 1000,
      coordinateHeight: 800,
      z: 0,
      usesElevator: false,
      usesStairs: false,
      path: [
        { nodeId: 1, externalId: 'A', label: 'A', nodeType: 'corridor', x: 100, y: 100, z: 0 },
        { nodeId: 2, externalId: 'B', label: 'B', nodeType: 'corridor', x: 180, y: 102, z: 0 },
        { nodeId: 3, externalId: 'C', label: 'C', nodeType: 'corridor', x: 260, y: 104, z: 0 },
      ],
      steps: [
        {
          index: 0,
          text: 'Nadaljujte po hodniku.',
          fromNodeId: 1,
          toNodeId: 3,
          type: 'corridor',
          icon: 'straight',
          maneuverType: 'straight',
          zoneId: null,
        },
      ],
    },
  ],
};
```

- [ ] **Step 2: Create a bent grouped-step fixture that reproduces the bug shape**

```ts
export const bentGroupedRoute = {
  routeId: 'bent-grouped',
  from: { /* same minimal dto shape */ },
  to: { /* same minimal dto shape */ },
  totalCost: 10,
  segments: [
    {
      index: 0,
      buildingId: 2,
      buildingCode: 'TEST',
      buildingName: 'Bent Building',
      floorId: 2,
      floorCode: 'floor_2',
      floorLabel: 'Floor 2',
      mapImageUrl: '/maps/1_pritlicje.png',
      coordinateWidth: 1000,
      coordinateHeight: 800,
      z: 0,
      usesElevator: false,
      usesStairs: false,
      path: [
        { nodeId: 10, externalId: 'A', label: 'A', nodeType: 'corridor', x: 800, y: 550, z: 0 },
        { nodeId: 11, externalId: 'B', label: 'B', nodeType: 'corridor', x: 790, y: 470, z: 0 },
        { nodeId: 12, externalId: 'C', label: 'C', nodeType: 'corridor', x: 760, y: 430, z: 0 },
        { nodeId: 13, externalId: 'D', label: 'D', nodeType: 'corridor', x: 760, y: 360, z: 0 },
      ],
      steps: [
        {
          index: 0,
          text: 'Nadaljujte po hodniku.',
          fromNodeId: 10,
          toNodeId: 13,
          type: 'corridor',
          icon: 'straight',
          maneuverType: 'straight',
          zoneId: null,
        },
      ],
    },
  ],
};
```

- [ ] **Step 3: Export a fixture list for audit-style testing**

```ts
export const routeGeometryFixtures = [
  { name: 'straight-grouped', route: straightGroupedRoute, expectedMode: 'direct' },
  { name: 'bent-grouped', route: bentGroupedRoute, expectedMode: 'polyline' },
];
```

- [ ] **Step 4: Verify the fixture file compiles**

Run: `npm.cmd --prefix frontend run build`

Expected: fixture file imports cleanly and no DTO shape mismatch appears.

- [ ] **Step 5: Commit**

```bash
git add frontend/tests/fixtures/routeStepGeometryFixtures.ts
git commit -m "test: add route step geometry fixtures"
```

---

### Task 4: Cover Straight And Bent Active-Step Rendering With Playwright

**Files:**
- Create: `frontend/tests/navigation-step-rendering.spec.ts`

- [ ] **Step 1: Create a shared helper that mounts navigation with a mocked route**

```ts
async function mockNavigationRoute(page: Page, routeResponse: unknown) {
  await page.route('**/api/navigation/locations**', async (route) => {
    await route.fulfill({ json: mockedLocations });
  });

  await page.route('**/api/navigation/route**', async (route) => {
    await route.fulfill({ json: routeResponse });
  });
}
```

- [ ] **Step 2: Add the straight-step acceptance test**

```ts
test('renders only the direct active line for a geometrically straight grouped step', async ({ page }) => {
  await mockNavigationRoute(page, straightGroupedRoute);
  await page.goto('/navigacija');

  await page.locator('#start-location').fill('Start');
  await page.getByRole('button', { name: /Start/i }).click();
  await page.locator('#target-location').fill('End');
  await page.getByRole('button', { name: /End/i }).click();
  await page.getByTestId('show-route-button').click();

  await expect(page.getByTestId('active-step-direct-line')).toHaveCount(1);
  await expect(page.getByTestId('active-step-polyline')).toHaveCount(0);
});
```

- [ ] **Step 3: Add the bent-step acceptance test**

```ts
test('renders only the waypoint-following active polyline for a bent grouped step', async ({ page }) => {
  await mockNavigationRoute(page, bentGroupedRoute);
  await page.goto('/navigacija');

  await page.locator('#start-location').fill('Start');
  await page.getByRole('button', { name: /Start/i }).click();
  await page.locator('#target-location').fill('End');
  await page.getByRole('button', { name: /End/i }).click();
  await page.getByTestId('show-route-button').click();

  await expect(page.getByTestId('active-step-direct-line')).toHaveCount(0);
  await expect(page.getByTestId('active-step-polyline')).toHaveCount(1);
});
```

- [ ] **Step 4: Add an audit-oriented assertion on the bent fixture geometry**

After the route renders, read the `points` attribute from `data-testid="active-step-polyline"` and assert it contains more than two coordinate pairs so the rendered shape is following intermediates rather than collapsing.

```ts
const points = await page.getByTestId('active-step-polyline').getAttribute('points');
expect(points?.trim().split(/\s+/).length).toBeGreaterThan(2);
```

- [ ] **Step 5: Run only the new spec first**

Run: `npm.cmd --prefix frontend run test:e2e -- navigation-step-rendering.spec.ts --reporter=line`

Expected:

```text
2 passed
```

- [ ] **Step 6: Commit**

```bash
git add frontend/tests/navigation-step-rendering.spec.ts
git commit -m "test: cover direct and bent grouped route rendering"
```

---

### Task 5: Keep Broad Navigation Smoke Coverage Green

**Files:**
- Modify: `frontend/tests/app-smoke.spec.ts`

- [ ] **Step 1: Review the existing smoke assertions for active route rendering assumptions**

Do not add new geometry-specific assertions here. Only keep the smoke suite resilient if any selector or shell behavior needs minor stabilization after the `RouteMap` refactor.

- [ ] **Step 2: If no smoke changes are needed, leave this file untouched**

This task exists so the implementing agent explicitly checks rather than assuming.

- [ ] **Step 3: Run smoke coverage**

Run: `npm.cmd --prefix frontend run test:e2e -- app-smoke.spec.ts --reporter=line`

Expected:

```text
8 passed
```

- [ ] **Step 4: If you changed the smoke spec, commit it**

```bash
git add frontend/tests/app-smoke.spec.ts
git commit -m "test: stabilize navigation smoke coverage after route geometry fix"
```

If the file is unchanged, skip this commit.

---

### Task 6: Manual Analytical Debugging Workflow For Problematic Zones

**Files:**
- Modify: `frontend/src/features/navigation/RouteMap.tsx`

- [ ] **Step 1: Use the development-time warning as the generic zone detector**

The `console.warn('[route-geometry:suspicious-step]', ...)` payload from Task 2 is the required analytical debugging hook. It must include:

- building code
- floor code / floor label
- step index
- `fromNodeId`
- `toNodeId`
- `pointCount`
- `maxDeviation`
- `pathToDirectRatio`
- `maxTurnAngleDeg`
- the exact `stepPoints`

- [ ] **Step 2: After implementation, manually run known routes and capture suspicious warnings**

Use the app in dev mode and manually check at least:

- `Glavni Ulaz -> Tajnistvo Fakulteta`
- `Weber Lab -> Seminarska Soba`
- one route that stays visually straight on each floor family you can reach easily

For every warning, record:

- route pair
- segment building/floor
- `fromNodeId -> toNodeId`
- whether the rendered polyline now visually follows the corridor correctly

- [ ] **Step 3: Verify no straight chunk falls back incorrectly**

For at least one route with an obviously straight merged corridor chunk, confirm:

- no suspicious warning appears
- the active shape is the direct line only
- no duplicate active polyline is visible

- [ ] **Step 4: Do not widen scope into backend merge changes in this pass**

If diagnostics reveal many suspicious grouped steps, document them, but do not change `NavigationRouteService.canMergeChunkBoundary(...)` in this implementation. This plan is the approach-2 frontend analysis + rendering fix, not a backend instruction rewrite.

---

### Task 7: Final Verification

**Files:**
- No new files

- [ ] **Step 1: Run the focused geometry spec**

Run: `npm.cmd --prefix frontend run test:e2e -- navigation-step-rendering.spec.ts --reporter=line`

Expected:

```text
2 passed
```

- [ ] **Step 2: Run the smoke suite**

Run: `npm.cmd --prefix frontend run test:e2e -- app-smoke.spec.ts --reporter=line`

Expected:

```text
8 passed
```

- [ ] **Step 3: Run the production build**

Run: `npm.cmd --prefix frontend run build`

Expected:

```text
✓ built in ...
```

- [ ] **Step 4: If the branch Docker/frontend flow is part of this session, rebuild and verify**

Run from repo root only if Docker is already part of the current workflow:

```bash
docker compose -f docker-compose.branch-standalone.yml up -d --build frontend
docker compose -f docker-compose.branch-standalone.yml ps frontend
```

Expected:

- frontend container is `Up`
- manual browser check confirms:
  - straight grouped step = one direct active line
  - bent grouped step = one waypoint-following active polyline
  - no duplicated red active overlay

- [ ] **Step 5: Final commit**

```bash
git add frontend/src/features/navigation/routeGeometry.ts frontend/src/features/navigation/RouteMap.tsx frontend/tests/fixtures/routeStepGeometryFixtures.ts frontend/tests/navigation-step-rendering.spec.ts frontend/tests/app-smoke.spec.ts
git commit -m "fix: render grouped route steps by geometry"
```

If `app-smoke.spec.ts` stayed untouched, omit it from `git add`.

---

## Self-Review Checklist

- This plan covers both required halves:
  - analytical identification of problematic grouped steps using real step points and metrics
  - rendering fix that removes the double image by making direct/polyline mutually exclusive
- The plan is generic across all segments because the analyzer depends only on `segment.path`, `fromNodeId`, and `toNodeId`.
- The plan intentionally does **not** change backend merge rules, PDF rendering, or instruction text generation.
- Every verification step names exact commands and expected outcomes.

---

Plan complete and saved to `docs/superpowers/plans/2026-06-07-route-step-geometry-rendering.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
