# Route Direct Line Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the red direct line for visually straight route chunks, but automatically fall back to the full polyline whenever the grouped step contains meaningful curvature or a bend that would cut through walls.

**Architecture:** Leave backend step grouping unchanged. Move the direct-line decision into a small frontend geometry helper that inspects the active step's actual path points and returns `true` only when the grouped chunk is geometrically close to a straight segment. `RouteMap` will render the existing polyline for every step, and render the extra red `<line>` only when the helper says it is safe.

**Tech Stack:** React 19, TypeScript, SVG overlays, Playwright end-to-end tests, existing mocked frontend route flow.

---

## File Structure

**Create:**
- `frontend/src/features/navigation/routeGeometry.ts`
- `frontend/tests/navigation-direct-line.spec.ts`

**Modify:**
- `frontend/src/features/navigation/RouteMap.tsx`
- `frontend/package.json`

**Why these files:**
- `routeGeometry.ts` keeps the geometric decision isolated and easy to test mentally and in browser-driven tests.
- `RouteMap.tsx` remains the only rendering file and consumes helper output instead of embedding geometry math inline.
- `navigation-direct-line.spec.ts` covers both acceptance cases with route fixtures: straight chunk keeps `<line>`, bent chunk removes `<line>` and still shows the grouped path.
- `frontend/package.json` may need a focused Playwright command if the repo benefits from running just this spec repeatedly.

---

### Task 1: Extract Direct-Line Eligibility Into A Dedicated Geometry Helper

**Files:**
- Create: `frontend/src/features/navigation/routeGeometry.ts`

- [ ] **Step 1: Create the route geometry helper with focused types and constants**

```ts
export type RouteGeometryPoint = {
  nodeId: number;
  x: number;
  y: number;
};

export const DIRECT_LINE_MAX_DEVIATION = 12;
export const DIRECT_LINE_MAX_LENGTH_RATIO = 1.05;
export const DIRECT_LINE_MIN_POINTS_FOR_CURVE_CHECK = 3;
```

- [ ] **Step 2: Add a helper that slices the active step points from the full segment path**

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

- [ ] **Step 3: Implement the strict straightness check**

```ts
function distance(a: RouteGeometryPoint, b: RouteGeometryPoint) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function distanceFromLine(
  point: RouteGeometryPoint,
  start: RouteGeometryPoint,
  end: RouteGeometryPoint
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const denominator = Math.hypot(dx, dy);

  if (denominator < 1e-6) {
    return 0;
  }

  return Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x) / denominator;
}

export function shouldRenderDirectLine(points: RouteGeometryPoint[]): boolean {
  if (points.length < 2) {
    return false;
  }

  if (points.length < DIRECT_LINE_MIN_POINTS_FOR_CURVE_CHECK) {
    return true;
  }

  const start = points[0];
  const end = points[points.length - 1];
  const directDistance = distance(start, end);

  if (directDistance < 1e-6) {
    return false;
  }

  const polylineLength = points.slice(1).reduce((sum, point, index) => {
    return sum + distance(points[index], point);
  }, 0);

  const maxDeviation = points.slice(1, -1).reduce((max, point) => {
    return Math.max(max, distanceFromLine(point, start, end));
  }, 0);

  return (
    maxDeviation <= DIRECT_LINE_MAX_DEVIATION &&
    polylineLength / directDistance <= DIRECT_LINE_MAX_LENGTH_RATIO
  );
}
```

- [ ] **Step 4: Sanity-check the helper with TypeScript**

Run: `npm.cmd --prefix frontend run build`
Expected: build succeeds and the new helper compiles without unused-export or type errors.

- [ ] **Step 5: Commit the helper extraction**

```bash
git add frontend/src/features/navigation/routeGeometry.ts
git commit -m "refactor: extract route direct-line geometry helper"
```

### Task 2: Gate `<line>` Rendering In `RouteMap`

**Files:**
- Modify: `frontend/src/features/navigation/RouteMap.tsx`

- [ ] **Step 1: Replace duplicated active step path calculations with helper calls**

```ts
import {
  getStepPathPoints,
  shouldRenderDirectLine,
} from './routeGeometry';
```

```ts
const activeStepPath = useMemo(
  () => getStepPathPoints(safePath, activeStep?.fromNodeId, activeStep?.toNodeId),
  [safePath, activeStep?.fromNodeId, activeStep?.toNodeId]
);

const activePoints = useMemo(
  () => activeStepPath.map((point) => `${point.x},${point.y}`).join(' '),
  [activeStepPath]
);

const canRenderActiveDirectLine = useMemo(
  () => shouldRenderDirectLine(activeStepPath),
  [activeStepPath]
);
```

- [ ] **Step 2: Keep the grouped polyline for the active step as the default visual truth**

```tsx
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
```

- [ ] **Step 3: Render the extra direct line only when the helper explicitly allows it**

```tsx
{activeFrom && activeTo && canRenderActiveDirectLine && (
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
```

- [ ] **Step 4: Avoid recomputing indexes in multiple branches**

```ts
const activeFromIndex = safePath.findIndex((point) => point.nodeId === activeStep?.fromNodeId);
const activeToIndex = safePath.findIndex((point) => point.nodeId === activeStep?.toNodeId);
```

Keep `donePoints` and `remainingPoints` as they are today so the change is isolated to direct-line gating rather than global route-progress rendering.

- [ ] **Step 5: Rebuild the frontend**

Run: `npm.cmd --prefix frontend run build`
Expected: build succeeds and no JSX/type errors remain in `RouteMap.tsx`.

- [ ] **Step 6: Commit the rendering gate**

```bash
git add frontend/src/features/navigation/RouteMap.tsx
git commit -m "feat: gate active route direct line by geometry"
```

### Task 3: Add A Bent-Path Regression Test That Reproduces The Wall-Cutting Bug

**Files:**
- Create: `frontend/tests/navigation-direct-line.spec.ts`

- [ ] **Step 1: Add a shared route fixture with a bent grouped step**

```ts
const bentRouteResponse = {
  routeId: 'route-bent',
  from: locations[0],
  to: locations[1],
  totalCost: 42,
  segments: [
    {
      index: 0,
      buildingId: 1,
      buildingCode: 'G2',
      buildingName: 'Objekt G2',
      floorId: 2,
      floorCode: '2_nadstropje',
      floorLabel: '2. nadstropje',
      mapImageUrl: '/maps/objekt_g_2_n.png',
      coordinateWidth: 1190,
      coordinateHeight: 842,
      z: 2,
      usesElevator: false,
      usesStairs: false,
      path: [
        { nodeId: 201, externalId: 'A', label: 'A', nodeType: 'corridor', x: 820, y: 305, z: 2 },
        { nodeId: 202, externalId: 'B', label: 'B', nodeType: 'waypoint', x: 980, y: 300, z: 2 },
        { nodeId: 203, externalId: 'C', label: 'C', nodeType: 'waypoint', x: 1035, y: 420, z: 2 },
        { nodeId: 204, externalId: 'D', label: 'D', nodeType: 'stairs', x: 1000, y: 590, z: 2 },
      ],
      steps: [
        {
          index: 0,
          text: 'Nadaljujte po hodniku.',
          fromNodeId: 201,
          toNodeId: 204,
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

- [ ] **Step 2: Route the navigation API in this spec to return the bent fixture**

```ts
await page.route('**/api/navigation/route**', async (route) => {
  await route.fulfill({ json: bentRouteResponse });
});
```

- [ ] **Step 3: Assert that the active grouped step still renders a red polyline but no direct red line**

```ts
const overlay = page.locator('svg');
await expect(overlay.locator('polyline[stroke="#dc2626"]')).toHaveCount(1);
await expect(overlay.locator('line[stroke="#dc2626"]')).toHaveCount(0);
```

- [ ] **Step 4: Run only the new regression spec**

Run: `npm.cmd --prefix frontend run test:e2e -- navigation-direct-line.spec.ts`
Expected: the spec passes and confirms the wall-cutting case no longer draws a straight red shortcut.

- [ ] **Step 5: Commit the bent-path regression test**

```bash
git add frontend/tests/navigation-direct-line.spec.ts
git commit -m "test: cover bent grouped route without direct line"
```

### Task 4: Add A Straight-Chunk Acceptance Test So The Feature Does Not Regress

**Files:**
- Modify: `frontend/tests/navigation-direct-line.spec.ts`

- [ ] **Step 1: Add a second route fixture with a nearly straight grouped chunk**

```ts
const straightRouteResponse = {
  routeId: 'route-straight',
  from: locations[0],
  to: locations[1],
  totalCost: 18,
  segments: [
    {
      index: 0,
      buildingId: 1,
      buildingCode: 'G2',
      buildingName: 'Objekt G2',
      floorId: 2,
      floorCode: '2_nadstropje',
      floorLabel: '2. nadstropje',
      mapImageUrl: '/maps/objekt_g_2_n.png',
      coordinateWidth: 1190,
      coordinateHeight: 842,
      z: 2,
      usesElevator: false,
      usesStairs: false,
      path: [
        { nodeId: 301, externalId: 'A', label: 'A', nodeType: 'corridor', x: 130, y: 520, z: 2 },
        { nodeId: 302, externalId: 'B', label: 'B', nodeType: 'waypoint', x: 250, y: 515, z: 2 },
        { nodeId: 303, externalId: 'C', label: 'C', nodeType: 'waypoint', x: 370, y: 512, z: 2 },
        { nodeId: 304, externalId: 'D', label: 'D', nodeType: 'room', x: 500, y: 508, z: 2 },
      ],
      steps: [
        {
          index: 0,
          text: 'Nadaljujte po hodniku.',
          fromNodeId: 301,
          toNodeId: 304,
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

- [ ] **Step 2: Add a spec that expects both the active polyline and the extra direct line**

```ts
await expect(overlay.locator('polyline[stroke="#dc2626"]')).toHaveCount(1);
await expect(overlay.locator('line[stroke="#dc2626"]')).toHaveCount(1);
```

- [ ] **Step 3: Run the direct-line spec file again after adding both cases**

Run: `npm.cmd --prefix frontend run test:e2e -- navigation-direct-line.spec.ts`
Expected: one test proves bent geometry disables the direct line, one test proves straight geometry preserves it.

- [ ] **Step 4: Commit the straight-line acceptance coverage**

```bash
git add frontend/tests/navigation-direct-line.spec.ts
git commit -m "test: preserve direct line for straight grouped route"
```

### Task 5: Add A Convenient Focused Test Command And Run Final Verification

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Add a focused Playwright command for this behavior**

```json
"scripts": {
  "dev": "vite --configLoader runner",
  "build": "tsc -b && vite build --configLoader runner --emptyOutDir false",
  "lint": "eslint .",
  "test:e2e": "playwright test",
  "test:e2e:direct-line": "playwright test navigation-direct-line.spec.ts",
  "format": "prettier --write .",
  "format:check": "prettier --check \"**/*\" --ignore-unknown",
  "preview": "vite preview"
}
```

- [ ] **Step 2: Run the focused direct-line regression suite**

Run: `npm.cmd --prefix frontend run test:e2e:direct-line`
Expected: both direct-line gating tests pass.

- [ ] **Step 3: Run the existing smoke suite to ensure the navigation flow still works**

Run: `npm.cmd --prefix frontend run test:e2e -- app-smoke.spec.ts`
Expected: existing navigation smoke checks still pass and the new geometry logic does not break route rendering.

- [ ] **Step 4: Run the production build one more time**

Run: `npm.cmd --prefix frontend run build`
Expected: build passes after all test-only and runtime changes.

- [ ] **Step 5: Commit the verification-friendly script update**

```bash
git add frontend/package.json
git commit -m "chore: add focused direct-line e2e command"
```

---

## Threshold Notes

- `DIRECT_LINE_MAX_DEVIATION = 12` means a grouped chunk may drift slightly from the ideal line, but not enough to visibly round a corner.
- `DIRECT_LINE_MAX_LENGTH_RATIO = 1.05` means the walked path may be at most 5% longer than the direct line. This catches soft bends even when every point individually sits near the ideal line.
- These values are intentionally strict. If the straight acceptance test proves too fragile against real map coordinates, adjust only one threshold at a time and rerun both new Playwright cases before touching production route data.

## Manual QA Checklist

- Load a route with a straight hallway chunk and verify the red overlay still includes both the thick polyline and the crisp direct line.
- Load the Weber lab -> seminarske stepenice scenario and verify the grouped step remains one textual instruction but the red overlay follows the bend instead of cutting across the wall.
- Click through any multi-segment route and confirm `donePoints` and `remainingPoints` visuals still behave exactly as before.

## Self-Review

- **Spec coverage:** The plan covers the approved approach: keep backend grouping, keep the direct line only for strict straight geometry, and fall back to grouped polyline rendering for bent chunks.
- **Placeholder scan:** Every task names exact files, code shapes, thresholds, and commands. There are no `TODO`/`TBD` placeholders.
- **Type consistency:** The same point shape (`nodeId`, `x`, `y`) is used throughout the helper and `RouteMap`, and the tests target the exact SVG elements that this feature changes.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-03-route-direct-line-gating.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
