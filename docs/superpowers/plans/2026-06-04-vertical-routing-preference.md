# Vertical Routing Preference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make route selection use elevators exclusively whenever `allowElevator=true`, and otherwise apply hard vertical preferences: stairs-first for one-floor travel and elevator-first for two-or-more-floor travel.

**Architecture:** Keep the public route API unchanged. Move vertical preference policy into `NavigationRouteService`, where start and destination floors are known, and extend `AStarService` so it can search with an explicit vertical traversal mode (`ANY`, `STAIRS_ONLY`, `ELEVATOR_ONLY`) instead of relying on the current fixed stairs penalty. `allowElevator=true` becomes an explicit elevator-choice mode for vertical traversal; when it is false, the service applies hard floor-difference preference with a deterministic fallback order.

**Tech Stack:** Spring Boot, Java 21, JPA repositories, JUnit 5, Mockito, existing `mvnw.cmd` backend test workflow.

---

## File Structure

**Create:**
- `backend/src/main/java/com/navigator/backend/service/VerticalTraversalMode.java`
- `backend/src/main/java/com/navigator/backend/service/VerticalPreferenceResolver.java`
- `backend/src/test/java/com/navigator/backend/service/VerticalPreferenceResolverTest.java`

**Modify:**
- `backend/src/main/java/com/navigator/backend/service/AStarService.java`
- `backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java`
- `backend/src/test/java/com/navigator/backend/service/AStarServiceTest.java`
- `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`
- `backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java`
- `docs/backend.md`

**Why this structure:**
- `VerticalTraversalMode` is the explicit contract between policy selection and graph search.
- `VerticalPreferenceResolver` isolates floor-delta-to-preference logic so it can be tested without mocking A*.
- `NavigationRouteService` owns “which mode should we try first?” because it has the location and floor context.
- `AStarService` should only enforce the allowed edge set for the selected mode; it should not decide policy anymore.

---

### Task 1: Introduce Explicit Vertical Traversal Modes

**Files:**
- Create: `backend/src/main/java/com/navigator/backend/service/VerticalTraversalMode.java`
- Create: `backend/src/main/java/com/navigator/backend/service/VerticalPreferenceResolver.java`
- Create: `backend/src/test/java/com/navigator/backend/service/VerticalPreferenceResolverTest.java`

- [ ] **Step 1: Create the traversal mode enum**

```java
package com.navigator.backend.service;

public enum VerticalTraversalMode {
  ANY,
  STAIRS_ONLY,
  ELEVATOR_ONLY
}
```

- [ ] **Step 2: Create a resolver that maps floor difference and the lift toggle to an ordered attempt list**

```java
package com.navigator.backend.service;

import com.navigator.backend.model.NavNode;
import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Component;

@Component
public class VerticalPreferenceResolver {

  // Product rule:
  // - same floor -> ANY
  // - different floors + allowElevator=true -> ELEVATOR_ONLY then STAIRS_ONLY
  // - one floor + allowElevator=false -> STAIRS_ONLY then ELEVATOR_ONLY
  // - two or more floors + allowElevator=false -> ELEVATOR_ONLY then STAIRS_ONLY
  public List<VerticalTraversalMode> resolveAttemptOrder(
      NavNode start, NavNode goal, boolean allowElevator) {
    int floorDelta = floorDelta(start, goal);

    if (floorDelta == 0) {
      return List.of(VerticalTraversalMode.ANY);
    }

    if (allowElevator) {
      return List.of(
          VerticalTraversalMode.ELEVATOR_ONLY,
          VerticalTraversalMode.STAIRS_ONLY);
    }

    if (floorDelta == 1) {
      return List.of(
          VerticalTraversalMode.STAIRS_ONLY,
          VerticalTraversalMode.ELEVATOR_ONLY);
    }

    return List.of(
        VerticalTraversalMode.ELEVATOR_ONLY,
        VerticalTraversalMode.STAIRS_ONLY);
  }

  int floorDelta(NavNode start, NavNode goal) {
    BigDecimal startLevel = requireLevel(start);
    BigDecimal goalLevel = requireLevel(goal);
    return startLevel.subtract(goalLevel).abs().intValueExact();
  }

  private BigDecimal requireLevel(NavNode node) {
    if (node == null || node.getFloor() == null || node.getFloor().getLevelNumber() == null) {
      throw new IllegalStateException("Missing floor level for node " + Objects.toString(node));
    }
    return node.getFloor().getLevelNumber();
  }
}
```

- [ ] **Step 3: Write focused tests for resolver behavior**

```java
/*
Behavior matrix:
- same floor -> ANY
- different floors + allowElevator=true -> ELEVATOR_ONLY then STAIRS_ONLY
- one floor + allowElevator=false -> STAIRS_ONLY then ELEVATOR_ONLY
- two or more floors + allowElevator=false -> ELEVATOR_ONLY then STAIRS_ONLY
*/

@Test
void sameFloorUsesAnyMode() {
  assertEquals(
      List.of(VerticalTraversalMode.ANY),
      resolver.resolveAttemptOrder(startOnFloor0, goalOnFloor0, false));
}

@Test
void sameFloorWithElevatorToggleStillUsesAnyMode() {
  assertEquals(
      List.of(VerticalTraversalMode.ANY),
      resolver.resolveAttemptOrder(startOnFloor0, goalOnFloor0, true));
}

@Test
void elevatorToggleMakesElevatorThePrimaryAttemptForSingleFloorTravel() {
  assertEquals(
      List.of(VerticalTraversalMode.ELEVATOR_ONLY, VerticalTraversalMode.STAIRS_ONLY),
      resolver.resolveAttemptOrder(startOnFloor0, goalOnFloor1, true));
}

@Test
void oneFloorDifferenceWithoutElevatorPrefersStairsThenElevator() {
  assertEquals(
      List.of(VerticalTraversalMode.STAIRS_ONLY, VerticalTraversalMode.ELEVATOR_ONLY),
      resolver.resolveAttemptOrder(startOnFloor0, goalOnFloor1, false));
}

@Test
void multiFloorDifferenceWithoutElevatorPrefersElevatorThenStairs() {
  assertEquals(
      List.of(VerticalTraversalMode.ELEVATOR_ONLY, VerticalTraversalMode.STAIRS_ONLY),
      resolver.resolveAttemptOrder(startOnFloor0, goalOnFloor3, false));
}
```

- [ ] **Step 4: Run only the new resolver tests**

Run: `.\mvnw.cmd -q -Dtest=VerticalPreferenceResolverTest test`
Workdir: `D:\Feri Navigator\FERI-Navigator\backend`
Expected: all resolver tests pass and document the updated semantics of the lift toggle.

- [ ] **Step 5: Commit the policy contract**

```bash
git add backend/src/main/java/com/navigator/backend/service/VerticalTraversalMode.java backend/src/main/java/com/navigator/backend/service/VerticalPreferenceResolver.java backend/src/test/java/com/navigator/backend/service/VerticalPreferenceResolverTest.java
git commit -m "feat: add explicit vertical routing preference policy"
```

### Task 2: Remove The Hardcoded Stairs Penalty And Let A* Enforce Traversal Modes

**Files:**
- Modify: `backend/src/main/java/com/navigator/backend/service/AStarService.java`
- Modify: `backend/src/test/java/com/navigator/backend/service/AStarServiceTest.java`

- [ ] **Step 1: Replace the current penalty-based approach with an overload that accepts `VerticalTraversalMode`**

```java
public RouteSearchResult findPath(
    NavNode start, NavNode goal, boolean allowElevator, VerticalTraversalMode traversalMode) {
  // main implementation
}

public RouteSearchResult findPath(NavNode start, NavNode goal, boolean allowElevator) {
  return findPath(start, goal, allowElevator, VerticalTraversalMode.ANY);
}
```

- [ ] **Step 2: Remove the fixed stairs penalty constant and movement-penalty addition**

Delete:

```java
private static final double STAIRS_PENALTY = 15.0;
```

Delete the addition:

```java
+ movementPenalty(edge);
```

Delete the helper:

```java
private double movementPenalty(NavEdge edge) { ... }
```

Use only:

```java
double tentativeG = gScore.getOrDefault(currentId, DEFAULT_SCORE) + safeWeight(edge);
```

- [ ] **Step 3: Add a single edge-filter helper inside `AStarService`**

```java
private boolean isEdgeAllowed(NavEdge edge, VerticalTraversalMode traversalMode) {
  String edgeType = edge.getEdgeTypeCode();

  if (traversalMode == VerticalTraversalMode.STAIRS_ONLY && "elevator".equals(edgeType)) {
    return false;
  }

  if (traversalMode == VerticalTraversalMode.ELEVATOR_ONLY && "stairs".equals(edgeType)) {
    return false;
  }

  return true;
}
```

Use it in the neighbor loop:

```java
for (NavEdge edge : edgeRepo.findByFromNodeId(currentId)) {
  if (!isEdgeAllowed(edge, traversalMode)) {
    continue;
  }
  ...
}
```

Because `allowElevator=true` is now interpreted upstream as an explicit elevator-choice policy, `AStarService` should enforce only the mode it receives instead of also blocking elevator edges with the old boolean guard.

- [ ] **Step 4: Extend `AStarServiceTest` with mode-specific graph tests**

Add these tests:

```java
@Test
void stairsOnlyModeSkipsElevatorEdgesEvenWhenElevatorPathIsCheaper() {
  RouteSearchResult result =
      service.findPath(start, goal, false, VerticalTraversalMode.STAIRS_ONLY);

  assertEquals(List.of(start, stairsNode, goal), result.getNodes());
}

@Test
void elevatorOnlyModeSkipsStairsEdgesEvenWhenStairsPathIsCheaper() {
  RouteSearchResult result =
      service.findPath(start, goal, true, VerticalTraversalMode.ELEVATOR_ONLY);

  assertEquals(List.of(start, elevatorNode, goal), result.getNodes());
}

@Test
void anyModeStillChoosesCheapestPathOnSameFloor() {
  RouteSearchResult result =
      service.findPath(start, goal, false, VerticalTraversalMode.ANY);

  assertEquals(List.of(start, cheaperCorridorNode, goal), result.getNodes());
}
```

Use helper graph edges with different weights so the mode filter, not weight luck, drives the vertical assertions.

- [ ] **Step 5: Run focused A* tests**

Run: `.\mvnw.cmd -q -Dtest=AStarServiceTest test`
Workdir: `D:\Feri Navigator\FERI-Navigator\backend`
Expected: legacy path tests still pass, and the new mode-filter tests prove that stairs/elevator choice no longer depends on the removed penalty.

- [ ] **Step 6: Commit A* traversal-mode support**

```bash
git add backend/src/main/java/com/navigator/backend/service/AStarService.java backend/src/test/java/com/navigator/backend/service/AStarServiceTest.java
git commit -m "feat: let A* enforce explicit vertical traversal modes"
```

### Task 3: Route With Preferred Mode First And Fallback Second

**Files:**
- Modify: `backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java`
- Modify: `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`

- [ ] **Step 1: Inject the new resolver into `NavigationRouteService`**

Change constructor fields:

```java
private final NavigationLocationRepository locationRepository;
private final AStarService aStarService;
private final VerticalPreferenceResolver verticalPreferenceResolver;
```

All test instantiations must become:

```java
new NavigationRouteService(locationRepository, aStarService, verticalPreferenceResolver);
```

- [ ] **Step 2: Add a helper that tries route modes in order and returns the first non-empty result**

```java
private RouteSearchResult findPreferredRoute(
    NavNode start, NavNode goal, boolean allowElevator) {
  List<VerticalTraversalMode> attempts =
      verticalPreferenceResolver.resolveAttemptOrder(start, goal, allowElevator);

  for (VerticalTraversalMode attempt : attempts) {
    RouteSearchResult result =
        aStarService.findPath(start, goal, allowElevator, attempt);
    if (result.getNodes() != null && !result.getNodes().isEmpty()) {
      return result;
    }
  }

  return RouteSearchResult.builder().nodes(List.of()).edges(List.of()).totalCost(0).build();
}
```

- [ ] **Step 3: Replace direct `aStarService.findPath(..., allowElevator)` calls with the preferred helper**

In regular routing:

```java
RouteSearchResult searchResult =
    findPreferredRoute(from.getNode(), to.getNode(), allowElevator);
```

In nearest-target routing:

```java
RouteSearchResult candidateRoute =
    findPreferredRoute(from.getNode(), candidate.getNode(), allowElevator);
```

- [ ] **Step 4: Add service tests that prove preference order and fallback**

Add these cases:

```java
@Test
void allowElevatorTrueUsesElevatorOnlyAttemptBeforeFallback() {
  when(verticalPreferenceResolver.resolveAttemptOrder(start, goal, true))
      .thenReturn(List.of(VerticalTraversalMode.ELEVATOR_ONLY, VerticalTraversalMode.STAIRS_ONLY));
  when(aStarService.findPath(start, goal, true, VerticalTraversalMode.ELEVATOR_ONLY))
      .thenReturn(elevatorRoute);

  RouteResponseDto result = service.route(1L, 2L, null, true);

  assertEquals(elevatorRoute.getTotalCost(), result.getTotalCost());
  verify(aStarService).findPath(start, goal, true, VerticalTraversalMode.ELEVATOR_ONLY);
  verify(aStarService, never()).findPath(start, goal, true, VerticalTraversalMode.STAIRS_ONLY);
}

@Test
void allowElevatorTrueFallsBackToStairsOnlyWhenElevatorRouteIsMissing() {
  when(verticalPreferenceResolver.resolveAttemptOrder(start, goal, true))
      .thenReturn(List.of(VerticalTraversalMode.ELEVATOR_ONLY, VerticalTraversalMode.STAIRS_ONLY));
  when(aStarService.findPath(start, goal, true, VerticalTraversalMode.ELEVATOR_ONLY))
      .thenReturn(emptyRoute());
  when(aStarService.findPath(start, goal, true, VerticalTraversalMode.STAIRS_ONLY))
      .thenReturn(stairsRoute);

  RouteResponseDto result = service.route(1L, 2L, null, true);

  assertEquals(stairsRoute.getTotalCost(), result.getTotalCost());
}

@Test
void oneFloorDifferenceWithoutElevatorPrefersStairsBeforeElevator() {
  when(verticalPreferenceResolver.resolveAttemptOrder(start, goal, false))
      .thenReturn(List.of(VerticalTraversalMode.STAIRS_ONLY, VerticalTraversalMode.ELEVATOR_ONLY));
  when(aStarService.findPath(start, goal, false, VerticalTraversalMode.STAIRS_ONLY))
      .thenReturn(stairsRoute);

  RouteResponseDto result = service.route(1L, 2L, null, false);

  assertEquals(stairsRoute.getTotalCost(), result.getTotalCost());
}

@Test
void multiFloorDifferenceWithoutElevatorPrefersElevatorThenStairsFallback() {
  when(verticalPreferenceResolver.resolveAttemptOrder(start, goal, false))
      .thenReturn(List.of(VerticalTraversalMode.ELEVATOR_ONLY, VerticalTraversalMode.STAIRS_ONLY));
  when(aStarService.findPath(start, goal, false, VerticalTraversalMode.ELEVATOR_ONLY))
      .thenReturn(emptyRoute());
  when(aStarService.findPath(start, goal, false, VerticalTraversalMode.STAIRS_ONLY))
      .thenReturn(stairsRoute);

  RouteResponseDto result = service.route(1L, 2L, null, false);

  assertEquals(stairsRoute.getTotalCost(), result.getTotalCost());
}
```

Support method to add in the test file:

```java
private RouteSearchResult emptyRoute() {
  return RouteSearchResult.builder().nodes(List.of()).edges(List.of()).totalCost(0).build();
}
```

- [ ] **Step 5: Run focused service tests**

Run: `.\mvnw.cmd -q -Dtest=NavigationRouteServiceTest test`
Workdir: `D:\Feri Navigator\FERI-Navigator\backend`
Expected: route construction tests still pass, and the new tests prove elevator-exclusive mode plus stairs/elevator fallback behavior independently of edge weights.

- [ ] **Step 6: Commit route-preference orchestration**

```bash
git add backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java
git commit -m "feat: prefer stairs or elevator by floor difference"
```

### Task 4: Cover Controller-Level Contract Stability

**Files:**
- Modify: `backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java`

- [ ] **Step 1: Keep the public route API unchanged in tests**

Do not add new request parameters. Reuse:

```java
mockMvc.perform(
    get("/api/navigation/route")
        .param("fromLocationId", "11")
        .param("toLocationId", "12")
        .param("allowElevator", "true"))
```

- [ ] **Step 2: Add a regression assertion that confirms the toggle still reaches the service exactly as before**

```java
@Test
void getRouteStillPassesAllowElevatorFlagWithoutNewApiContract() throws Exception {
  when(navigationRouteService.route(11L, 12L, null, false))
      .thenReturn(RouteResponseDto.builder().routeId("route-11-12").segments(List.of()).build());

  mockMvc
      .perform(
          get("/api/navigation/route")
              .param("fromLocationId", "11")
              .param("toLocationId", "12")
              .param("allowElevator", "false"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.routeId").value("route-11-12"));

  verify(navigationRouteService).route(11L, 12L, null, false);
}
```

- [ ] **Step 3: Run controller tests**

Run: `.\mvnw.cmd -q -Dtest=NavigationControllerTest test`
Workdir: `D:\Feri Navigator\FERI-Navigator\backend`
Expected: controller tests stay green and prove the API contract did not change while the service internals did.

- [ ] **Step 4: Commit controller regression coverage**

```bash
git add backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java
git commit -m "test: keep route controller contract stable"
```

### Task 5: Document The New Vertical Preference Policy

**Files:**
- Modify: `docs/backend.md`

- [ ] **Step 1: Replace the outdated penalty-based explanation in the A* section**

Add or update a section like this:

```md
### Vertical preference policy

`AStarService` vise ne koristi fiksni penalty da bi neodredjeno "nagovorio" rutu ka liftu ili stepenicama.

Umesto toga, `NavigationRouteService` odredjuje redosled pokusaja na osnovu razlike u spratovima i korisnickog izbora:

- `floorDelta == 0` -> `ANY`
- `floorDelta > 0` i `allowElevator=true` -> prvo `ELEVATOR_ONLY`, fallback `STAIRS_ONLY`
- `floorDelta == 1` i `allowElevator=false` -> prvo `STAIRS_ONLY`, fallback `ELEVATOR_ONLY`
- `floorDelta >= 2` i `allowElevator=false` -> prvo `ELEVATOR_ONLY`, fallback `STAIRS_ONLY`
```

- [ ] **Step 2: Update the rules section so future developers change policy in the right place**

Add a maintenance note:

```md
Ako menjas preferenciju lift/stepenice, nemoj vracati fiksne cost penale u `AStarService`.
Pravila izbora pripadaju u `VerticalPreferenceResolver`, a `AStarService` samo sprovodi dozvoljeni skup edge-ova za dati mod.

`allowElevator=true` se sada tretira kao eksplicitan izbor lifta za vertikalno kretanje, a ne samo kao dozvola da lift sme da se koristi.
```

- [ ] **Step 3: Verify the docs mention the new classes and modes**

Run: `rg -n "VerticalPreferenceResolver|VerticalTraversalMode|STAIRS_ONLY|ELEVATOR_ONLY|floorDelta|allowElevator=true" docs/backend.md`
Workdir: `D:\Feri Navigator\FERI-Navigator`
Expected: the new policy terms appear in the backend docs and replace the old “slight penalty” story.

- [ ] **Step 4: Commit the documentation update**

```bash
git add docs/backend.md
git commit -m "docs: describe hard vertical routing preference rules"
```

### Task 6: Run The Final Backend Verification Set

**Files:**
- Modify: `backend/src/test/java/com/navigator/backend/service/AStarServiceTest.java`
- Modify: `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`
- Modify: `backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java`
- Create: `backend/src/test/java/com/navigator/backend/service/VerticalPreferenceResolverTest.java`

- [ ] **Step 1: Run the focused routing test suite together**

Run: `.\mvnw.cmd -q -Dtest=VerticalPreferenceResolverTest,AStarServiceTest,NavigationRouteServiceTest,NavigationControllerTest test`
Workdir: `D:\Feri Navigator\FERI-Navigator\backend`
Expected: all new and existing routing-related tests pass together, proving the resolver, search engine, service orchestration, and controller contract are aligned.

- [ ] **Step 2: Run the full backend test suite**

Run: `.\mvnw.cmd -q test`
Workdir: `D:\Feri Navigator\FERI-Navigator\backend`
Expected: the whole backend suite passes, with no failures introduced outside routing.

- [ ] **Step 3: Commit final verification**

```bash
git add backend/src/test/java/com/navigator/backend/service/VerticalPreferenceResolverTest.java backend/src/test/java/com/navigator/backend/service/AStarServiceTest.java backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java
git commit -m "test: verify hard vertical routing preference behavior"
```

---

## Implementation Notes

- Do **not** change `NavigationController` request parameters or frontend code in this feature.
- Do **not** keep both the old stairs penalty and the new traversal modes at the same time; that would make failures hard to reason about.
- Keep fallback strict and explicit:
  - different floors + `allowElevator=true`: elevator first, stairs second
  - one-floor route + `allowElevator=false`: stairs first, elevator second
  - two-or-more-floor route + `allowElevator=false`: elevator first, stairs second
- The resolver should depend on `Floor.levelNumber`, not labels like `"Pritlicje"` or `"1. nadstropje"`.
- If `levelNumber` is missing on a route node, fail fast with `IllegalStateException` so bad data is visible instead of silently producing the wrong preference.

## Self-Review

- **Spec coverage:** The plan covers the updated rules: same-floor routes stay unconstrained, the lift toggle means elevator-first exclusive behavior for vertical travel, one-floor travel without lift prefers stairs, multi-floor travel without lift prefers elevator, and fallback still returns a usable route when the preferred mode is unavailable.
- **Placeholder scan:** Every task includes exact files, code snippets, commands, and expected outcomes. There are no `TODO` or vague “handle edge cases” placeholders.
- **Type consistency:** The same names are used throughout the plan: `VerticalTraversalMode`, `VerticalPreferenceResolver`, `resolveAttemptOrder(...)`, and `findPath(..., allowElevator, traversalMode)`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-04-vertical-routing-preference.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
