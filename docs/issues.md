# Repository issues — consolidated

This file lists issues found during automated code review (backend first, then frontend).

## Backend

- A* algorithm: priority queue lacks decrease-key handling — can return suboptimal or no path. See `backend/src/main/java/com/navigator/backend/service/AStarService.java`.
- Null-pointer risks for `externalId` / `label` when calling string methods (e.g., `replace`, `toLowerCase`). Affects `NavigationRouteService` and `AStarService`.
- Inconsistent error responses between `/api/navigation/route` and legacy `/api/navigation/path` (different DTOs / schemas).
- Overly permissive CORS: `@CrossOrigin(origins = "*")` in controllers — security risk in production.
- NPEs when DTO builders assume nested objects (e.g., `floor.getBuilding()` or BigDecimal fields) are non-null in `NavigationRouteService.buildSegment`.
- Geometry SRID / precision mismatch: `PrecisionModel` and SRID `0` used in code and native queries; may not match PostGIS SRID causing incorrect distances or queries (`NavNodeRepository`, `NavGraphService`).
- Destructive import: `NavGraphService.importFloorGraph` deletes nodes/edges for a floor before inserting — no extra safeguards or validation; accidental calls can corrupt data.
- Runtime exceptions for unknown types: `resolveEdgeType` / `resolveNodeType` throw `IllegalArgumentException` on unknown codes; imports should validate and return friendly errors.
- Docker/runtime risk: `backend/Dockerfile` uses Alpine images while `hibernate-spatial` and geospatial libs may need extra native packages; image may fail at runtime.
- Maven dependency/version risk: `hibernate-spatial` included without explicit JTS/PostGIS matching versions — verify compatibility.
- Search query performance: `LIKE '%query%'` in `NavigationLocationRepository.searchEnabled` can cause full table scans; consider trigram/fulltext or indexed searchable column.
- Directional-edge assumption: services assume edges exist in both directions (import duplicates edges). If import misses, routing may fail.

## Frontend

- Hard-coded API fallback: `API_BASE_URL` falls back to `http://localhost:8080` — fails in containerized or remote deployments; require `VITE_API_BASE_URL` configuration (`frontend/src/pages/NavigacijaPage.tsx`).
- SVG rendering risk: `viewBox` uses backend `coordinateWidth`/`coordinateHeight` without validation — zero/NaN can prevent polyline rendering (`frontend/src/pages/NavigacijaPage.tsx`).
- Unsafe assumptions about DTOs: UI expects `segment.mapImageUrl`, `segment.path`, and numeric `x,y` — malformed backend responses can crash renders.
- Accessibility: clickable `article` elements (e.g., in `MainPage`) lack keyboard handlers/roles; improve semantics and keyboard support (`frontend/src/pages/MainPage.tsx`).
- Large inline style objects repeated across components — hard to maintain; consider centralizing styles or CSS-in-JS components (`frontend/src/styles/sharedStyles.ts` and pages).
- Client-side filtering inefficiency: demo filtering runs in-memory; for real datasets, use backend search API instead of full client lists (`MainPage`, `ObjektiPage`).
- Error handling UX: API error parsing in `handleRoute` may throw when backend returns non-JSON; normalize API error format or add defensive parsing (`frontend/src/pages/NavigacijaPage.tsx`).
- Dev dependency risk: packages in `frontend/package.json` (React 19, TypeScript 6) require verifying tooling support (ESLint plugins, Vite plugins compatibility).
- No debounce on search queries: `useLocationSearch` triggers a fetch on every keystroke, causing excessive requests; add debounce/throttle.
- Absolute-positioned results box may overflow/clash in some layouts; ensure proper container anchoring and boundary checks (`frontend/src/pages/NavigacijaPage.tsx`).

## Additional findings (deep scan)

- Unsafe `Optional.get()` usage in admin code can throw `NoSuchElementException` if not present. See `backend/src/main/java/com/navigator/backend/admin/service/MapEditorService.java` where `findByExternalId(...).get()` / `Optional` usages occur.
- `PrecisionModel` and SRID `0` usage appears in multiple places (`MapEditorService`, `NavGraphService`) — ensure SRID matches PostGIS database SRID (likely 4326 or a project-specific SRID) to avoid coordinate mismatches.
- Frontend uses `.toLowerCase()` on fields assumed present (e.g., `space.name`, `space.type`, `space.floor` in `frontend/src/pages/MainPage.tsx`) — add guards if data can be missing.
- Multiple `.doubleValue()` calls on `BigDecimal` without null checks (floor coordinates, node x/y/z) — defensive null handling recommended.


## Recommendations / next steps

- Prioritize fixing the A* decrease-key issue and add unit tests to cover pathfinding (high).
- Add defensive null checks and validation for DTO fields both in backend and frontend (medium).
- Harden import endpoints with validation, confirmation, and safer transactional/backup flow (medium).
- Improve frontend resilience: debounce search, validate route DTOs before render, and make API base URL mandatory in production builds (low-medium).
- Replace permissive CORS with environment-based configuration and restrict origins in production (security patch).

---
Generated on 2026-05-24.
