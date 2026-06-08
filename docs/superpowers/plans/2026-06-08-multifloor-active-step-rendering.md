# Multi-Floor Active Step Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the red active-route line continues rendering correctly after floor changes, even when the first or last step of a segment references a node that exists on the adjacent floor instead of inside the current segment path.

**Architecture:** Keep the fix entirely in frontend step-geometry resolution. Treat the first and last steps of a segment as boundary-aware steps: strict in-segment matching remains the default, but a narrow fallback resolves cross-floor entry/exit steps against the current segment path when exactly one endpoint exists inside that path.

**Tech Stack:** React 19, TypeScript, Vite, Playwright

---

## Problem Summary

The current grouped-step rendering logic assumes every `RouteStep` can be resolved entirely inside `segment.path`. That assumption fails on cross-floor boundaries:

- Previous floor segment can end on node `113`
- Next floor segment path can begin on node `144`
- First step on the new floor can still be expressed as `113 -> 144`
- `segment.path` for the new floor contains `144, 143, 116`, but not `113`

When that happens:

- `resolveStepPathBounds(...)` returns `null` for the active step
- `resolveActiveStepGeometry(...)` produces `renderMode: 'none'`
- `RouteMap` stops drawing the red active line after the user changes to the next floor or advances into the first step on that floor

The fix must be generic for all floor changes, not route-specific.

---

## File Map

**Modify:**
- `frontend/src/features/navigation/routeGeometry.ts`
- `frontend/tests/fixtures/routeStepGeometryFixtures.ts`
- `frontend/tests/navigation-step-rendering.spec.ts`

**Read for context only:**
- `frontend/src/features/navigation/RouteMap.tsx`
- `frontend/src/features/navigation/NavigationView.tsx`
- `frontend/src/types/navigation.ts`

**Do not modify unless the implementation proves strictly necessary:**
- `frontend/src/features/navigation/RouteMap.tsx`
- any backend files

---

### Task 1: Add a failing multi-floor regression fixture

**Files:**
- Modify: `frontend/tests/fixtures/routeStepGeometryFixtures.ts`
- Test: `frontend/tests/navigation-step-rendering.spec.ts`

- [ ] **Step 1: Add a fixture that mirrors the real failure pattern**

Add a new route fixture where:
- segment 0 ends on floor A
- segment 1 starts on floor B
- segment 1 path contains only floor-B nodes
- segment 1 first step references `fromNodeId` from floor A and `toNodeId` from floor B

Use this shape in `routeStepGeometryFixtures.ts`:

```ts
const multifloorStart = createLocation({
  id: 501,
  displayName: 'Multi Start - TEST, Floor 2',
  buildingId: 5,
  buildingName: 'Multi Floor Building',
  floorId: 12,
  floorCode: 'floor_2',
  floorLabel: 'Floor 2',
  locationType: 'laboratory',
  nodeId: 901,
});

const multifloorEnd = createLocation({
  id: 502,
  displayName: 'Multi End - TEST, Floor 3',
  buildingId: 5,
  buildingName: 'Multi Floor Building',
  floorId: 13,
  floorCode: 'floor_3',
  floorLabel: 'Floor 3',
  locationType: 'office',
  nodeId: 905,
  spaceId: 905,
  spaceName: 'Multi End',
  spaceTypeName: 'Office',
});

export const crossFloorEntryRoute: NavigationRoute = {
  routeId: 'cross-floor-entry-route',
  from: multifloorStart,
  to: multifloorEnd,
  totalCost: 20,
  segments: [
    {
      index: 0,
      buildingId: 5,
      buildingCode: 'TEST',
      buildingName: 'Multi Floor Building',
      floorId: 12,
      floorCode: 'floor_2',
      floorLabel: 'Floor 2',
      mapImageUrl: '/maps/1_pritlicje.png',
      coordinateWidth: 1000,
      coordinateHeight: 800,
      z: 2,
      usesElevator: false,
      usesStairs: false,
      path: [
        { nodeId: 901, externalId: 'A', label: 'A', nodeType: 'room', x: 180, y: 300, z: 2 },
        { nodeId: 902, externalId: 'B', label: 'B', nodeType: 'waypoint', x: 260, y: 300, z: 2 },
        { nodeId: 903, externalId: 'S2', label: 'S2', nodeType: 'stairs', x: 340, y: 300, z: 2 },
      ],
      steps: [
        {
          index: 0,
          text: 'Krenite do stepenista.',
          fromNodeId: 901,
          toNodeId: 903,
          type: 'corridor',
          icon: 'straight',
          maneuverType: 'straight',
          zoneId: null,
        },
      ],
    },
    {
      index: 1,
      buildingId: 5,
      buildingCode: 'TEST',
      buildingName: 'Multi Floor Building',
      floorId: 13,
      floorCode: 'floor_3',
      floorLabel: 'Floor 3',
      mapImageUrl: '/maps/1_pritlicje.png',
      coordinateWidth: 1000,
      coordinateHeight: 800,
      z: 3,
      usesElevator: false,
      usesStairs: true,
      path: [
        { nodeId: 904, externalId: 'S3', label: 'S3', nodeType: 'stairs', x: 360, y: 220, z: 3 },
        { nodeId: 906, externalId: 'C', label: 'C', nodeType: 'waypoint', x: 430, y: 220, z: 3 },
        { nodeId: 905, externalId: 'D', label: 'D', nodeType: 'room', x: 520, y: 220, z: 3 },
      ],
      steps: [
        {
          index: 0,
          text: 'Izadjite sa stepenista i nastavite po hodniku.',
          fromNodeId: 903,
          toNodeId: 904,
          type: 'stairs',
          icon: 'stairs_down',
          maneuverType: 'stairs_down',
          zoneId: null,
        },
        {
          index: 1,
          text: 'Nastavite do cilja.',
          fromNodeId: 904,
          toNodeId: 905,
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

- [ ] **Step 2: Register new locations in the shared fixture list**

Append `multifloorStart` and `multifloorEnd` to `routeGeometryLocations`.

Expected code addition:

```ts
export const routeGeometryLocations: NavigationLocation[] = [
  straightStart,
  straightEnd,
  bentStart,
  bentEnd,
  repeatedStart,
  repeatedEnd,
  sharedBoundaryStart,
  sharedBoundaryEnd,
  multifloorStart,
  multifloorEnd,
];
```

- [ ] **Step 3: Add a failing Playwright test for the first step on the new floor**

Add this test to `navigation-step-rendering.spec.ts`:

```ts
test('renders the active line for the first step after switching to the next floor', async ({
  page,
}) => {
  await mockNavigationRoute(page, crossFloorEntryRoute);
  await page.goto('/navigacija');

  await selectLocation(page, '#start-location', 'Multi Start', /Multi Start.*TEST.*Floor 2/i);
  await selectLocation(page, '#target-location', 'Multi End', /Multi End.*TEST.*Floor 3/i);
  await page.getByTestId('show-route-button').click();

  await expect(page.getByText('Krenite do stepenista.')).toBeVisible();
  await page.getByRole('button', { name: 'Naprej' }).click();
  await expect(page.getByText('Izadjite sa stepenista i nastavite po hodniku.')).toBeVisible();

  const directLine = page.getByTestId('active-step-direct-line');
  const polyline = page.getByTestId('active-step-polyline');

  await expect(directLine.or(polyline)).toHaveCount(1);
});
```

- [ ] **Step 4: Make the failure explicit by checking actual geometry on floor 3**

Strengthen the test so it fails with the current code:

```ts
await expect(page.getByTestId('active-step-direct-line')).toHaveCount(1);
await expect(page.getByTestId('active-step-direct-line')).toHaveAttribute('x1', '360');
await expect(page.getByTestId('active-step-direct-line')).toHaveAttribute('x2', '360');
```

This asserts that the first step on the new floor resolves to the first available node in that segment (`nodeId: 904`).

- [ ] **Step 5: Run the focused Playwright file and confirm the new test fails**

Run:

```bash
npm.cmd run test:e2e -- navigation-step-rendering.spec.ts --reporter=line
```

Expected before implementation:
- existing geometry tests still pass
- the new multi-floor floor-switch test fails because no active red line is rendered

- [ ] **Step 6: Commit the failing test fixture**

```bash
git add frontend/tests/fixtures/routeStepGeometryFixtures.ts frontend/tests/navigation-step-rendering.spec.ts
git commit -m "test: cover active step rendering after floor changes"
```

---

### Task 2: Make step-bound resolution boundary-aware for floor transitions

**Files:**
- Modify: `frontend/src/features/navigation/routeGeometry.ts`
- Test: `frontend/tests/navigation-step-rendering.spec.ts`

- [ ] **Step 1: Extend the bound-resolution model so fallback can be represented explicitly**

Add a strategy marker to `StepPathBounds`:

```ts
export type StepResolutionStrategy =
  | 'strict'
  | 'boundary-entry'
  | 'boundary-exit';

export type StepPathBounds = {
  fromIndex: number;
  toIndex: number;
  strategy: StepResolutionStrategy;
};
```

Every strict path match must now return `strategy: 'strict'`.

- [ ] **Step 2: Add small helpers for boundary-aware resolution**

Add these helpers near `collectMatchingIndices(...)`:

```ts
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
```

- [ ] **Step 3: Implement a narrow fallback for the first step of a segment**

Add a helper with this behavior:

```ts
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

  return {
    fromIndex: 0,
    toIndex,
    strategy: 'boundary-entry',
  };
}
```

Intent:
- only the first step in a segment can use this fallback
- only when `fromNodeId` is absent from the current segment path
- only when `toNodeId` is present in the current segment path
- start drawing from the first actual point available on the new floor

- [ ] **Step 4: Implement the symmetric fallback for the last step of a segment**

Add this helper:

```ts
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

  return {
    fromIndex,
    toIndex: path.length - 1,
    strategy: 'boundary-exit',
  };
}
```

This makes the logic complete for both entering and leaving a floor segment.

- [ ] **Step 5: Preserve existing strict behavior inside the recursive resolver**

Update the existing strict return site from:

```ts
const bounds = { fromIndex, toIndex };
```

to:

```ts
const bounds: StepPathBounds = {
  fromIndex,
  toIndex,
  strategy: 'strict',
};
```

No other strict-match semantics should change.

- [ ] **Step 6: Add a post-processing fallback pass only for unresolved steps**

Replace the current `resolveStepPathBounds(...)` return path with:

```ts
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
```

Important constraint:
- do not mix strict recursive partial results with ad hoc fallback spans in this task
- either the whole step list resolves strictly, or unresolved steps are handled by narrow boundary fallback rules

That keeps the implementation simple and reduces new ambiguity.

- [ ] **Step 7: Keep `resolveActiveStepGeometry(...)` unchanged except for the richer bounds shape**

This function should still do:

```ts
const bounds = resolveStepPathBounds(path, steps);
const activeBounds = bounds[activeStepIndex];

if (!activeBounds) {
  return analyzeActiveStepGeometry([]);
}

return analyzeActiveStepGeometry(path.slice(activeBounds.fromIndex, activeBounds.toIndex + 1));
```

No rendering logic changes belong here.

- [ ] **Step 8: Run the focused Playwright file and confirm the new test passes**

Run:

```bash
npm.cmd run test:e2e -- navigation-step-rendering.spec.ts --reporter=line
```

Expected:
- straight grouped step test passes
- bent grouped step test passes
- repeated-node test passes
- shared-boundary test passes
- new cross-floor entry test passes

- [ ] **Step 9: Commit the geometry fix**

```bash
git add frontend/src/features/navigation/routeGeometry.ts
git commit -m "fix: render active path after floor changes"
```

---

### Task 3: Verify no RouteMap change is required and add guard coverage if needed

**Files:**
- Read: `frontend/src/features/navigation/RouteMap.tsx`
- Modify only if necessary: `frontend/src/features/navigation/RouteMap.tsx`
- Test: `frontend/tests/navigation-step-rendering.spec.ts`

- [ ] **Step 1: Verify that `RouteMap` already consumes fallback bounds correctly**

Specifically inspect these expressions:

```ts
const activeBounds = stepBounds[activeStepIndex] ?? null;
const activeFromIndex = activeBounds?.fromIndex ?? -1;
const activeToIndex = activeBounds?.toIndex ?? -1;
const activeGeometry = useMemo(
  () => resolveActiveStepGeometry(safePath, safeSteps, activeStepIndex),
  [activeStepIndex, safePath, safeSteps]
);
```

Expected result:
- `donePoints` uses `activeFromIndex`
- `remainingPoints` uses `activeToIndex`
- red direct/polyline rendering only depends on `activeGeometry`

If all three still work with fallback bounds, do not modify this file.

- [ ] **Step 2: Only if needed, add a dev warning for unresolved active boundary steps**

If the fallback implementation exposes an unexpected `null` active step during manual verification, add a narrow warning:

```ts
if (import.meta.env.DEV && !activeBounds && activeStep) {
  console.warn('[route-geometry:unresolved-step]', {
    buildingCode: segment.buildingCode,
    floorCode: segment.floorCode,
    floorLabel: segment.floorLabel,
    stepIndex: activeStep.index ?? activeStepIndex,
    fromNodeId: activeStep.fromNodeId,
    toNodeId: activeStep.toNodeId,
    pathNodeIds: safePath.map((point) => point.nodeId),
  });
}
```

Do not add this warning unless the verification run shows it is useful.

- [ ] **Step 3: If `RouteMap.tsx` changes, run build immediately**

Run:

```bash
npm.cmd run build
```

Expected:
- TypeScript build passes
- Vite build passes

- [ ] **Step 4: Commit only if `RouteMap.tsx` changed**

```bash
git add frontend/src/features/navigation/RouteMap.tsx
git commit -m "chore: add route geometry diagnostics"
```

Skip this commit entirely if there was no file change.

---

### Task 4: Final verification against the real floor-switch route

**Files:**
- No required code changes
- Test target: local stack at `http://localhost:5175`

- [ ] **Step 1: Run the production build once more after all code changes**

Run:

```bash
npm.cmd run build
```

Expected:
- successful frontend production build

- [ ] **Step 2: Run the focused Playwright regression suite**

Run:

```bash
npm.cmd run test:e2e -- navigation-step-rendering.spec.ts --reporter=line
```

Expected:
- all geometry/rendering tests pass

- [ ] **Step 3: Manually verify the original class of bug through the browser**

Use the isolated stack already running at:

```text
http://localhost:5175/navigacija
```

Manual flow:
1. Select `Weber Lab - G2, 2. nadstropje`
2. Select `Tajnistvo Fakulteta - G2, 3. nadstropje`
3. Show route
4. Advance through steps until the floor changes
5. Confirm the first step on `3. nadstropje` still shows a red active line
6. Continue one more step and confirm the line remains stable

- [ ] **Step 4: Check there is no regression on same-floor grouped-step rendering**

Manual flow:
1. Open a same-floor route that previously triggered grouped-step logic
2. Confirm straight grouped steps still render as a single direct line
3. Confirm bent grouped steps still render as a single red path-following polyline

- [ ] **Step 5: Stage all final files and commit**

```bash
git add frontend/src/features/navigation/routeGeometry.ts frontend/tests/fixtures/routeStepGeometryFixtures.ts frontend/tests/navigation-step-rendering.spec.ts
git commit -m "fix: preserve active route line across floor changes"
```

---

## Self-Review

**Spec coverage:**  
This plan covers:
- root-cause reproduction
- generic fix for floor-boundary steps
- no-backend-change constraint
- automated regression coverage
- manual verification on the real route class

**Placeholder scan:**  
No `TODO`, `TBD`, or implicit “add tests later” steps remain.

**Type consistency:**  
`StepPathBounds`, `resolveStepPathBounds`, and `resolveActiveStepGeometry` are the only core geometry APIs touched. `RouteMap` remains a consumer of resolved bounds and geometry, not an owner of fallback resolution logic.

---

Plan complete and saved to `docs/superpowers/plans/2026-06-08-multifloor-active-step-rendering.md`.

Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
