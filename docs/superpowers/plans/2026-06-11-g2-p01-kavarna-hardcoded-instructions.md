# G2 P01 to Cafe Hardcoded Instructions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace generic corridor text with fixed presentation-friendly instructions only for the elevator route from G2 P01 to the G2 third-floor cafe.

**Architecture:** Keep A* routing, segments, step geometry, and graph data unchanged. After `NavigationRouteService` builds the normal response, detect the exact start and destination node external IDs with `allowElevator=true`, then return copied segments whose existing step texts are replaced by a small language-specific presentation script.

**Tech Stack:** Java 21, Spring Boot, Lombok DTO builders, JUnit 5, Mockito, Maven

---

### Task 1: Specify the presentation-only behavior

**Files:**
- Modify: `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`

- [ ] **Step 1: Add a failing Slovenian route test**

Create a route with nodes that model:

```text
G2_pritlicje_g2_p01
G2_pritlicje_wp6
G2_pritlicje_lift
G2_3_nadstropje_lift
G2_3_nadstropje_kavarna
```

Use corridor, elevator, and corridor edges. Call:

```java
RouteResponseDto result = service.route(1L, 2L, null, true, "sl-SI");
```

Flatten segment steps and assert these fixed texts in order:

```java
assertEquals(
    List.of(
        "Izstopite iz G2 P01 in sledite hodniku proti dvigalu.",
        "Z dvigalom se povzpnite v 3. nadstropje.",
        "Izstopite iz dvigala in zavijte proti kavarni.",
        "Kavarna je ob hodniku pri dvigalu."),
    result.getSegments().stream()
        .flatMap(segment -> segment.getSteps().stream())
        .map(RouteResponseDto.RouteStepDto::getText)
        .toList());
```

- [ ] **Step 2: Add a failing English route test**

Reuse the same modeled route, call the service with `"en-US"`, and assert:

```java
assertEquals(
    List.of(
        "Exit G2 P01 and follow the corridor toward the elevator.",
        "Take the elevator to the third floor.",
        "Exit the elevator and turn toward the cafe.",
        "The cafe is along the corridor near the elevator."),
    result.getSegments().stream()
        .flatMap(segment -> segment.getSteps().stream())
        .map(RouteResponseDto.RouteStepDto::getText)
        .toList());
```

- [ ] **Step 3: Add a negative test**

Change the destination external ID to `G2_3_nadstropje_lumen_lab`, keep
`allowElevator=true`, and assert that the flattened texts do not contain:

```java
"Kavarna je ob hodniku pri dvigalu."
```

Also call the cafe route with `allowElevator=false` and assert that the
presentation script is not applied.

- [ ] **Step 4: Run the focused tests and verify failure**

Run:

```powershell
cd backend
.\mvnw.cmd -Dtest=NavigationRouteServiceTest test
```

Expected: the new Slovenian and English assertions fail because the service
still returns generated instructions.

### Task 2: Add the narrow hardcoded override

**Files:**
- Modify: `backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java`

- [ ] **Step 1: Add exact route identifiers and scripts**

Add constants near the service fields:

```java
private static final String PRESENTATION_START = "G2_pritlicje_g2_p01";
private static final String PRESENTATION_DESTINATION = "G2_3_nadstropje_kavarna";

private static final List<String> PRESENTATION_STEPS_SL =
    List.of(
        "Izstopite iz G2 P01 in sledite hodniku proti dvigalu.",
        "Z dvigalom se povzpnite v 3. nadstropje.",
        "Izstopite iz dvigala in zavijte proti kavarni.",
        "Kavarna je ob hodniku pri dvigalu.");

private static final List<String> PRESENTATION_STEPS_EN =
    List.of(
        "Exit G2 P01 and follow the corridor toward the elevator.",
        "Take the elevator to the third floor.",
        "Exit the elevator and turn toward the cafe.",
        "The cafe is along the corridor near the elevator.");
```

- [ ] **Step 2: Apply the override after normal response construction**

Build the normal response into a local variable:

```java
RouteResponseDto response =
    RouteResponseDto.builder()
        .routeId("route-" + from.getId() + "-" + to.getId())
        .from(toLocationDto(from, language))
        .to(toLocationDto(to, language))
        .totalCost(searchResult.getTotalCost())
        .segments(buildSegments(searchResult, to, language))
        .build();

return applyPresentationInstructions(response, from, to, allowElevator, language);
```

- [ ] **Step 3: Implement exact matching and immutable copying**

Add:

```java
private RouteResponseDto applyPresentationInstructions(
    RouteResponseDto response,
    NavigationLocation from,
    NavigationLocation to,
    boolean allowElevator,
    NavigationLanguage language) {
  if (!allowElevator
      || !PRESENTATION_START.equals(from.getNode().getExternalId())
      || !PRESENTATION_DESTINATION.equals(to.getNode().getExternalId())) {
    return response;
  }

  List<RouteStepDto> routeSteps =
      response.getSegments().stream().flatMap(segment -> segment.getSteps().stream()).toList();
  List<String> texts =
      language == NavigationLanguage.ENGLISH ? PRESENTATION_STEPS_EN : PRESENTATION_STEPS_SL;

  if (routeSteps.size() != texts.size()) {
    return response;
  }

  int textIndex = 0;
  List<RouteSegmentDto> segments = new ArrayList<>();
  for (RouteSegmentDto segment : response.getSegments()) {
    List<RouteStepDto> steps = new ArrayList<>();
    for (RouteStepDto step : segment.getSteps()) {
      steps.add(copyStepWithText(step, texts.get(textIndex++)));
    }
    segments.add(copySegmentWithSteps(segment, steps));
  }

  return RouteResponseDto.builder()
      .routeId(response.getRouteId())
      .from(response.getFrom())
      .to(response.getTo())
      .totalCost(response.getTotalCost())
      .segments(segments)
      .build();
}
```

Add focused copy helpers that preserve every existing field:

```java
private RouteStepDto copyStepWithText(RouteStepDto step, String text) {
  return RouteStepDto.builder()
      .index(step.getIndex())
      .text(text)
      .fromNodeId(step.getFromNodeId())
      .toNodeId(step.getToNodeId())
      .type(step.getType())
      .icon(step.getIcon())
      .maneuverType(step.getManeuverType())
      .zoneId(step.getZoneId())
      .build();
}
```

`copySegmentWithSteps` must preserve the segment index, building and floor
metadata, map URL, coordinate dimensions, `z`, elevator/stairs flags, and path;
only `steps` is replaced.

- [ ] **Step 4: Run the focused tests**

Run:

```powershell
cd backend
.\mvnw.cmd -Dtest=NavigationRouteServiceTest test
```

Expected: all `NavigationRouteServiceTest` tests pass.

### Task 3: Verify the completed change

**Files:**
- Verify: `backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java`
- Verify: `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`

- [ ] **Step 1: Run formatting and diff checks**

Run:

```powershell
git diff --check
```

Expected: no whitespace errors.

- [ ] **Step 2: Run the full backend suite**

Run:

```powershell
cd backend
.\mvnw.cmd test
```

Expected: Maven exits with `BUILD SUCCESS`.

- [ ] **Step 3: Review scope**

Confirm that no migration, graph SQL, frontend file, route geometry, step type,
icon, maneuver type, or index changed as part of this implementation.

Do not commit, push, or create a pull request unless the user explicitly asks.
