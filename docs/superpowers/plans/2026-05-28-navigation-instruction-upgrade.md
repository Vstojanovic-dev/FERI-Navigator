# Navigation Instruction Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static waypoint-style navigation copy with Slovenian natural-language instructions and arrow/action icons, while keeping routing generic across the existing graph and allowing admin overrides on critical edges and zones.

**Architecture:** Keep A* and the current node/edge graph as the routing source of truth. Add graph semantics (`decision_type`, `path_role`, icon override) plus optional instruction zones for long corridors, then introduce a backend instruction generator that converts raw path segments into user-facing maneuvers. The frontend stops rendering step numbers and instead renders icon + text from the route response.

**Tech Stack:** Spring Boot, JPA, PostgreSQL/PostGIS SQL seeds, React + TypeScript + CSS Modules, existing admin map editor.

---

## File Structure

**Create:**
- `docs/navigation-instruction-upgrade-design.md`
- `database/init/010_navigation_instruction_semantics.sql`
- `backend/src/main/java/com/navigator/backend/model/NavigationInstructionZone.java`
- `backend/src/main/java/com/navigator/backend/repository/NavigationInstructionZoneRepository.java`
- `backend/src/main/java/com/navigator/backend/service/InstructionGeneratorService.java`
- `backend/src/main/java/com/navigator/backend/service/InstructionGeometryService.java`
- `backend/src/main/java/com/navigator/backend/service/InstructionZoneResolver.java`
- `backend/src/test/java/com/navigator/backend/service/InstructionGeneratorServiceTest.java`

**Modify:**
- `database/init/001_schema.sql`
- `database/init/005_mvp_navigation_edges.sql`
- `database/init/006_admin_navigation_graph.sql`
- `backend/src/main/java/com/navigator/backend/model/NavNode.java`
- `backend/src/main/java/com/navigator/backend/model/NavEdge.java`
- `backend/src/main/java/com/navigator/backend/dto/RouteResponseDto.java`
- `backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java`
- `backend/src/main/java/com/navigator/backend/controller/NavigationController.java`
- `backend/src/main/java/com/navigator/backend/admin/dto/MapEditorDto.java`
- `backend/src/main/java/com/navigator/backend/admin/model/AdminNavNode.java`
- `backend/src/main/java/com/navigator/backend/admin/model/AdminNavEdge.java`
- `backend/src/main/java/com/navigator/backend/admin/service/MapEditorService.java`
- `backend/src/main/java/com/navigator/backend/admin/service/AdminSqlExportService.java`
- `frontend/src/types/navigation.ts`
- `frontend/src/services/navigationService.ts`
- `frontend/src/features/navigation/StepList.tsx`
- `frontend/src/features/navigation/NavigationView.module.css`
- `frontend/admin/src/AdminApp.tsx`
- `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`
- `backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java`

### Task 1: Freeze The Agreed Design In The Repo

**Files:**
- Create: `docs/navigation-instruction-upgrade-design.md`

- [ ] **Step 1: Write the approved design doc before touching implementation**

```md
# Navigation Instruction Upgrade Design

## Decisions
- Instruction language in v1 is Slovenian only.
- Instruction generation is hybrid 70/30: automatic by default, admin override on critical edges and zones.
- UI removes visible step numbers entirely.
- Icon set is expanded but pragmatic: straight, slight left/right, left, right, turn back, stairs up/down, elevator, elevator exit, enter, destination, building transfer.
- Graph stays generic for all existing buildings; weak data may produce weaker copy.
- Data model is combined: semantic graph + optional instruction zones for long corridors and ambiguous areas.

## Main Idea
Route calculation stays unchanged at the A* layer. A post-processing generator converts raw node/edge paths into user-facing maneuvers by:
1. grouping technical corridor edges,
2. detecting turns from geometry,
3. honoring edge/zone instruction overrides,
4. emitting `text + icon + maneuverType`.
```

- [ ] **Step 2: Review the design doc for scope drift**

Run: `rg -n "TODO|TBD|English|numbered steps" docs/navigation-instruction-upgrade-design.md`
Expected: no matches for unfinished scope, and the design explicitly says Slovenian-only and no visible step numbers.

- [ ] **Step 3: Commit the design doc**

```bash
git add docs/navigation-instruction-upgrade-design.md
git commit -m "docs: capture navigation instruction upgrade design"
```

### Task 2: Extend The Schema For Semantics And Zones

**Files:**
- Modify: `database/init/001_schema.sql`
- Create: `database/init/010_navigation_instruction_semantics.sql`

- [ ] **Step 1: Write the failing schema expectations as a checklist in the migration**

```sql
-- Expect these columns/tables after this migration:
-- navigation_nodes.decision_type
-- navigation_nodes.instruction_zone_id
-- navigation_edges.path_role
-- navigation_edges.instruction_icon
-- navigation_instruction_zones
```

- [ ] **Step 2: Add semantic columns and zone table to base schema**

```sql
ALTER TABLE navigation_nodes
    ADD COLUMN decision_type VARCHAR(40) NOT NULL DEFAULT 'none',
    ADD COLUMN instruction_zone_id BIGINT;

ALTER TABLE navigation_edges
    ADD COLUMN path_role VARCHAR(40) NOT NULL DEFAULT 'normal',
    ADD COLUMN instruction_icon VARCHAR(40);

CREATE TABLE navigation_instruction_zones (
    id BIGSERIAL PRIMARY KEY,
    floor_id BIGINT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    code VARCHAR(120) NOT NULL,
    label VARCHAR(160) NOT NULL,
    zone_type VARCHAR(40) NOT NULL,
    default_instruction_style VARCHAR(40) NOT NULL DEFAULT 'corridor',
    landmark VARCHAR(160),
    instruction_icon VARCHAR(40),
    instruction_forward TEXT,
    instruction_backward TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_navigation_instruction_zones_floor_code UNIQUE (floor_id, code)
);

ALTER TABLE navigation_nodes
    ADD CONSTRAINT fk_navigation_nodes_instruction_zone
    FOREIGN KEY (instruction_zone_id) REFERENCES navigation_instruction_zones(id) ON DELETE SET NULL;

CREATE INDEX idx_navigation_nodes_decision_type ON navigation_nodes(decision_type);
CREATE INDEX idx_navigation_nodes_instruction_zone ON navigation_nodes(instruction_zone_id);
CREATE INDEX idx_navigation_edges_path_role ON navigation_edges(path_role);
CREATE INDEX idx_navigation_instruction_zones_floor ON navigation_instruction_zones(floor_id);
```

- [ ] **Step 3: Add the same DDL as an additive migration for existing environments**

```sql
ALTER TABLE navigation_nodes
    ADD COLUMN IF NOT EXISTS decision_type VARCHAR(40) NOT NULL DEFAULT 'none';

ALTER TABLE navigation_nodes
    ADD COLUMN IF NOT EXISTS instruction_zone_id BIGINT;

ALTER TABLE navigation_edges
    ADD COLUMN IF NOT EXISTS path_role VARCHAR(40) NOT NULL DEFAULT 'normal';

ALTER TABLE navigation_edges
    ADD COLUMN IF NOT EXISTS instruction_icon VARCHAR(40);
```

- [ ] **Step 4: Verify the migration files reference the new instruction zone table and columns**

Run: `rg -n "decision_type|instruction_zone_id|path_role|instruction_icon|navigation_instruction_zones" database/init/001_schema.sql database/init/010_navigation_instruction_semantics.sql`
Expected: each identifier appears in schema and additive migration.

- [ ] **Step 5: Commit the schema change**

```bash
git add database/init/001_schema.sql database/init/010_navigation_instruction_semantics.sql
git commit -m "feat: add navigation instruction semantics schema"
```

### Task 3: Seed Generic Defaults Without Breaking Existing Routes

**Files:**
- Modify: `database/init/005_mvp_navigation_edges.sql`
- Modify: `database/init/006_admin_navigation_graph.sql`

- [ ] **Step 1: Extend edge seed input to include new semantics**

```sql
WITH edge_input(
    from_external_id,
    to_external_id,
    edge_type_code,
    is_cross_floor,
    is_cross_building,
    instruction_forward,
    instruction_backward,
    landmark,
    path_role,
    instruction_icon
) AS (
    VALUES
        ('G2_pritlicje_lift', 'G2_2_nadstropje_lift', 'elevator', TRUE, FALSE,
         'Vstopite v dvigalo in pojdite v 2. nadstropje.',
         'Vstopite v dvigalo in pojdite v pritličje.',
         'Lift', 'change_floor', 'elevator'),
        ('G2_2_nadstropje_wp12', 'G2_2_nadstropje_farad_lab', 'virtual', FALSE, FALSE,
         'Laboratorij Farad je na desni strani hodnika.',
         'Vrnite se iz laboratorija Farad na hodnik.',
         'Farad', 'enter_room', 'destination')
)
```

- [ ] **Step 2: Persist the new edge columns in the upsert**

```sql
INSERT INTO navigation_edges (
    from_node_id,
    to_node_id,
    edge_type_id,
    weight,
    geom,
    is_bidirectional,
    is_cross_floor,
    is_cross_building,
    instruction_forward,
    instruction_backward,
    landmark,
    path_role,
    instruction_icon
)
SELECT
    from_node_id,
    to_node_id,
    edge_type_id,
    weight,
    geom,
    TRUE,
    is_cross_floor,
    is_cross_building,
    instruction_forward,
    instruction_backward,
    landmark,
    path_role,
    instruction_icon
FROM directed_edges
```

- [ ] **Step 3: Seed node semantics and initial zones in the admin snapshot**

```sql
-- Example node shape in 006_admin_navigation_graph.sql
('G2_2_nadstropje_wp10', 'Razcep pri stopnišču', 'corridor', 810.0, 255.0, 2.0, FALSE, TRUE, 'junction', 'G2_2_hodnik_a'),
('G2_2_nadstropje_stepeniste_lift', 'Stopnišče pri liftu', 'stairs', 785.0, 240.0, 2.0, FALSE, TRUE, 'stairs_entry', 'G2_2_stairs_lift')

-- Example zone seed
('G2', '2_nadstropje', 'G2_2_hodnik_a', 'Glavni hodnik pri laboratorijih', 'corridor', 'to_end_of_corridor', 'Laboratoriji', 'straight', NULL, NULL)
```

- [ ] **Step 4: Verify the seed still contains every existing edge and now exposes semantics**

Run: `rg -n "path_role|instruction_icon|decision_type|navigation_instruction_zones" database/init/005_mvp_navigation_edges.sql database/init/006_admin_navigation_graph.sql`
Expected: both files include the new fields without deleting current edge coverage.

- [ ] **Step 5: Commit the seed update**

```bash
git add database/init/005_mvp_navigation_edges.sql database/init/006_admin_navigation_graph.sql
git commit -m "feat: seed navigation instruction semantics"
```

### Task 4: Wire The New Schema Into JPA Models And DTOs

**Files:**
- Create: `backend/src/main/java/com/navigator/backend/model/NavigationInstructionZone.java`
- Modify: `backend/src/main/java/com/navigator/backend/model/NavNode.java`
- Modify: `backend/src/main/java/com/navigator/backend/model/NavEdge.java`
- Create: `backend/src/main/java/com/navigator/backend/repository/NavigationInstructionZoneRepository.java`
- Modify: `backend/src/main/java/com/navigator/backend/dto/RouteResponseDto.java`

- [ ] **Step 1: Add the new zone entity**

```java
@Entity
@Table(name = "navigation_instruction_zones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NavigationInstructionZone {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "floor_id", nullable = false)
  private Long floorId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "floor_id", insertable = false, updatable = false)
  private Floor floor;

  @Column(name = "code", nullable = false)
  private String code;

  @Column(name = "label", nullable = false)
  private String label;

  @Column(name = "zone_type", nullable = false)
  private String zoneType;

  @Column(name = "default_instruction_style", nullable = false)
  private String defaultInstructionStyle;

  @Column(name = "landmark")
  private String landmark;

  @Column(name = "instruction_icon")
  private String instructionIcon;

  @Column(name = "instruction_forward")
  private String instructionForward;

  @Column(name = "instruction_backward")
  private String instructionBackward;
}
```

- [ ] **Step 2: Add semantic fields to `NavNode` and `NavEdge`**

```java
@Column(name = "decision_type", nullable = false)
private String decisionType;

@Column(name = "instruction_zone_id")
private Long instructionZoneId;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "instruction_zone_id", insertable = false, updatable = false)
private NavigationInstructionZone instructionZone;
```

```java
@Column(name = "path_role", nullable = false)
private String pathRole;

@Column(name = "instruction_icon")
private String instructionIcon;
```

- [ ] **Step 3: Add route step output fields needed by the frontend**

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
}
```

- [ ] **Step 4: Add the zone repository**

```java
public interface NavigationInstructionZoneRepository
    extends JpaRepository<NavigationInstructionZone, Long> {

  List<NavigationInstructionZone> findByFloorId(Long floorId);
}
```

- [ ] **Step 5: Run the backend test suite to verify the model still compiles**

Run: `./mvnw -q test`
Expected: tests fail only where route step DTO construction or service wiring still expects the old shape.

- [ ] **Step 6: Commit the model and DTO update**

```bash
git add backend/src/main/java/com/navigator/backend/model/NavNode.java backend/src/main/java/com/navigator/backend/model/NavEdge.java backend/src/main/java/com/navigator/backend/model/NavigationInstructionZone.java backend/src/main/java/com/navigator/backend/repository/NavigationInstructionZoneRepository.java backend/src/main/java/com/navigator/backend/dto/RouteResponseDto.java
git commit -m "feat: model navigation instruction semantics"
```

### Task 5: Build The Instruction Generator

**Files:**
- Create: `backend/src/main/java/com/navigator/backend/service/InstructionGeometryService.java`
- Create: `backend/src/main/java/com/navigator/backend/service/InstructionZoneResolver.java`
- Create: `backend/src/main/java/com/navigator/backend/service/InstructionGeneratorService.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java`

- [ ] **Step 1: Add geometry helpers for turn classification**

```java
public class InstructionGeometryService {

  public String classifyTurn(NavNode previous, NavNode current, NavNode next) {
    double angle = signedAngle(previous, current, next);
    if (angle >= -25 && angle <= 25) return "straight";
    if (angle > 25 && angle <= 60) return "slight_right";
    if (angle > 60 && angle <= 140) return "right";
    if (angle < -25 && angle >= -60) return "slight_left";
    if (angle < -60 && angle >= -140) return "left";
    return "turn_back";
  }
}
```

- [ ] **Step 2: Add zone-aware grouping rules**

```java
public record InstructionChunk(
    List<NavNode> nodes,
    List<NavEdge> edges,
    String maneuverType,
    Long zoneId,
    boolean hasOverride) {}
```

```java
boolean canMerge(NavEdge edge, NavNode node, Long currentZoneId) {
  return "normal".equals(edge.getPathRole())
      && "waypoint".equals(node.getDecisionType())
      && Objects.equals(node.getInstructionZoneId(), currentZoneId)
      && !hasOverride(edge);
}
```

- [ ] **Step 3: Generate Slovenian step text with override precedence**

```java
String resolveText(InstructionChunk chunk, boolean arrivalContext) {
  if (chunk.hasOverride()) {
    return overrideText(chunk, arrivalContext);
  }
  return switch (chunk.maneuverType()) {
    case "stairs_up" -> "Pojdite po stopnicah navzgor.";
    case "stairs_down" -> "Pojdite po stopnicah navzdol.";
    case "elevator" -> "Vstopite v dvigalo in izberite ustrezno nadstropje.";
    case "right" -> "Zavijte desno.";
    case "left" -> "Zavijte levo.";
    case "slight_right" -> "Rahlo zavijte desno.";
    case "slight_left" -> "Rahlo zavijte levo.";
    case "destination" -> "Cilj je pred vami.";
    default -> chunk.zoneId() != null
        ? "Nadaljujte po hodniku do konca."
        : "Nadaljujte naravnost.";
  };
}
```

- [ ] **Step 4: Replace one-edge-per-step generation in `NavigationRouteService`**

```java
List<RouteStepDto> steps =
    instructionGeneratorService.generateSteps(
        draft.nodes,
        draft.edges,
        draft.floor.getId());
```

```java
return RouteStepDto.builder()
    .index(index)
    .text(text)
    .fromNodeId(fromNodeId)
    .toNodeId(toNodeId)
    .type(edgeType)
    .icon(icon)
    .maneuverType(maneuverType)
    .zoneId(zoneId)
    .build();
```

- [ ] **Step 5: Preserve same-location behavior without visible numbering**

```java
RouteStepDto.builder()
    .index(0)
    .text("Že ste na ciljni lokaciji.")
    .fromNodeId(node.getId())
    .toNodeId(node.getId())
    .type("same_location")
    .icon("destination")
    .maneuverType("destination")
    .zoneId(null)
    .build();
```

- [ ] **Step 6: Run targeted backend tests**

Run: `./mvnw -q -Dtest=NavigationRouteServiceTest,InstructionGeneratorServiceTest test`
Expected: step generation assertions pass for grouped corridors, overrides, stairs, elevator, destination, and same-location route.

- [ ] **Step 7: Commit the generator**

```bash
git add backend/src/main/java/com/navigator/backend/service/InstructionGeometryService.java backend/src/main/java/com/navigator/backend/service/InstructionZoneResolver.java backend/src/main/java/com/navigator/backend/service/InstructionGeneratorService.java backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java
git commit -m "feat: generate natural navigation instructions"
```

### Task 6: Extend The Public API And Type Contracts

**Files:**
- Modify: `backend/src/main/java/com/navigator/backend/controller/NavigationController.java`
- Modify: `frontend/src/types/navigation.ts`
- Modify: `frontend/src/services/navigationService.ts`

- [ ] **Step 1: Keep the route endpoint contract stable while returning richer steps**

```java
@GetMapping("/route")
public ResponseEntity<?> getRoute(
    @RequestParam Long fromLocationId,
    @RequestParam(required = false) Long toLocationId,
    @RequestParam(required = false) String targetType,
    @RequestParam(defaultValue = "true") boolean allowElevator) {
  // same request shape, richer RouteResponseDto payload
}
```

- [ ] **Step 2: Extend frontend route step typing**

```ts
export type RouteStep = {
  index: number;
  text: string;
  fromNodeId: number;
  toNodeId: number;
  type: string;
  icon: string;
  maneuverType: string;
  zoneId: number | null;
};
```

- [ ] **Step 3: Keep `fetchRoute` unchanged at the request layer**

```ts
return apiFetch<NavigationRoute>(`/api/navigation/route?${params}`);
```

- [ ] **Step 4: Run the frontend typecheck**

Run: `npm.cmd --prefix frontend run build`
Expected: TypeScript now only fails in components still reading `step.type` as the display source.

- [ ] **Step 5: Commit the API/type update**

```bash
git add backend/src/main/java/com/navigator/backend/controller/NavigationController.java frontend/src/types/navigation.ts frontend/src/services/navigationService.ts
git commit -m "feat: expose instruction icon metadata"
```

### Task 7: Upgrade The User-Facing Navigation UI

**Files:**
- Modify: `frontend/src/features/navigation/StepList.tsx`
- Modify: `frontend/src/features/navigation/NavigationView.module.css`

- [ ] **Step 1: Replace visible step numbers with icon rendering**

```tsx
const iconByManeuver: Record<string, string> = {
  straight: '↑',
  slight_left: '↖',
  left: '←',
  slight_right: '↗',
  right: '→',
  turn_back: '↺',
  stairs_up: '⇡',
  stairs_down: '⇣',
  elevator: '🛗',
  elevator_exit: '⇢',
  enter: '↪',
  destination: '●',
  building_transfer: '⇄',
};
```

```tsx
<span className={styles.stepIcon} aria-hidden="true">
  {iconByManeuver[step.icon] ?? iconByManeuver[step.maneuverType] ?? '↑'}
</span>
<span className={styles.stepText}>{step.text}</span>
```

- [ ] **Step 2: Remove `stepNumber` layout and add icon-first styling**

```css
.stepButton {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 10px;
}

.stepIcon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #111827;
  font-size: 20px;
  font-weight: 900;
}
```

- [ ] **Step 3: Delete the number badge from CSS and markup**

```css
/* remove .stepNumber entirely */
```

- [ ] **Step 4: Verify the route list still supports active step selection**

Run: `npm.cmd --prefix frontend run build`
Expected: the app builds and `StepList` no longer references `styles.stepNumber`.

- [ ] **Step 5: Commit the UI change**

```bash
git add frontend/src/features/navigation/StepList.tsx frontend/src/features/navigation/NavigationView.module.css
git commit -m "feat: show navigation step icons instead of numbers"
```

### Task 8: Upgrade The Admin Backend For Overrides And Zones

**Files:**
- Modify: `backend/src/main/java/com/navigator/backend/admin/dto/MapEditorDto.java`
- Modify: `backend/src/main/java/com/navigator/backend/admin/model/AdminNavNode.java`
- Modify: `backend/src/main/java/com/navigator/backend/admin/model/AdminNavEdge.java`
- Modify: `backend/src/main/java/com/navigator/backend/admin/service/MapEditorService.java`
- Modify: `backend/src/main/java/com/navigator/backend/admin/service/AdminSqlExportService.java`

- [ ] **Step 1: Extend admin DTOs to carry the new semantic fields**

```java
public record NodeDto(
    Long id,
    Long floorId,
    String externalId,
    String label,
    String nodeTypeCode,
    Long nodeTypeId,
    Long spaceId,
    boolean isWaypoint,
    boolean isPublic,
    double x,
    double y,
    double z,
    String decisionType,
    Long instructionZoneId,
    boolean hasCrossFloorConnections) {}
```

```java
public record EdgeDto(
    Long id,
    Long fromNodeId,
    Long toNodeId,
    String edgeTypeCode,
    Long edgeTypeId,
    double weight,
    boolean isBidirectional,
    boolean isCrossFloor,
    boolean isCrossBuilding,
    String instructionForward,
    String instructionBackward,
    String landmark,
    String pathRole,
    String instructionIcon,
    Long fromFloorId,
    Long toFloorId,
    String fromNodeLabel,
    String toNodeLabel,
    String fromNodeExternalId,
    String toNodeExternalId) {}
```

- [ ] **Step 2: Persist semantic fields in `MapEditorService`**

```java
node.setDecisionType(cleanCode(request.decisionType(), "none"));
node.setInstructionZoneId(request.instructionZoneId());

edge.setPathRole(cleanCode(request.pathRole(), "normal"));
edge.setInstructionIcon(cleanCode(request.instructionIcon(), null));
```

- [ ] **Step 3: Extend SQL export to round-trip new semantics**

```java
sql.append("    instruction_forward, instruction_backward, landmark, path_role, instruction_icon\n");
```

```java
sql.append("    decision_type, instruction_zone_id\n");
```

- [ ] **Step 4: Add minimal validation**

```java
if ("stairs".equals(edge.getEdgeTypeCode()) && !"change_floor".equals(edge.getPathRole())) {
  throw new MapEditorException(HttpStatus.BAD_REQUEST, "INVALID_PATH_ROLE",
      "Stopnišče mora uporabljati path_role=change_floor.");
}
```

- [ ] **Step 5: Run backend tests for admin CRUD and export**

Run: `./mvnw -q test`
Expected: export and map editor tests compile after DTO and entity updates; any failures now point to admin frontend or missing zone endpoints.

- [ ] **Step 6: Commit the admin backend update**

```bash
git add backend/src/main/java/com/navigator/backend/admin/dto/MapEditorDto.java backend/src/main/java/com/navigator/backend/admin/model/AdminNavNode.java backend/src/main/java/com/navigator/backend/admin/model/AdminNavEdge.java backend/src/main/java/com/navigator/backend/admin/service/MapEditorService.java backend/src/main/java/com/navigator/backend/admin/service/AdminSqlExportService.java
git commit -m "feat: support instruction semantics in admin backend"
```

### Task 9: Upgrade The Admin UI For Semantics And Overrides

**Files:**
- Modify: `frontend/admin/src/AdminApp.tsx`

- [ ] **Step 1: Extend admin state types with the new fields**

```ts
type EditorNode = {
  id: number;
  floorId: number;
  externalId: string;
  label: string | null;
  nodeTypeCode: string;
  nodeTypeId: number;
  spaceId: number | null;
  isWaypoint: boolean;
  isPublic: boolean;
  x: number;
  y: number;
  z: number;
  decisionType: string;
  instructionZoneId: number | null;
  hasCrossFloorConnections: boolean;
};
```

```ts
type EditorEdge = {
  id: number;
  fromNodeId: number;
  toNodeId: number;
  edgeTypeCode: string;
  edgeTypeId: number;
  weight: number;
  isBidirectional: boolean;
  isCrossFloor: boolean;
  isCrossBuilding: boolean;
  instructionForward: string | null;
  instructionBackward: string | null;
  landmark: string | null;
  pathRole: string;
  instructionIcon: string | null;
  fromFloorId: number;
  toFloorId: number;
  fromNodeLabel: string | null;
  toNodeLabel: string | null;
  fromNodeExternalId: string;
  toNodeExternalId: string;
};
```

- [ ] **Step 2: Add decision type and zone inputs to the node form**

```tsx
<label>
  Decision type
  <select
    value={form.decisionType}
    onChange={(event) => onChange({ ...form, decisionType: event.target.value })}
  >
    <option value="none">None</option>
    <option value="waypoint">Waypoint</option>
    <option value="turn">Turn</option>
    <option value="junction">Junction</option>
    <option value="door">Door</option>
    <option value="stairs_entry">Stairs entry</option>
    <option value="stairs_exit">Stairs exit</option>
    <option value="elevator_entry">Elevator entry</option>
    <option value="elevator_exit">Elevator exit</option>
    <option value="dead_end">Dead end</option>
  </select>
</label>
```

- [ ] **Step 3: Add path role and icon override inputs to the edge form**

```tsx
<label>
  Path role
  <select
    value={form.pathRole}
    onChange={(event) => onChange({ ...form, pathRole: event.target.value })}
  >
    <option value="normal">Normal</option>
    <option value="enter_room">Enter room</option>
    <option value="exit_room">Exit room</option>
    <option value="change_floor">Change floor</option>
    <option value="approach_landmark">Approach landmark</option>
    <option value="pass_landmark">Pass landmark</option>
    <option value="building_transfer">Building transfer</option>
  </select>
</label>

<label>
  Instruction icon override
  <select
    value={form.instructionIcon}
    onChange={(event) => onChange({ ...form, instructionIcon: event.target.value })}
  >
    <option value="">Auto</option>
    <option value="straight">Straight</option>
    <option value="left">Left</option>
    <option value="right">Right</option>
    <option value="stairs_up">Stairs up</option>
    <option value="stairs_down">Stairs down</option>
    <option value="elevator">Elevator</option>
    <option value="destination">Destination</option>
  </select>
</label>
```

- [ ] **Step 4: Add a minimal zone management panel before building a full editor**

```tsx
<section>
  <h3>Instruction zones</h3>
  <p>Phase 1 allows selecting an existing zone and assigning nodes to it; full polygon editing is out of scope.</p>
</section>
```

- [ ] **Step 5: Run the admin build**

Run: `npm.cmd --prefix frontend/admin run build`
Expected: the admin app builds and no longer assumes edge overrides are text-only.

- [ ] **Step 6: Commit the admin UI update**

```bash
git add frontend/admin/src/AdminApp.tsx
git commit -m "feat: expose instruction semantics in admin UI"
```

### Task 10: Add Tests For Grouping, Overrides, And Rich Step Payloads

**Files:**
- Create: `backend/src/test/java/com/navigator/backend/service/InstructionGeneratorServiceTest.java`
- Modify: `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`
- Modify: `backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java`

- [ ] **Step 1: Add unit tests for turn classification and grouping**

```java
@Test
void groupsWaypointCorridorEdgesIntoSingleStraightInstruction() {
  List<RouteStepDto> steps = instructionGeneratorService.generateSteps(nodes, edges, floorId);
  assertEquals(1, steps.size());
  assertEquals("straight", steps.get(0).getManeuverType());
}
```

- [ ] **Step 2: Add unit tests for admin override precedence**

```java
@Test
void usesEdgeInstructionOverrideBeforeGeneratedText() {
  assertEquals("Pri stopnišču zavijte desno.", steps.get(0).getText());
  assertEquals("right", steps.get(0).getIcon());
}
```

- [ ] **Step 3: Update route service tests to assert icon-rich steps**

```java
assertEquals("destination", result.getSegments().get(0).getSteps().get(0).getIcon());
assertEquals("destination", result.getSegments().get(0).getSteps().get(0).getManeuverType());
```

- [ ] **Step 4: Add controller tests for the richer response shape**

```java
mockMvc.perform(get("/api/navigation/route")
        .param("fromLocationId", "1")
        .param("toLocationId", "2"))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.segments[0].steps[0].icon").exists())
    .andExpect(jsonPath("$.segments[0].steps[0].maneuverType").exists());
```

- [ ] **Step 5: Run the focused test suite**

Run: `./mvnw -q -Dtest=InstructionGeneratorServiceTest,NavigationRouteServiceTest,NavigationControllerTest test`
Expected: all new instruction tests pass.

- [ ] **Step 6: Commit the tests**

```bash
git add backend/src/test/java/com/navigator/backend/service/InstructionGeneratorServiceTest.java backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java
git commit -m "test: cover navigation instruction generation"
```

### Task 11: Validate End-To-End On Real G2 Routes And Export The Snapshot

**Files:**
- Modify: `database/init/006_admin_navigation_graph.sql`

- [ ] **Step 1: Mark at least one long corridor and one critical junction in the admin data**

```sql
-- corridor zone
('G2', '2_nadstropje', 'G2_2_hodnik_b', 'Hodnik pri laboratorijih', 'corridor', 'to_end_of_corridor', 'Laboratoriji', 'straight', NULL, NULL)

-- critical edge override
instruction_forward = 'Pri koncu hodnika zavijte desno proti učilnici.'
instruction_icon = 'right'
```

- [ ] **Step 2: Run the application stack and verify the route visually**

Run: `docker compose up -d --build`
Expected: backend and frontend start with updated schema and route payloads.

- [ ] **Step 3: Test concrete routes in the app**

Run:
- `Glavni vhod -> G2 P3 Gama`
- `Glavni vhod -> Farad Lab`
- `Glavni vhod -> najbližji WC`

Expected:
- long corridors collapse into one natural step,
- stairs/elevator use action icons,
- destination step no longer shows a number,
- weaker graph areas still produce understandable fallback text.

- [ ] **Step 4: Export the updated admin SQL snapshot**

Run: use the admin export flow and replace `database/init/006_admin_navigation_graph.sql` with the generated snapshot after verification.
Expected: exported SQL includes `decision_type`, `instruction_zone_id`, `path_role`, `instruction_icon`, and zone rows.

- [ ] **Step 5: Commit the validated snapshot**

```bash
git add database/init/006_admin_navigation_graph.sql
git commit -m "data: validate instruction semantics on existing graph"
```

### Task 12: Final Verification And Delivery

**Files:**
- Modify: `docs/navigation-instruction-upgrade-design.md`
- Modify: `docs/superpowers/plans/2026-05-28-navigation-instruction-upgrade.md`

- [ ] **Step 1: Run the full verification set**

Run:
- `./mvnw -q test`
- `npm.cmd --prefix frontend run build`
- `npm.cmd --prefix frontend/admin run build`

Expected:
- backend tests pass,
- frontend and admin builds pass,
- no compile errors remain from the new route step shape.

- [ ] **Step 2: Update the design doc with implementation notes discovered during execution**

```md
## Implementation Notes
- Zone editing shipped as assign-existing-zone in v1; freeform zone drawing remains future work.
- Public API request shape remained stable; only route step payload became richer.
```

- [ ] **Step 3: Commit the final verification pass**

```bash
git add docs/navigation-instruction-upgrade-design.md docs/superpowers/plans/2026-05-28-navigation-instruction-upgrade.md
git commit -m "docs: finalize navigation instruction rollout plan"
```

## Self-Review

- **Spec coverage:** This plan covers schema, seeds, JPA, generator services, route response changes, user UI changes, admin CRUD/editor changes, tests, and real-graph validation.
- **Placeholder scan:** No `TODO`, `TBD`, or “implement later” markers remain in the task steps.
- **Type consistency:** Route steps consistently use `icon`, `maneuverType`, and optional `zoneId`; admin semantics consistently use `decisionType`, `instructionZoneId`, `pathRole`, and `instructionIcon`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-28-navigation-instruction-upgrade.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
