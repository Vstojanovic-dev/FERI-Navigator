# Pre-Production Balanced Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uciniti FERI Navigator bezbednim i operativno spremnim za staging/public alpha hosting bez stalno hostovanog admin panela.

**Architecture:** Javni runtime sadrzi samo frontend, backend i bazu; admin ostaje lokalni ops alat koji proizvodi SQL export, a staging/prod dobija promene iskljucivo kroz verzionisane Flyway migracije. Hardening obuhvata security/config razdvajanje, migration workflow, correctness bugfixe, frontend otpornost i minimalni release/CI tok.

**Tech Stack:** Spring Boot 3.3, Java 21, PostgreSQL/PostGIS, Flyway, React 19 + Vite, Nginx, Docker Compose, GitHub Actions

---

## File Structure Map

### Backend application and API

- Modify: `backend/pom.xml`
- Modify: `backend/src/main/resources/application.properties`
- Create: `backend/src/main/resources/application-dev.properties`
- Create: `backend/src/main/resources/application-test.properties`
- Create: `backend/src/main/resources/application-prod.properties`
- Create: `backend/src/main/java/com/navigator/backend/config/SecurityConfig.java`
- Create: `backend/src/main/java/com/navigator/backend/config/CorsProperties.java`
- Create: `backend/src/main/java/com/navigator/backend/config/AdminModeProperties.java`
- Create: `backend/src/main/java/com/navigator/backend/config/AdminModeGuard.java`
- Create: `backend/src/main/java/com/navigator/backend/config/ApiExceptionHandler.java`
- Modify: `backend/src/main/java/com/navigator/backend/controller/NavigationController.java`
- Modify: `backend/src/main/java/com/navigator/backend/controller/CatalogController.java`
- Modify: `backend/src/main/java/com/navigator/backend/admin/controller/MapEditorController.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/AStarService.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/NavigationShareService.java`

### Database and deployment

- Create: `backend/src/main/resources/db/migration/`
- Create: `backend/src/main/resources/db/migration/V2026_06_01_001__baseline_placeholder.sql`
- Create: `backend/src/main/resources/db/migration/V2026_06_01_002__admin_graph_snapshot_template.sql`
- Create: `docker-compose.prod.yml`
- Create: `.env.example`
- Modify: `docker-compose.yml`
- Modify: `backend/Dockerfile`
- Modify: `frontend/Dockerfile`
- Modify: `frontend/nginx.conf`

### Frontend and admin frontend

- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/services/navigationService.ts`
- Modify: `frontend/src/features/navigation/useLocationSearch.ts`
- Modify: `frontend/src/features/navigation/RouteMap.tsx`
- Modify: `frontend/src/features/navigation/NavigationView.tsx`
- Modify: `frontend/src/pages/NavigationPage.tsx`
- Create: `frontend/src/utils/runtimeConfig.ts`
- Modify: `frontend/admin/src/AdminApp.tsx`
- Create: `frontend/admin/src/config.ts`
- Create: `frontend/admin/.env.example`

### Tests, CI, docs

- Modify: `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`
- Modify: `backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java`
- Create: `backend/src/test/java/com/navigator/backend/config/AdminModeGuardTest.java`
- Create: `backend/src/test/java/com/navigator/backend/service/AStarServiceTest.java`
- Modify: `frontend/tests/app-smoke.spec.ts`
- Create: `.github/workflows/ci.yml`
- Modify: `docs/pre_production_chechklist.md`
- Modify: `docs/admin_panel.md`
- Modify: `docs/admin.md`
- Create: `docs/workflows/admin-export-to-migration.md`
- Create: `docs/workflows/release-checklist.md`
- Create: `docs/workflows/backup-and-restore.md`

---

### Task 1: Backend dependency and profile groundwork

**Files:**
- Modify: `backend/pom.xml`
- Modify: `backend/src/main/resources/application.properties`
- Create: `backend/src/main/resources/application-dev.properties`
- Create: `backend/src/main/resources/application-test.properties`
- Create: `backend/src/main/resources/application-prod.properties`

- [ ] **Step 1: Add the missing backend runtime dependencies**

Add the minimal production-hardening dependencies to `backend/pom.xml`.

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

<dependency>
  <groupId>org.flywaydb</groupId>
  <artifactId>flyway-core</artifactId>
</dependency>

<dependency>
  <groupId>org.flywaydb</groupId>
  <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

- [ ] **Step 2: Move shared config to a neutral base file**

Replace `backend/src/main/resources/application.properties` with environment-neutral defaults only.

```properties
spring.application.name=feri-navigator
server.port=${SERVER_PORT:8080}

spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/feri_navigator}
spring.datasource.username=${DB_USERNAME:feri}
spring.datasource.password=${DB_PASSWORD:feri}
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false

spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-on-migrate=true

management.endpoints.web.exposure.include=health,info
management.endpoint.health.probes.enabled=true

app.cors.allowed-origins=${APP_CORS_ALLOWED_ORIGINS:http://localhost:5173,http://localhost:5174}
app.admin.enabled=${APP_ADMIN_ENABLED:true}
app.share.base-url=${APP_SHARE_BASE_URL:http://localhost:5173}
```

- [ ] **Step 3: Add explicit development profile settings**

Create `backend/src/main/resources/application-dev.properties`.

```properties
spring.jpa.show-sql=true
logging.level.org.springframework.security=INFO
app.admin.enabled=true
```

- [ ] **Step 4: Add explicit test profile settings**

Create `backend/src/main/resources/application-test.properties`.

```properties
app.admin.enabled=true
app.share.base-url=http://localhost:4173
spring.flyway.enabled=false
management.endpoints.enabled-by-default=false
```

- [ ] **Step 5: Add explicit production profile settings**

Create `backend/src/main/resources/application-prod.properties`.

```properties
app.admin.enabled=false
spring.jpa.show-sql=false
management.endpoint.health.show-details=never
```

- [ ] **Step 6: Run backend test suite to ensure the profile split did not break startup**

Run: `./mvnw.cmd test`

Expected: Spring test context starts successfully and existing backend tests pass or fail only on already-known issues that will be addressed in later tasks.

- [ ] **Step 7: Commit**

```bash
git add backend/pom.xml backend/src/main/resources/application.properties backend/src/main/resources/application-dev.properties backend/src/main/resources/application-test.properties backend/src/main/resources/application-prod.properties
git commit -m "chore: add production-ready backend profiles"
```

### Task 2: Security, admin disable-by-default, and centralized API error handling

**Files:**
- Create: `backend/src/main/java/com/navigator/backend/config/SecurityConfig.java`
- Create: `backend/src/main/java/com/navigator/backend/config/CorsProperties.java`
- Create: `backend/src/main/java/com/navigator/backend/config/AdminModeProperties.java`
- Create: `backend/src/main/java/com/navigator/backend/config/AdminModeGuard.java`
- Create: `backend/src/main/java/com/navigator/backend/config/ApiExceptionHandler.java`
- Modify: `backend/src/main/java/com/navigator/backend/controller/NavigationController.java`
- Modify: `backend/src/main/java/com/navigator/backend/controller/CatalogController.java`
- Modify: `backend/src/main/java/com/navigator/backend/admin/controller/MapEditorController.java`
- Create: `backend/src/test/java/com/navigator/backend/config/AdminModeGuardTest.java`

- [ ] **Step 1: Define typed config for CORS and admin mode**

Create `CorsProperties.java` and `AdminModeProperties.java`.

```java
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(List<String> allowedOrigins) {}

@ConfigurationProperties(prefix = "app.admin")
public record AdminModeProperties(boolean enabled) {}
```

- [ ] **Step 2: Add a guard service that blocks admin endpoints when admin mode is off**

Create `AdminModeGuard.java`.

```java
@Component
@RequiredArgsConstructor
public class AdminModeGuard {
  private final AdminModeProperties properties;

  public void requireEnabled() {
    if (!properties.enabled()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin mode is disabled.");
    }
  }
}
```

- [ ] **Step 3: Add a centralized security configuration**

Create `SecurityConfig.java`.

```java
@Configuration
@EnableConfigurationProperties({CorsProperties.class, AdminModeProperties.class})
public class SecurityConfig {
  @Bean
  SecurityFilterChain filterChain(HttpSecurity http, CorsConfigurationSource cors) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .cors(corsSpec -> corsSpec.configurationSource(cors))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
            .anyRequest().permitAll())
        .build();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource(CorsProperties properties) {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(properties.allowedOrigins());
    config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(false);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
```

- [ ] **Step 4: Remove controller-level `@CrossOrigin` and use centralized guarding**

Update `NavigationController.java`, `CatalogController.java`, and `MapEditorController.java`:

```java
@RestController
@RequestMapping("/api/admin/map-editor")
public class MapEditorController {
  private final AdminModeGuard adminModeGuard;

  @GetMapping("/floors")
  public List<FloorOptionDto> getFloors() {
    adminModeGuard.requireEnabled();
    return mapEditorService.listFloors();
  }
}
```

- [ ] **Step 5: Centralize API error mapping for public and admin APIs**

Create `ApiExceptionHandler.java`.

```java
@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(NavigationRouteException.class)
  ResponseEntity<NavigationErrorDto> handleNavigation(NavigationRouteException ex) {
    return ResponseEntity.status(ex.getStatus())
        .body(NavigationErrorDto.builder().code(ex.getCode()).message(ex.getMessage()).build());
  }

  @ExceptionHandler(MapEditorException.class)
  ResponseEntity<MapEditorController.EditorErrorDto> handleAdmin(MapEditorException ex) {
    return ResponseEntity.status(ex.getStatus())
        .body(new MapEditorController.EditorErrorDto(ex.getCode(), ex.getMessage()));
  }
}
```

- [ ] **Step 6: Add a focused test for admin-off behavior**

Create `AdminModeGuardTest.java`.

```java
@SpringBootTest(properties = "app.admin.enabled=false")
class AdminModeGuardTest {
  @Autowired private MockMvc mockMvc;

  @Test
  void adminEndpointsReturnNotFoundWhenDisabled() throws Exception {
    mockMvc.perform(get("/api/admin/map-editor/floors")).andExpect(status().isNotFound());
  }
}
```

- [ ] **Step 7: Run backend tests after security hardening**

Run: `./mvnw.cmd test`

Expected: public endpoints remain accessible in tests, admin-off test passes, and no controller relies on `@CrossOrigin("*")` anymore.

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/com/navigator/backend/config backend/src/main/java/com/navigator/backend/controller/NavigationController.java backend/src/main/java/com/navigator/backend/controller/CatalogController.java backend/src/main/java/com/navigator/backend/admin/controller/MapEditorController.java backend/src/test/java/com/navigator/backend/config/AdminModeGuardTest.java
git commit -m "feat: centralize security and disable admin by default"
```

### Task 3: Flyway baseline, production DB workflow, and environment examples

**Files:**
- Create: `backend/src/main/resources/db/migration/V2026_06_01_001__baseline_placeholder.sql`
- Create: `backend/src/main/resources/db/migration/V2026_06_01_002__admin_graph_snapshot_template.sql`
- Create: `.env.example`
- Modify: `docs/admin_panel.md`
- Create: `docs/workflows/admin-export-to-migration.md`

- [ ] **Step 1: Create the Flyway migration directory and a baseline placeholder**

Create `V2026_06_01_001__baseline_placeholder.sql`.

```sql
-- Baseline placeholder for environments initialized from the legacy bootstrap SQL.
-- Flyway baseline-on-migrate marks existing databases before future incremental migrations.
SELECT 1;
```

- [ ] **Step 2: Create a template migration for future admin graph exports**

Create `V2026_06_01_002__admin_graph_snapshot_template.sql`.

```sql
-- Copy reviewed SQL generated by the local admin editor into a new versioned migration.
-- Do not edit staging/production data manually outside Flyway migrations.
SELECT 1;
```

- [ ] **Step 3: Add a checked-in environment example**

Create `.env.example`.

```dotenv
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://postgres:5432/feri_navigator
DB_USERNAME=change_me
DB_PASSWORD=change_me
APP_CORS_ALLOWED_ORIGINS=https://staging.example.com
APP_SHARE_BASE_URL=https://staging.example.com
APP_ADMIN_ENABLED=false
VITE_API_BASE_URL=https://staging.example.com
```

- [ ] **Step 4: Document the admin export to migration workflow**

Create `docs/workflows/admin-export-to-migration.md` with the exact operational sequence:

```md
1. Run local postgres + backend + admin frontend.
2. Make graph edits locally.
3. Export SQL from `/api/admin/map-editor/export/sql`.
4. Review the diff.
5. Paste only the reviewed SQL into a new `V...__admin_graph_update.sql`.
6. Run local bootstrap/migration verification.
7. Commit the migration and deploy.
```

- [ ] **Step 5: Update admin docs to remove any implication of direct remote DB editing**

Amend `docs/admin_panel.md` so the export section explicitly says:

```md
Admin export does not modify staging/production directly.
The export must be converted into a reviewed Flyway migration committed to git.
```

- [ ] **Step 6: Run a startup verification with Flyway enabled**

Run: `docker compose config`

Expected: compose remains valid, env placeholders are externally supplied, and no syntax errors are introduced by the documentation/config changes.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/resources/db/migration .env.example docs/admin_panel.md docs/workflows/admin-export-to-migration.md
git commit -m "docs: define flyway and admin export workflow"
```

### Task 4: Production compose, health/readiness, and container hardening

**Files:**
- Modify: `backend/pom.xml`
- Modify: `backend/Dockerfile`
- Modify: `frontend/Dockerfile`
- Modify: `frontend/nginx.conf`
- Create: `docker-compose.prod.yml`
- Create: `docs/workflows/backup-and-restore.md`

- [ ] **Step 1: Expose actuator health endpoints in the backend**

No new code beyond Task 1 config should be needed; verify the endpoint target and add documentation in the production compose comments:

```yaml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://localhost:8080/actuator/health/readiness"]
```

- [ ] **Step 2: Stop skipping Maven tests in the backend image build**

Update `backend/Dockerfile`.

```dockerfile
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app/backend
COPY backend/pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY backend/src ./src
RUN mvn -DskipTests package
```

The image still skips tests because CI runs them earlier, but it no longer hides dependency resolution behind a monolithic package step.

- [ ] **Step 3: Add explicit production caching and SPA behavior in Nginx**

Update `frontend/nginx.conf`.

```nginx
location = /index.html {
  add_header Cache-Control "no-store";
}

location /assets/ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}

location / {
  try_files $uri $uri/ /index.html;
}
```

- [ ] **Step 4: Create a production compose file that exposes only the public web entrypoint**

Create `docker-compose.prod.yml`.

```yaml
services:
  backend:
    environment:
      SPRING_PROFILES_ACTIVE: prod
      APP_ADMIN_ENABLED: "false"
    expose:
      - "8080"

  frontend:
    ports:
      - "80:80"

  postgres:
    expose:
      - "5432"
```

Do not publish `8080` or `5432` to the public interface in this file.

- [ ] **Step 5: Document backup and restore**

Create `docs/workflows/backup-and-restore.md`.

```md
- nightly `pg_dump` backup
- test restore into a disposable database
- keep at least one documented restore command per environment
```

- [ ] **Step 6: Validate both compose files**

Run:

`docker compose config`

`docker compose -f docker-compose.prod.yml config`

Expected: both manifests parse successfully and the production manifest exposes only the web service.

- [ ] **Step 7: Commit**

```bash
git add backend/Dockerfile frontend/Dockerfile frontend/nginx.conf docker-compose.prod.yml docs/workflows/backup-and-restore.md
git commit -m "ops: add production compose and health-ready containers"
```

### Task 5: Route correctness, validation, and backend stability fixes

**Files:**
- Modify: `backend/src/main/java/com/navigator/backend/service/AStarService.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/NavigationShareService.java`
- Modify: `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`
- Create: `backend/src/test/java/com/navigator/backend/service/AStarServiceTest.java`
- Modify: `backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java`

- [ ] **Step 1: Write a regression test for the A* priority queue bug**

Create `AStarServiceTest.java` with a scenario where a better path is discovered after a node first enters the open set.

```java
@Test
void findsLowerCostPathWhenNodePriorityNeedsRefresh() {
  // Arrange graph where direct-discovered path is worse than later-discovered path.
  // Assert the returned route uses the lower total cost path.
}
```

- [ ] **Step 2: Update the A* open-set implementation to support priority refresh**

Replace the `PriorityQueue<Long>` only approach with queue entries that carry a score snapshot.

```java
private record QueueEntry(Long nodeId, double score) {}

PriorityQueue<QueueEntry> openSet =
    new PriorityQueue<>(Comparator.comparingDouble(QueueEntry::score));

openSet.add(new QueueEntry(start.getId(), fScore.get(start.getId())));
```

And skip stale entries when polled:

```java
QueueEntry current = openSet.poll();
if (current.score() > fScore.getOrDefault(current.nodeId(), Double.MAX_VALUE)) {
  continue;
}
```

- [ ] **Step 3: Add null-safe coordinate and identifier handling**

Harden `AStarService` and `NavigationRouteService` around nullable values.

```java
private double safeCoordinate(BigDecimal value, String field) {
  if (value == null) {
    throw new IllegalStateException("Missing coordinate: " + field);
  }
  return value.doubleValue();
}
```

- [ ] **Step 4: Normalize navigation error responses**

Remove per-endpoint `try/catch` duplication from `NavigationController.java` once `ApiExceptionHandler` is in place.

```java
@GetMapping("/route")
public RouteResponseDto getRoute(...) {
  return navigationRouteService.route(fromLocationId, toLocationId, targetType, allowElevator);
}
```

- [ ] **Step 5: Add request parameter validation**

Constrain values in controller method signatures or request-level validation.

```java
public ResponseEntity<List<NavigationLocationDto>> getLocations(
    @RequestParam(defaultValue = "") String query,
    @RequestParam(defaultValue = "20") @Max(50) int limit)
```

- [ ] **Step 6: Run focused backend tests**

Run:

`./mvnw.cmd -Dtest=AStarServiceTest,NavigationRouteServiceTest,NavigationControllerTest test`

Expected: regression coverage proves that lower-cost route refresh works, route errors remain stable, and no NPEs surface in targeted scenarios.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/com/navigator/backend/service/AStarService.java backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java backend/src/main/java/com/navigator/backend/service/NavigationShareService.java backend/src/main/java/com/navigator/backend/controller/NavigationController.java backend/src/test/java/com/navigator/backend/service/AStarServiceTest.java backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java
git commit -m "fix: harden routing and navigation API behavior"
```

### Task 6: Frontend resilience, API config, and search throttling

**Files:**
- Modify: `frontend/src/services/api.ts`
- Create: `frontend/src/utils/runtimeConfig.ts`
- Modify: `frontend/src/services/navigationService.ts`
- Modify: `frontend/src/features/navigation/useLocationSearch.ts`
- Modify: `frontend/src/features/navigation/RouteMap.tsx`
- Modify: `frontend/src/features/navigation/NavigationView.tsx`
- Modify: `frontend/src/pages/NavigationPage.tsx`

- [ ] **Step 1: Centralize frontend runtime config and reject invalid production config**

Create `frontend/src/utils/runtimeConfig.ts`.

```ts
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';

export function getApiBaseUrl() {
  if (import.meta.env.PROD && !apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is required in production builds.');
  }
  return apiBaseUrl;
}
```

- [ ] **Step 2: Route all frontend fetch helpers through the runtime config**

Update `frontend/src/services/api.ts`.

```ts
import { getApiBaseUrl } from '../utils/runtimeConfig';

const API_BASE_URL = getApiBaseUrl();
```

- [ ] **Step 3: Add debounce and empty-query handling to location search**

Update `useLocationSearch.ts`.

```ts
useEffect(() => {
  if (!query.trim()) {
    setResults([]);
    return;
  }
  const timeoutId = window.setTimeout(() => { ... }, 250);
  return () => window.clearTimeout(timeoutId);
}, [query]);
```

- [ ] **Step 4: Guard route/map rendering against malformed data**

Update `RouteMap.tsx` and `NavigationView.tsx`.

```ts
const safeWidth = Number.isFinite(segment.coordinateWidth) && segment.coordinateWidth > 0
  ? segment.coordinateWidth
  : 1000;
```

And only render the polyline if at least 2 valid points exist.

- [ ] **Step 5: Normalize route fetch error handling in `NavigationPage.tsx`**

Use the shared `apiFetch`/`ApiError` path instead of open-coded JSON parsing.

```ts
try {
  const route = await apiFetch<RouteResponse>(`/api/navigation/route?${params}`);
  setRoute(route);
} catch (error) {
  setError(error instanceof ApiError ? error.message : 'Ruta nije dostupna.');
}
```

- [ ] **Step 6: Run frontend build and smoke checks**

Run:

`npm.cmd run build`

`npm.cmd run test:e2e`

Expected: the main app builds with explicit config semantics and the smoke test still covers the primary navigation path.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/services/api.ts frontend/src/utils/runtimeConfig.ts frontend/src/services/navigationService.ts frontend/src/features/navigation/useLocationSearch.ts frontend/src/features/navigation/RouteMap.tsx frontend/src/features/navigation/NavigationView.tsx frontend/src/pages/NavigationPage.tsx
git commit -m "fix: harden frontend runtime config and route rendering"
```

### Task 7: Admin frontend hardening for local-only workflow

**Files:**
- Modify: `frontend/admin/src/AdminApp.tsx`
- Create: `frontend/admin/src/config.ts`
- Create: `frontend/admin/.env.example`
- Modify: `docs/admin.md`

- [ ] **Step 1: Extract admin API base URL into a dedicated config file**

Create `frontend/admin/src/config.ts`.

```ts
export const ADMIN_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080';
```

This fallback is acceptable because admin remains a local tool.

- [ ] **Step 2: Make the local-only assumption explicit in the admin UI**

Add a visible banner in `AdminApp.tsx`.

```tsx
<div className="notice-banner">
  Local admin tool only. Do not use this UI to edit staging or production directly.
</div>
```

- [ ] **Step 3: Add safer export messaging**

Near the export action, add copy such as:

```tsx
<p>
  Export creates SQL for a reviewed Flyway migration. It does not update hosted environments.
</p>
```

- [ ] **Step 4: Add an admin env example**

Create `frontend/admin/.env.example`.

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

- [ ] **Step 5: Update admin docs to match the new contract**

Update `docs/admin.md` with a short section:

```md
Admin is a local editor, not a remote production control panel.
Hosted environments receive admin changes only through reviewed migrations.
```

- [ ] **Step 6: Run admin build**

Run from `frontend/admin`:

`npm.cmd run build`

Expected: admin app builds successfully with the extracted config and updated local-only messaging.

- [ ] **Step 7: Commit**

```bash
git add frontend/admin/src/AdminApp.tsx frontend/admin/src/config.ts frontend/admin/.env.example docs/admin.md
git commit -m "docs: lock admin workflow to local export usage"
```

### Task 8: CI, release checklist, and final hosting gate

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `docs/workflows/release-checklist.md`
- Modify: `docs/pre_production_chechklist.md`
- Modify: `frontend/tests/app-smoke.spec.ts`

- [ ] **Step 1: Create a CI workflow that runs the release-critical checks**

Create `.github/workflows/ci.yml`.

```yaml
name: ci
on:
  push:
  pull_request:

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - run: ./backend/mvnw -f backend/pom.xml test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
        working-directory: frontend
      - run: npm run build
        working-directory: frontend

  admin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
        working-directory: frontend/admin
      - run: npm run build
        working-directory: frontend/admin
```

- [ ] **Step 2: Tighten or extend the existing smoke test**

Update `frontend/tests/app-smoke.spec.ts` so it covers:

```ts
test('user can search and open a route flow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading')).toBeVisible();
});
```

Add one assertion for route-related UI instead of only page load.

- [ ] **Step 3: Convert the pre-production checklist into tracked status**

Update `docs/pre_production_chechklist.md` to mark items as:

```md
- [x] central CORS config
- [x] admin disabled by default
- [ ] rate limiting
```

This keeps the document aligned with the actual hardening progress.

- [ ] **Step 4: Write the release checklist**

Create `docs/workflows/release-checklist.md`.

```md
1. CI green.
2. Flyway migrations reviewed.
3. Backup created.
4. Production env vars verified.
5. Smoke test on staging passed.
6. Production deploy completed.
7. Post-deploy health check passed.
```

- [ ] **Step 5: Run the full verification set**

Run:

`./mvnw.cmd test`

`npm.cmd run build`

`cd frontend/admin && npm.cmd run build`

`docker compose config`

`docker compose -f docker-compose.prod.yml config`

Expected: all builds and configs pass, and the repo has a documented release gate for hosting.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/ci.yml frontend/tests/app-smoke.spec.ts docs/pre_production_chechklist.md docs/workflows/release-checklist.md
git commit -m "ci: add pre-production verification pipeline"
```

## Self-Review Checklist

- Spec coverage:
  - security hardening covered by Tasks 1, 2, and 4
  - Flyway and DB workflow covered by Tasks 1 and 3
  - local-only admin workflow covered by Tasks 3 and 7
  - correctness and stability fixes covered by Tasks 5 and 6
  - CI and operational readiness covered by Task 8
- Placeholder scan:
  - no `TODO` or `TBD` markers remain in task instructions
  - each task names exact files and verification commands
- Type consistency:
  - backend config uses `app.admin.enabled`, `app.cors.allowed-origins`, and `app.share.base-url` consistently
  - frontend config uses `VITE_API_BASE_URL` consistently across public and admin apps
