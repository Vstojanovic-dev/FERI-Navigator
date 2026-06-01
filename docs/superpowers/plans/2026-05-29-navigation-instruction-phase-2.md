# Navigation Instruction Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Phase 1 navigation instruction system so route text becomes meaningfully more natural and reliable, especially for corridor grouping, side-aware destinations, lift/stairs transitions, and admin-side quality control.

**Architecture:** Keep A* and the existing semantic graph as the routing source of truth, but add a second-stage instruction refinement pipeline after raw maneuver generation. Phase 2 introduces explicit destination-side reasoning, transition-aware copy around lifts and stairs, a simplifier that merges low-value corridor steps, and an admin preview/lint flow so data gaps are visible before they reach end users.

**Tech Stack:** Spring Boot, JPA, PostgreSQL/PostGIS SQL seeds, React + TypeScript + CSS Modules, existing admin map editor and route API.

---

## File Structure

**Create:**
- `backend/src/main/java/com/navigator/backend/service/InstructionPostProcessorService.java`
- `backend/src/main/java/com/navigator/backend/service/DestinationSideResolver.java`
- `backend/src/main/java/com/navigator/backend/service/InstructionQualityEvaluator.java`
- `backend/src/main/java/com/navigator/backend/admin/dto/InstructionPreviewDto.java`
- `backend/src/main/java/com/navigator/backend/admin/dto/InstructionLintIssueDto.java`
- `backend/src/main/java/com/navigator/backend/admin/service/InstructionPreviewService.java`
- `backend/src/main/java/com/navigator/backend/admin/service/InstructionLintService.java`
- `backend/src/test/java/com/navigator/backend/service/InstructionPostProcessorServiceTest.java`
- `backend/src/test/java/com/navigator/backend/service/DestinationSideResolverTest.java`
- `backend/src/test/java/com/navigator/backend/admin/service/InstructionPreviewServiceTest.java`

**Modify:**
- `backend/src/main/java/com/navigator/backend/dto/RouteResponseDto.java`
- `backend/src/main/java/com/navigator/backend/service/InstructionGeneratorService.java`
- `backend/src/main/java/com/navigator/backend/service/InstructionGeometryService.java`
- `backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java`
- `backend/src/main/java/com/navigator/backend/controller/NavigationController.java`
- `backend/src/main/java/com/navigator/backend/admin/dto/MapEditorDto.java`
- `backend/src/main/java/com/navigator/backend/admin/service/MapEditorService.java`
- `backend/src/main/java/com/navigator/backend/admin/controller/MapEditorController.java`
- `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`
- `backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java`
- `frontend/src/types/navigation.ts`
- `frontend/src/services/navigationService.ts`
- `frontend/src/features/navigation/StepList.tsx`
- `frontend/src/features/navigation/NavigationView.module.css`
- `frontend/admin/src/AdminApp.tsx`
- `database/init/006_admin_navigation_graph.sql`
- `docs/navigation-instruction-upgrade-design.md`

---

### Task 1: Freeze Phase 2 Scope And Output Contracts

**Files:**
- Modify: `docs/navigation-instruction-upgrade-design.md`
- Modify: `backend/src/main/java/com/navigator/backend/dto/RouteResponseDto.java`

- [ ] **Step 1: Extend the design doc with an explicit Phase 2 section**

```md
## Phase 2 Scope
- Add side-aware destination text (`na levi strani`, `na desni strani`, `naravnost pred vami`) when the final approach geometry allows it.
- Merge low-value corridor steps after initial maneuver generation.
- Emit better lift and stairs transition text (`izstopite iz dvigala`, `po stopnicah nadaljujte desno`).
- Add route-step quality scoring so weak graph areas can be identified and improved.
- Add admin preview and linting for route instruction quality.
```

- [ ] **Step 2: Extend the public route step DTO with quality and side metadata**

```java
@Data
@Builder
public static class RouteStepDto {
  private int index;
  private String text;
  private Long fromNodeId;
  private Long toNodeId;
  private String type;
  private String icon;
  private String maneuverType;
  private Long zoneId;
  private String destinationSide;
  private String quality;
  private boolean derivedFromPreviewFallback;
}
```

- [ ] **Step 3: Verify the new contract is documented in both spec and DTO**

Run: `rg -n "destinationSide|quality|derivedFromPreviewFallback|Phase 2 Scope" docs/navigation-instruction-upgrade-design.md backend/src/main/java/com/navigator/backend/dto/RouteResponseDto.java`
Expected: each Phase 2 field appears in the design doc and DTO.

- [ ] **Step 4: Commit the Phase 2 contract update**

```bash
git add docs/navigation-instruction-upgrade-design.md backend/src/main/java/com/navigator/backend/dto/RouteResponseDto.java
git commit -m "docs: define navigation instruction phase 2 contract"
```

### Task 2: Add Side-Aware Destination Reasoning

**Files:**
- Create: `backend/src/main/java/com/navigator/backend/service/DestinationSideResolver.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/InstructionGeneratorService.java`
- Create: `backend/src/test/java/com/navigator/backend/service/DestinationSideResolverTest.java`

- [ ] **Step 1: Write failing unit tests for destination-side classification**

```java
@Test
void classifiesDestinationOnRightSide() {
  String side = resolver.resolveSide(approachNode, anchorNode, destinationNode);
  assertEquals("right", side);
}

@Test
void returnsUnknownWhenApproachVectorIsTooShort() {
  String side = resolver.resolveSide(approachNode, anchorNode, destinationNode);
  assertEquals("unknown", side);
}
```

- [ ] **Step 2: Implement geometric side classification using the final approach vector**

```java
public String resolveSide(NavNode previousNode, NavNode anchorNode, NavNode destinationNode) {
  double approachX = anchorNode.getX().doubleValue() - previousNode.getX().doubleValue();
  double approachY = anchorNode.getY().doubleValue() - previousNode.getY().doubleValue();
  double destinationX = destinationNode.getX().doubleValue() - anchorNode.getX().doubleValue();
  double destinationY = destinationNode.getY().doubleValue() - anchorNode.getY().doubleValue();

  double cross = (approachX * destinationY) - (approachY * destinationX);
  if (Math.abs(cross) < 1e-6) {
    return "front";
  }
  return cross > 0 ? "left" : "right";
}
```

- [ ] **Step 3: Use destination side in final-step text composition**

```java
if ("destination".equals(stepType) && hasKnownSide(destinationSide)) {
  return switch (destinationSide) {
    case "left" -> "Cilj je na levi strani hodnika.";
    case "right" -> "Cilj je na desni strani hodnika.";
    case "front" -> "Cilj je naravnost pred vami.";
    default -> "Cilj je na prikazani lokaciji.";
  };
}
```

- [ ] **Step 4: Run the new side resolver test class**

Run: `./mvnw -q -Dtest=DestinationSideResolverTest test`
Expected: left/right/front/unknown classification tests pass.

- [ ] **Step 5: Commit destination-side support**

```bash
git add backend/src/main/java/com/navigator/backend/service/DestinationSideResolver.java backend/src/main/java/com/navigator/backend/service/InstructionGeneratorService.java backend/src/test/java/com/navigator/backend/service/DestinationSideResolverTest.java
git commit -m "feat: add side-aware destination instructions"
```

### Task 3: Merge Low-Value Corridor Steps After Initial Maneuver Generation

**Files:**
- Create: `backend/src/main/java/com/navigator/backend/service/InstructionPostProcessorService.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java`
- Create: `backend/src/test/java/com/navigator/backend/service/InstructionPostProcessorServiceTest.java`

- [ ] **Step 1: Write failing tests for redundant corridor-step collapsing**

```java
@Test
void mergesAdjacentStraightCorridorStepsIntoSingleInstruction() {
  List<RouteStepDto> refined = postProcessor.refine(rawSteps, pathNodes);
  assertEquals(1, refined.size());
  assertEquals("straight", refined.get(0).getManeuverType());
}

@Test
void keepsTransitionStepsSeparateFromCorridorMerges() {
  List<RouteStepDto> refined = postProcessor.refine(rawSteps, pathNodes);
  assertEquals("elevator", refined.get(1).getType());
}
```

- [ ] **Step 2: Implement post-processing rules for corridor simplification**

```java
if (isMergeableCorridor(current, next)) {
  current =
      RouteStepDto.builder()
          .index(current.getIndex())
          .text(chooseMergedCorridorText(current, next))
          .fromNodeId(current.getFromNodeId())
          .toNodeId(next.getToNodeId())
          .type("corridor")
          .icon(current.getIcon())
          .maneuverType(current.getManeuverType())
          .zoneId(preferZone(current, next))
          .quality(minQuality(current, next))
          .build();
}
```

- [ ] **Step 3: Plug the post-processor into route-segment generation**

```java
List<RouteStepDto> generated =
    instructionGeneratorService.generateSteps(draft.nodes, draft.edges, floorId);
List<RouteStepDto> refined =
    reindexSteps(instructionPostProcessorService.refine(generated, draft.nodes, draft.edges));
```

- [ ] **Step 4: Run focused post-processing tests**

Run: `./mvnw -q -Dtest=InstructionPostProcessorServiceTest,NavigationRouteServiceTest test`
Expected: redundant straight corridor steps collapse while elevator and stairs boundaries remain intact.

- [ ] **Step 5: Commit the simplifier**

```bash
git add backend/src/main/java/com/navigator/backend/service/InstructionPostProcessorService.java backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java backend/src/test/java/com/navigator/backend/service/InstructionPostProcessorServiceTest.java backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java
git commit -m "feat: simplify low-value corridor instructions"
```

### Task 4: Improve Lift And Stairs Transition Copy Across Floors

**Files:**
- Modify: `backend/src/main/java/com/navigator/backend/service/InstructionGeneratorService.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/InstructionGeometryService.java`
- Modify: `backend/src/test/java/com/navigator/backend/service/InstructionGeneratorServiceTest.java`

- [ ] **Step 1: Add failing tests for entry and exit transition text**

```java
@Test
void generatesElevatorExitFollowUpText() {
  assertEquals("Izstopite iz dvigala in zavijte desno.", steps.get(0).getText());
}

@Test
void generatesStairsExitFollowUpText() {
  assertEquals("Po stopnicah nadaljujte levo.", steps.get(0).getText());
}
```

- [ ] **Step 2: Teach the generator to inspect previous transition steps**

```java
private String resolveTransitionAwareText(RouteStepDto previousStep, String maneuverType, String baseText) {
  if (previousStep == null) {
    return baseText;
  }
  if ("elevator".equals(previousStep.getType()) && isDirectionalManeuver(maneuverType)) {
    return directionalPrefix(maneuverType, "Izstopite iz dvigala in ");
  }
  if ("stairs".equals(previousStep.getType()) && isDirectionalManeuver(maneuverType)) {
    return directionalPrefix(maneuverType, "Po stopnicah ");
  }
  return baseText;
}
```

- [ ] **Step 3: Extend geometry thresholds for slight turns after vertical transitions**

```java
if (angleDegrees >= 20 && angleDegrees < 45) {
  return "slight_right";
}
if (angleDegrees <= -20 && angleDegrees > -45) {
  return "slight_left";
}
```

- [ ] **Step 4: Run transition-specific tests**

Run: `./mvnw -q -Dtest=InstructionGeneratorServiceTest test`
Expected: lift and stairs follow-up copy becomes transition-aware without changing unrelated destination behavior.

- [ ] **Step 5: Commit transition copy improvements**

```bash
git add backend/src/main/java/com/navigator/backend/service/InstructionGeneratorService.java backend/src/main/java/com/navigator/backend/service/InstructionGeometryService.java backend/src/test/java/com/navigator/backend/service/InstructionGeneratorServiceTest.java
git commit -m "feat: improve floor transition instructions"
```

### Task 5: Add Instruction Quality Scoring And Fallback Policy

**Files:**
- Create: `backend/src/main/java/com/navigator/backend/service/InstructionQualityEvaluator.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/InstructionGeneratorService.java`
- Modify: `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`

- [ ] **Step 1: Write failing tests for quality assignment**

```java
@Test
void marksOverrideBackedInstructionAsHighQuality() {
  assertEquals("high", step.getQuality());
}

@Test
void marksGenericCorridorFallbackAsLowQuality() {
  assertEquals("low", step.getQuality());
}
```

- [ ] **Step 2: Implement deterministic quality scoring**

```java
public String evaluateQuality(
    NavEdge anchorEdge, NavigationInstructionZone zone, String text, String maneuverType) {
  if (hasText(anchorEdge.getInstructionForward()) || hasText(anchorEdge.getInstructionIcon())) {
    return "high";
  }
  if (zone != null && (hasText(zone.getInstructionForward()) || hasText(zone.getInstructionIcon()))) {
    return "high";
  }
  if ("destination".equals(maneuverType) || "elevator".equals(maneuverType) || "stairs_up".equals(maneuverType)) {
    return "medium";
  }
  return text.startsWith("Nadaljujte po hodniku") ? "low" : "medium";
}
```

- [ ] **Step 3: Populate `quality` and `derivedFromPreviewFallback` in each route step**

```java
String quality = instructionQualityEvaluator.evaluateQuality(anchorEdge, zone, text, maneuverType);
boolean derivedFromPreviewFallback = "low".equals(quality) && !hasAnyOverride(anchorEdge, zone);
```

- [ ] **Step 4: Run quality-focused tests**

Run: `./mvnw -q -Dtest=NavigationRouteServiceTest test`
Expected: route step DTOs include quality and fallback flags with stable values.

- [ ] **Step 5: Commit the quality layer**

```bash
git add backend/src/main/java/com/navigator/backend/service/InstructionQualityEvaluator.java backend/src/main/java/com/navigator/backend/service/InstructionGeneratorService.java backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java
git commit -m "feat: score instruction quality"
```

### Task 6: Expose Admin Route Preview For Any Start/End Pair

**Files:**
- Create: `backend/src/main/java/com/navigator/backend/admin/dto/InstructionPreviewDto.java`
- Create: `backend/src/main/java/com/navigator/backend/admin/service/InstructionPreviewService.java`
- Modify: `backend/src/main/java/com/navigator/backend/admin/controller/MapEditorController.java`
- Create: `backend/src/test/java/com/navigator/backend/admin/service/InstructionPreviewServiceTest.java`

- [ ] **Step 1: Define the preview DTO**

```java
@Data
@Builder
public class InstructionPreviewDto {
  private Long fromLocationId;
  private Long toLocationId;
  private String routeId;
  private double totalCost;
  private List<RouteResponseDto.RouteSegmentDto> segments;
}
```

- [ ] **Step 2: Implement preview generation by reusing the public route service**

```java
public InstructionPreviewDto preview(Long fromLocationId, Long toLocationId, boolean allowElevator) {
  RouteResponseDto route = navigationRouteService.route(fromLocationId, toLocationId, null, allowElevator);
  return InstructionPreviewDto.builder()
      .fromLocationId(fromLocationId)
      .toLocationId(toLocationId)
      .routeId(route.getRouteId())
      .totalCost(route.getTotalCost())
      .segments(route.getSegments())
      .build();
}
```

- [ ] **Step 3: Add an admin endpoint for preview**

```java
@GetMapping("/instruction-preview")
public InstructionPreviewDto previewInstructions(
    @RequestParam Long fromLocationId,
    @RequestParam Long toLocationId,
    @RequestParam(defaultValue = "true") boolean allowElevator) {
  return instructionPreviewService.preview(fromLocationId, toLocationId, allowElevator);
}
```

- [ ] **Step 4: Run the preview service test**

Run: `./mvnw -q -Dtest=InstructionPreviewServiceTest test`
Expected: preview returns the same segment structure as the public route endpoint.

- [ ] **Step 5: Commit the preview API**

```bash
git add backend/src/main/java/com/navigator/backend/admin/dto/InstructionPreviewDto.java backend/src/main/java/com/navigator/backend/admin/service/InstructionPreviewService.java backend/src/main/java/com/navigator/backend/admin/controller/MapEditorController.java backend/src/test/java/com/navigator/backend/admin/service/InstructionPreviewServiceTest.java
git commit -m "feat: add admin instruction preview"
```

### Task 7: Add Admin Linting For Weak Graph Semantics

**Files:**
- Create: `backend/src/main/java/com/navigator/backend/admin/dto/InstructionLintIssueDto.java`
- Create: `backend/src/main/java/com/navigator/backend/admin/service/InstructionLintService.java`
- Modify: `backend/src/main/java/com/navigator/backend/admin/service/MapEditorService.java`
- Modify: `backend/src/main/java/com/navigator/backend/admin/controller/MapEditorController.java`

- [ ] **Step 1: Define lint issue categories**

```java
public enum InstructionLintCode {
  MISSING_DECISION_TYPE,
  LONG_CORRIDOR_WITHOUT_ZONE,
  DESTINATION_WITHOUT_SIDE_HINT,
  EDGE_OVERRIDE_ICON_TEXT_CONFLICT,
  REPEATED_GENERIC_CORRIDOR_COPY
}
```

- [ ] **Step 2: Implement lint rules over nodes, edges, and preview output**

```java
if (corridorLength > 250 && zoneId == null) {
  issues.add(issue("LONG_CORRIDOR_WITHOUT_ZONE", edge.getId(), "Long corridor should be grouped into an instruction zone."));
}
if (hasIconTextConflict(edge)) {
  issues.add(issue("EDGE_OVERRIDE_ICON_TEXT_CONFLICT", edge.getId(), "Override text does not match the configured instruction icon."));
}
```

- [ ] **Step 3: Expose lint results in the admin API**

```java
@GetMapping("/instruction-lint")
public List<InstructionLintIssueDto> lintInstructions(@RequestParam Long floorId) {
  return instructionLintService.lintFloor(floorId);
}
```

- [ ] **Step 4: Run focused lint tests**

Run: `./mvnw -q -Dtest=InstructionPreviewServiceTest,NavigationRouteServiceTest test`
Expected: representative weak-data cases return actionable lint issues.

- [ ] **Step 5: Commit admin linting**

```bash
git add backend/src/main/java/com/navigator/backend/admin/dto/InstructionLintIssueDto.java backend/src/main/java/com/navigator/backend/admin/service/InstructionLintService.java backend/src/main/java/com/navigator/backend/admin/service/MapEditorService.java backend/src/main/java/com/navigator/backend/admin/controller/MapEditorController.java
git commit -m "feat: add navigation instruction linting"
```

### Task 8: Surface Preview And Quality Warnings In The Admin UI

**Files:**
- Modify: `frontend/admin/src/AdminApp.tsx`

- [ ] **Step 1: Add preview and lint state**

```ts
type InstructionPreview = {
  routeId: string;
  totalCost: number;
  segments: RouteSegment[];
};

type InstructionLintIssue = {
  code: string;
  entityId: number | null;
  severity: "info" | "warning" | "error";
  message: string;
};
```

- [ ] **Step 2: Add a preview panel for selected start/end locations**

```tsx
<section className={styles.previewPanel}>
  <h3>Instruction preview</h3>
  <button onClick={loadInstructionPreview}>Generate preview</button>
  {preview?.segments.map((segment) => (
    <div key={`${preview.routeId}-${segment.index}`}>
      <h4>{segment.floorLabel}</h4>
      {segment.steps.map((step) => (
        <div key={`${segment.index}-${step.index}`}>
          <span>{step.icon}</span>
          <span>{step.text}</span>
          <small>{step.quality}</small>
        </div>
      ))}
    </div>
  ))}
</section>
```

- [ ] **Step 3: Add a lint panel for quality issues**

```tsx
<section className={styles.lintPanel}>
  <h3>Instruction quality warnings</h3>
  {lintIssues.map((issue) => (
    <div key={`${issue.code}-${issue.entityId}`}>{issue.message}</div>
  ))}
</section>
```

- [ ] **Step 4: Run the admin build**

Run: `npm.cmd --prefix frontend/admin run build`
Expected: admin preview and lint panels compile and no longer assume route steps only expose `icon + text`.

- [ ] **Step 5: Commit the admin UI quality tooling**

```bash
git add frontend/admin/src/AdminApp.tsx
git commit -m "feat: surface instruction preview and lint warnings"
```

### Task 9: Surface Quality And Better Text In The User Navigation UI

**Files:**
- Modify: `frontend/src/types/navigation.ts`
- Modify: `frontend/src/services/navigationService.ts`
- Modify: `frontend/src/features/navigation/StepList.tsx`
- Modify: `frontend/src/features/navigation/NavigationView.module.css`

- [ ] **Step 1: Extend frontend step types**

```ts
export type NavigationStep = {
  index: number;
  text: string;
  fromNodeId: number;
  toNodeId: number;
  type: string;
  icon: string;
  maneuverType: string;
  zoneId: number | null;
  destinationSide: string | null;
  quality: "high" | "medium" | "low";
  derivedFromPreviewFallback: boolean;
};
```

- [ ] **Step 2: Render quality only when it helps debugging, not for normal users**

```tsx
{debugMode && step.quality === "low" ? (
  <span className={styles.lowQualityBadge}>fallback</span>
) : null}
```

- [ ] **Step 3: Improve visual separation for floor-transition steps**

```css
.transitionStep {
  border-left: 3px solid var(--nav-accent);
  background: linear-gradient(90deg, rgba(18, 92, 158, 0.08), transparent);
}
```

- [ ] **Step 4: Run the user frontend build**

Run: `npm.cmd --prefix frontend run build`
Expected: route rendering still works and transition/destination steps show the richer copy from the API.

- [ ] **Step 5: Commit the user UI refinement**

```bash
git add frontend/src/types/navigation.ts frontend/src/services/navigationService.ts frontend/src/features/navigation/StepList.tsx frontend/src/features/navigation/NavigationView.module.css
git commit -m "feat: show richer phase 2 route instructions"
```

### Task 10: Seed And Validate Representative G2 Improvements

**Files:**
- Modify: `database/init/006_admin_navigation_graph.sql`

- [ ] **Step 1: Add or refine overrides for the most visible transition and destination cases**

```sql
UPDATE navigation_edges
SET instruction_forward = 'Izstopite iz dvigala in zavijte desno proti učilnicam.',
    instruction_icon = 'right'
WHERE from_external_id = 'G2_2_nadstropje_lift'
  AND to_external_id = 'G2_2_nadstropje_prostor_za_ucenje2';
```

- [ ] **Step 2: Add at least one zone or override that demonstrates side-aware destination text**

```sql
UPDATE navigation_edges
SET instruction_forward = 'Učilnica je na desni strani hodnika.',
    instruction_icon = 'destination'
WHERE to_external_id = 'G2_2_nadstropje_g2_p3_gama';
```

- [ ] **Step 3: Rebuild the validation stack and run concrete route checks**

Run:
- `docker compose up -d --build`
- `GET /api/navigation/route?fromLocationId=71&toLocationId=26&allowElevator=true`
- `GET /api/navigation/route?fromLocationId=71&toLocationId=27&allowElevator=true`
- `GET /api/navigation/route?fromLocationId=71&targetType=wc&allowElevator=false`

Expected:
- one route shows lift transitions,
- one route shows corridor simplification,
- one route shows stairs,
- final steps use destination-side wording when geometry and data allow it.

- [ ] **Step 4: Commit the validated G2 data improvements**

```bash
git add database/init/006_admin_navigation_graph.sql
git commit -m "data: refine phase 2 instruction examples"
```

### Task 11: Expand Backend Test Coverage For Phase 2 Behavior

**Files:**
- Modify: `backend/src/test/java/com/navigator/backend/service/InstructionGeneratorServiceTest.java`
- Modify: `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`
- Modify: `backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java`
- Create: `backend/src/test/java/com/navigator/backend/service/InstructionPostProcessorServiceTest.java`
- Create: `backend/src/test/java/com/navigator/backend/service/DestinationSideResolverTest.java`
- Create: `backend/src/test/java/com/navigator/backend/admin/service/InstructionPreviewServiceTest.java`

- [ ] **Step 1: Add backend tests for Phase 2 payload fields**

```java
assertEquals("right", result.getSegments().get(1).getSteps().get(0).getDestinationSide());
assertEquals("high", result.getSegments().get(1).getSteps().get(0).getQuality());
assertEquals(false, result.getSegments().get(1).getSteps().get(0).isDerivedFromPreviewFallback());
```

- [ ] **Step 2: Add controller tests for preview and lint endpoints**

```java
mockMvc.perform(get("/api/admin/map-editor/instruction-preview")
        .param("fromLocationId", "71")
        .param("toLocationId", "26"))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.segments[0].steps[0].quality").exists());

mockMvc.perform(get("/api/admin/map-editor/instruction-lint")
        .param("floorId", "4"))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$[0].code").exists());
```

- [ ] **Step 3: Run the focused Phase 2 backend suite**

Run: `./mvnw -q -Dtest=InstructionGeneratorServiceTest,InstructionPostProcessorServiceTest,DestinationSideResolverTest,NavigationRouteServiceTest,NavigationControllerTest,InstructionPreviewServiceTest test`
Expected: all new geometry, post-processing, preview, and lint tests pass.

- [ ] **Step 4: Commit Phase 2 test coverage**

```bash
git add backend/src/test/java/com/navigator/backend/service/InstructionGeneratorServiceTest.java backend/src/test/java/com/navigator/backend/service/InstructionPostProcessorServiceTest.java backend/src/test/java/com/navigator/backend/service/DestinationSideResolverTest.java backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java backend/src/test/java/com/navigator/backend/admin/service/InstructionPreviewServiceTest.java
git commit -m "test: cover navigation instruction phase 2 behavior"
```

### Task 12: Final Verification And Delivery

**Files:**
- Modify: `docs/navigation-instruction-upgrade-design.md`
- Modify: `docs/superpowers/plans/2026-05-29-navigation-instruction-phase-2.md`

- [ ] **Step 1: Run the full verification set**

Run:
- `./mvnw -q test`
- `npm.cmd --prefix frontend run build`
- `npm.cmd --prefix frontend/admin run build`

Expected:
- backend tests pass under the supported Java toolchain,
- frontend and admin build pass,
- route payload stays backward-compatible except for additive fields.

- [ ] **Step 2: Update the design doc with Phase 2 implementation notes**

```md
## Phase 2 Implementation Notes
- `quality` is diagnostic metadata and should not be shown to end users unless debug mode is enabled.
- `destinationSide` is additive and may be `unknown` when final approach geometry is ambiguous.
- Transition-aware text is generated after base maneuvers are computed, not by changing A*.
```

- [ ] **Step 3: Commit the final verification pass**

```bash
git add docs/navigation-instruction-upgrade-design.md docs/superpowers/plans/2026-05-29-navigation-instruction-phase-2.md
git commit -m "docs: finalize navigation instruction phase 2 plan"
```

---

## Self-Review

- **Spec coverage:** The plan covers the five agreed Phase 2 improvements: side-aware destination text, stronger corridor grouping, better lift/stairs transitions, admin preview plus linting, and instruction quality scoring.
- **Placeholder scan:** No task contains `TODO`, `TBD`, or “implement later”; each task lists exact files, concrete code examples, and validation commands.
- **Type consistency:** The same additive route-step fields (`destinationSide`, `quality`, `derivedFromPreviewFallback`) are used consistently across backend DTOs, API tests, frontend types, and admin preview flows.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-29-navigation-instruction-phase-2.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
