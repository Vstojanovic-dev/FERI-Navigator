# FERI Navigator Azure Production Readiness Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Bring FERI Navigator to a deployable, supportable production state on Microsoft Azure without exposing admin, data, or operational risks that are currently present in the repository.

**Architecture:** Deploy the user frontend and backend as separate containerized workloads, move Postgres/PostGIS to a managed Azure database, keep secrets in Key Vault, publish images through Azure Container Registry, and run CI/CD through GitHub Actions. Keep the admin UI isolated from the public user app and expose only the minimum public surface.

**Tech Stack:** React/Vite + Nginx frontend, Spring Boot 3 / Java 21 backend, PostgreSQL/PostGIS, Docker, GitHub Actions, Azure Container Apps or Azure App Service for Containers, Azure Database for PostgreSQL Flexible Server, Azure Key Vault, Azure Monitor / Application Insights.

---

## Assumptions

- Primary Azure target should be a container-based deployment model.
- Public production scope is the end-user navigation app.
- Admin panel should not be publicly exposed without authentication and network restriction.
- The existing `database/init/*.sql` files remain source material, but production rollout must move to repeatable migrations.

## Current State Summary

### What is already usable

- The repository has a clear split between `frontend/`, `frontend/admin/`, `backend/`, and `database/`.
- Main frontend production build succeeds locally with `npm.cmd run build` in `frontend/`.
- Local container topology already exists in `docker-compose.yml`, which is a good base for Azure containerization.

### What currently blocks production

- Backend has no production security layer. Controllers expose `@CrossOrigin(origins = "*")` and admin/write endpoints are unauthenticated.
- `docker-compose.yml` uses development secrets and exposes database/backend ports directly.
- Database lifecycle is based on first-run init scripts, not repeatable migrations.
- CI is incomplete: backend workflow skips tests, there is no release pipeline, and there is no image publishing flow.
- Admin frontend is not part of a controlled deployment strategy and its local production build currently fails with a Windows `EPERM` cleanup error in `frontend/admin/dist`.
- Backend Maven wrapper failed locally in this environment, so backend test execution is not currently dependable on Windows without fixing toolchain execution.

## Recommended Azure Target Architecture

### Recommended option

- `Azure Container Apps` for `frontend` and `backend`
- `Azure Database for PostgreSQL Flexible Server` with PostGIS enabled
- `Azure Container Registry` for image storage
- `Azure Key Vault` for secrets
- `Azure Front Door` or Container Apps ingress for HTTPS entry
- `Azure Monitor` + `Application Insights` + `Log Analytics` for monitoring

### Why this is the best fit

- The project already has container boundaries.
- Container Apps reduces ops overhead compared with AKS.
- Managed PostgreSQL is safer than self-hosting Postgres in Azure for backups, patching, HA, and restore workflows.

### Alternate option

- `Azure App Service for Containers` for frontend/backend
- Same PostgreSQL, Key Vault, ACR, and monitoring stack

This is acceptable if the team prefers App Service, but Container Apps is usually the cleaner match for this repository’s current Docker-first structure.

## Production Gaps by Area

### 1. Security and exposure

`P0`

- Protect `/api/admin/map-editor/**`, `/api/graph/import`, and `/api/graph/cross-floor` with authentication and authorization.
- Remove controller-level wildcard CORS and replace with environment-driven allowed origins.
- Stop exposing raw backend and database ports publicly.
- Remove development credentials from `docker-compose.yml` and `application.properties` defaults.
- Decide whether admin is:
  - internal-only behind VPN/private ingress, or
  - separate protected Azure app with Entra ID authentication.

### 2. Deployment topology

`P0`

- Split deployment definitions for `frontend`, `backend`, and `database`.
- Do not deploy PostgreSQL from `docker-compose.yml` to production.
- Externalize runtime configuration:
  - `VITE_API_BASE_URL`
  - DB host/user/password/name
  - allowed CORS origins
  - admin auth settings
  - logging/monitoring settings

### 3. Database change management

`P0`

- Introduce Flyway or Liquibase in the backend.
- Convert schema/data changes from one-time init scripts into ordered migrations.
- Define backup, point-in-time restore, and rollback procedures for Azure PostgreSQL.

### 4. CI/CD and release safety

`P1`

- Replace the current code-style-only workflow with a proper pipeline:
  - backend formatting
  - backend unit/integration tests
  - frontend build
  - admin build
  - Docker image build
  - image scan
  - push to ACR
  - deploy to staging
  - smoke test
- Stop using `mvn -DskipTests package` as the only backend verification path.

### 5. Runtime health and observability

`P0`

- Add Spring Boot Actuator health/readiness endpoints.
- Add structured logs with request correlation IDs.
- Configure Azure monitoring for:
  - app availability
  - backend 5xx rate
  - route endpoint latency
  - DB connectivity
  - failed deployments

### 6. Frontend and admin deployment readiness

`P1`

- Make production API configuration explicit and fail-fast if missing.
- Decide whether admin is built and deployed separately or removed from public production entirely.
- Fix `frontend/admin` build reliability and output cleanup behavior.
- Add asset caching rules and `index.html` no-cache behavior in Nginx.

### 7. Application correctness before rollout

`P1`

- Fix known backend correctness risks already documented in `docs/issues.md`, especially pathfinding and unsafe null assumptions.
- Add integration tests with real Postgres/Testcontainers for routing and admin graph operations.
- Add route graph integrity checks before deployment.

## Phased Execution Plan

### Phase 0: Architecture decision and deployment boundary

**Outcome:** one approved Azure topology and a clear answer on admin exposure.

Tasks:

- Confirm `Azure Container Apps` vs `App Service for Containers`.
- Confirm whether admin is internal-only or separately protected.
- Define environments: `dev`, `staging`, `prod`.
- Define public DNS names and TLS termination point.

Exit criteria:

- Approved target architecture diagram.
- Approved environment matrix.
- Approved admin access policy.

### Phase 1: Production hardening

**Outcome:** no obvious security blocker remains in app code/config.

Tasks:

- Add Spring Security or equivalent auth layer for admin/write endpoints.
- Remove wildcard CORS annotations from controllers and replace with central config.
- Remove dangerous default secrets and localhost production fallbacks.
- Ensure backend is only reachable through ingress/reverse proxy.

Exit criteria:

- Public app can only access intended read endpoints.
- Admin/write operations require auth.
- Secrets are loaded only from environment/Key Vault references.

### Phase 2: Database readiness

**Outcome:** production database changes are repeatable and recoverable.

Tasks:

- Add Flyway/Liquibase to backend startup.
- Baseline existing schema/data.
- Separate immutable seed/reference data from evolving migrations.
- Document backup/restore and test restore on staging.

Exit criteria:

- Fresh environment can be created from migrations.
- Existing environment can be upgraded safely.
- Restore procedure is tested and documented.

### Phase 3: CI/CD and image supply chain

**Outcome:** every release is built, tested, published, and deployable through automation.

Tasks:

- Add GitHub Actions workflow for backend tests and frontend/admin builds.
- Build versioned frontend and backend images.
- Push images to ACR.
- Add staging deployment workflow with smoke tests.
- Add production deployment workflow gated by manual approval.

Exit criteria:

- Every merge to main produces validated images.
- Staging deploy is one command or one workflow run away.
- Production deploy is auditable and repeatable.

### Phase 4: Azure infrastructure provisioning

**Outcome:** the Azure platform exists and is ready for app workloads.

Tasks:

- Provision ACR.
- Provision Container Apps environment or App Services.
- Provision PostgreSQL Flexible Server with private access rules.
- Provision Key Vault and bind secrets to workloads.
- Provision monitoring and alerting resources.

Exit criteria:

- All infra exists in staging first.
- Apps can start with managed secrets.
- DB is reachable only from intended workloads.

### Phase 5: Staging validation

**Outcome:** production-like deployment has passed smoke, security, and restore checks.

Tasks:

- Deploy frontend and backend to staging.
- Run DB migrations.
- Run smoke tests for catalog, location search, route generation, and map asset loading.
- Verify logs, metrics, alerts, and health probes.
- Run a backup and a restore exercise.

Exit criteria:

- Staging behaves like expected production.
- Backup/restore is proven.
- No P0 or unresolved P1 issue remains.

### Phase 6: Production rollout

**Outcome:** safe first production release with rollback path.

Tasks:

- Freeze schema changes for the release window.
- Create pre-deploy backup.
- Deploy backend first, then frontend.
- Run post-deploy smoke tests.
- Watch error rate and latency during the first hours.
- Keep rollback instructions ready for image rollback and DB restore decision-making.

Exit criteria:

- Production health is stable.
- Core route flows work on real domain.
- Monitoring confirms normal performance.

## Concrete Repository Work Items

### Backend

- Add Spring profiles: `application-dev.properties`, `application-test.properties`, `application-prod.properties`.
- Add centralized CORS/security configuration under `backend/src/main/java/com/navigator/backend/config/`.
- Add Actuator and readiness/liveness.
- Add migration tooling and remove production reliance on `database/init/*.sql`.
- Add integration tests for route and admin flows.

### Frontend

- Make `VITE_API_BASE_URL` explicit for production builds.
- Review Nginx config for cache headers and proxy/ingress assumptions.
- Keep frontend image static-only when possible.

### Admin

- Separate deployment decision from the public app.
- Fix build reliability and output directory handling.
- Add authentication assumptions into UI flow if admin remains deployed.

### Infrastructure and docs

- Add `.env.example` for local/dev parity.
- Add `docker-compose.prod.yml` only if still needed for self-hosted or staging convenience, not as the final Azure production model.
- Add runbook docs for deploy, rollback, migration, restore, and incident response.

## Immediate Priority Order

1. Lock down admin and write endpoints.
2. Pick final Azure hosting model and admin exposure model.
3. Introduce DB migrations.
4. Add real CI/CD with tests and image publishing.
5. Provision staging on Azure.
6. Validate backup/restore, health probes, monitoring, and smoke tests.
7. Roll out production.

## Risks That Should Be Treated as Release Blockers

- Public admin access
- Wildcard CORS in production
- Database deployed from dev compose
- No migration framework
- No tested restore path
- No staging environment
- Backend tests not running reliably in CI
- Known route correctness bugs left unresolved

## Evidence Collected During This Review

- `frontend` build succeeded locally with `npm.cmd run build`.
- `frontend/admin` build failed locally with `EPERM` while cleaning `dist`.
- `backend` Maven wrapper failed locally on Windows in this environment, so backend verification workflow needs stabilization.
- Only `.github/workflows/code-style.yml` exists, and backend build there uses `mvn -DskipTests package`.

## Recommendation

Do not deploy this project to Azure production yet. It is close enough structurally to target Azure without a rewrite, but it still needs one focused hardening pass across security, database lifecycle, CI/CD, and observability before a first release is defensible.
