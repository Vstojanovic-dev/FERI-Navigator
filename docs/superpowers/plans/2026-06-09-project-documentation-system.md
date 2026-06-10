# Project Documentation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na novo napisati kratek, natančen in preverjen slovenski dokumentacijski sistem za uporabnike, razvijalce, skrbnike in AI-agente projekta FERI Navigator.

**Architecture:** Dokumentacija je majhen modularni sistem z enim lastnikom za vsako vrsto informacij. Korenski `README.md`, `AGENTS.md` in `docs/README.md` so vstopne točke, področni dokumenti pa pokrivajo uporabniško uporabo, arhitekturo, repozitorij, frontend, backend/API, podatke/navigacijo, razvoj, produkcijo in obvezna pravila za agente. Obstoječi ročni dokumenti se odstranijo šele po prenosu preverjenih dejstev; `docs/superpowers/plans/` in `docs/superpowers/specs/` ostaneta zgodovinski arhiv.

**Tech Stack:** Markdown, Mermaid, PowerShell, Docker Compose, Java 21, Spring Boot 3.3, Node.js 22, React 19, TypeScript 6, Vite 8, PostgreSQL/PostGIS 17/3.5, GitHub Actions.

---

## File Structure

### Create

- `AGENTS.md` - kratka obvezna vstopna pravila za vse AI-agente.
- `docs/user-guide.md` - uporabniška navodila brez tehničnih podrobnosti.
- `docs/architecture.md` - sistemski kontekst, komponente in glavni tokovi.
- `docs/repository-structure.md` - različice, mape, vstopne točke in viri resnice.
- `docs/frontend.md` - javni in admin frontend ter njune invariante.
- `docs/backend-and-api.md` - backend sloji in trenutne API pogodbe.
- `docs/data-and-navigation.md` - podatkovni model, graf, zemljevidi in migracije.
- `docs/development.md` - lokalni razvoj, preverjanje in diagnostika.
- `docs/deployment-and-operations.md` - produkcijska namestitev in vzdrževanje.
- `docs/ai-agents.md` - normativni pravilnik za AI-agente.

### Replace

- `README.md` - nov slovenski uvod in najkrajša pot do zagona.
- `docs/README.md` - novo kazalo po vprašanjih in nalogah.

### Preserve

- `docs/superpowers/plans/**`
- `docs/superpowers/specs/**`

### Remove after migration

- `docs/admin.md`
- `docs/admin_panel.md`
- `docs/ai_strategija/opis_aplikacije.md`
- `docs/ai_strategija/opis_tehnologij.md`
- `docs/ai_strategija/struktura_projekta_in_ai_navodila.md`
- `docs/backend.md`
- `docs/issues.md`
- `docs/language/slovenian-baseline-glossary.md`
- `docs/navigation.md`
- `docs/opis_koraka_implemetacioni_plan.md`
- `docs/pre_production_chechklist.md`
- `docs/razpodela.md`
- `docs/toDo.md`
- `docs/workflows/admin-export-to-migration.md`
- `docs/workflows/backup-and-restore.md`
- `docs/workflows/developer-cheat-sheet.md`
- `docs/workflows/release-checklist.md`
- `docs/workflows/runtime-profiles-and-environments.md`

---

### Task 1: Freeze the documentation inventory and factual sources

**Files:**
- Reference: `docs/superpowers/specs/2026-06-09-project-documentation-system-design.md`
- Reference: `README.md`
- Reference: `docs/**/*.md`
- Reference: `backend/pom.xml`
- Reference: `frontend/package.json`
- Reference: `frontend/admin/package.json`
- Reference: `docker-compose.yml`
- Reference: `docker-compose.prod.yml`
- Reference: `.env.example`
- Reference: `.github/workflows/ci.yml`
- Reference: `.github/workflows/code-style.yml`

- [ ] **Step 1: Record the working-tree boundary**

Run:

```powershell
git status --short
```

Expected: note all pre-existing modified and untracked files. In particular, do not stage or edit unrelated SQL or backend test changes already present in the worktree.

- [ ] **Step 2: Produce the old-document inventory**

Run:

```powershell
rg --files docs -g "*.md" | Sort-Object
```

Expected: every existing Markdown file is classified as:

- historical and preserved under `docs/superpowers/`;
- source material to inspect and later remove;
- target document to create or replace.

- [ ] **Step 3: Verify locked technology versions**

Run:

```powershell
rg -n '"(react|react-dom|typescript|vite|@playwright/test)"|<java.version>|spring-boot-starter-parent|postgis/postgis|node-version|^FROM ' backend/pom.xml frontend/package.json frontend/admin/package.json docker-compose.yml docker-compose.prod.yml frontend/Dockerfile backend/Dockerfile .github/workflows
```

Expected verified facts:

- Java `21`;
- Spring Boot `3.3.0`;
- CI and frontend container Node.js `22`;
- React `19.2.x`;
- TypeScript `6.0.x`;
- Vite `8.0.x`;
- PostgreSQL/PostGIS image `postgis/postgis:17-3.5`;
- backend build image Maven `3.9` with Temurin `21`.

- [ ] **Step 4: Verify runtime and verification commands**

Run:

```powershell
Get-Content -Raw docker-compose.yml
Get-Content -Raw docker-compose.prod.yml
Get-Content -Raw .github/workflows/ci.yml
Get-Content -Raw .github/workflows/code-style.yml
```

Expected: create a factual command list for later documents:

```text
docker compose up -d --build
docker compose ps
docker compose logs --tail 200 backend
docker compose config
backend\mvnw.cmd test
npm.cmd run build
npm.cmd run lint
npm.cmd run format:check
npm.cmd run test:e2e
```

Do not document a command as mandatory if the corresponding script or CI job does not exist.

- [ ] **Step 5: Verify current application surfaces**

Run:

```powershell
rg -n '<Route path=|@(Get|Post|Put|Patch|Delete)Mapping|@RequestMapping' frontend/src/app backend/src/main/java/com/navigator/backend -g "*.tsx" -g "*.java"
```

Expected: the writing tasks use current frontend routes and current public/admin endpoints, including catalog, location search, route, share, location details and map editor endpoints.

- [ ] **Step 6: Commit only if an inventory artifact was intentionally added**

No new inventory file is required by default. If no file changed, do not create an empty commit.

---

### Task 2: Build the three entry points

**Files:**
- Replace: `README.md`
- Replace: `docs/README.md`
- Create: `AGENTS.md`
- Reference: `docker-compose.yml`
- Reference: `frontend/src/app/AppRouter.tsx`
- Reference: `docs/superpowers/specs/2026-06-09-project-documentation-system-design.md`

- [ ] **Step 1: Rewrite the root README**

Write `README.md` in Slovenian with exactly these responsibilities:

```markdown
# FERI Navigator

## Kaj je FERI Navigator
Kratek produktni opis aplikacije za iskanje prostorov in navigacijo po FERI.

## Komu je namenjen
Študenti, zaposleni, obiskovalci, razvijalci in skrbniki.

## Glavne zmožnosti
Iskanje stavb/prostorov, navigacija, večnadstropne poti, deljenje poti in lokalno urejanje grafa, vendar samo če je vsaka funkcija potrjena v kodi.

## Hiter zagon
Predpogoji, `docker compose up -d --build`, URL frontenda in URL backend health/API.

## Nadaljnje branje
Povezave na `docs/README.md`, `docs/user-guide.md`, `docs/development.md`, `docs/architecture.md` in `docs/deployment-and-operations.md`.

## Struktura repozitorija
Samo glavne mape z enovrstičnimi opisi.

## Stanje produkcije
Kratko opozorilo, da production Compose obstaja, TLS, secrets management in monitoring pa je treba zagotoviti v ciljnem okolju.
```

Constraints:

- remove the screenshot and Microsoft Forms placeholders;
- do not repeat full version tables or production procedures;
- use `docker compose up -d --build`, matching the operational docs and CI;
- link only to files created by this plan.

- [ ] **Step 2: Replace the documentation index**

Write `docs/README.md` as a routing page:

```markdown
# Dokumentacija

## Izberite glede na cilj
Tabela: cilj, prvi dokument, naslednji dokument.

## Priporočeno branje za novega razvijalca
README -> architecture -> repository-structure -> development -> relevant domain document.

## Dokumenti
One-line purpose for every target document.

## Zgodovinski načrti
Explain that `superpowers/` is historical context, not current behavior.

## Pravilo vira resnice
Code/configuration wins when documentation and implementation disagree; fix docs in the same change.
```

- [ ] **Step 3: Create the root agent entry point**

Write `AGENTS.md` with a maximum practical length of roughly 60 lines:

```markdown
# Pravila za AI-agente

1. Pred spremembo preberi `docs/ai-agents.md`.
2. Nato preberi dokument področja, ki ga spreminjaš.
3. Preveri trenutno stanje v kodi; zgodovinski načrti niso vir trenutnega vedenja.
4. Ne prepiši ali razveljavi obstoječih uporabnikovih sprememb.
5. Ne spreminjaj API-ja, sheme ali migracij brez preverjanja vseh odjemalcev.
6. Za podatkovne spremembe ohrani ločitev bootstrap SQL in Flyway migracij.
7. Pred zaključkom izvedi preverbe, ki jih zahteva `docs/ai-agents.md`.
8. Če spremeniš pogodbo ali postopek, v istem delu posodobi dokumentacijo.
```

Add links to:

- `docs/ai-agents.md`;
- `docs/README.md`;
- `docs/development.md`.

- [ ] **Step 4: Verify entry-point links**

Run:

```powershell
$files = @(
  'docs/README.md',
  'docs/user-guide.md',
  'docs/development.md',
  'docs/architecture.md',
  'docs/deployment-and-operations.md',
  'docs/ai-agents.md'
)
$files | ForEach-Object { [PSCustomObject]@{ Path = $_; PlannedOrExists = (Test-Path $_) -or ($_ -in $files) } }
```

Expected: every link is part of the target file structure. Full existence verification happens after all tasks.

- [ ] **Step 5: Commit the entry points**

```powershell
git add -- README.md docs/README.md AGENTS.md
git commit -m "docs: create project documentation entry points"
```

---

### Task 3: Document users, architecture and repository structure

**Files:**
- Create: `docs/user-guide.md`
- Create: `docs/architecture.md`
- Create: `docs/repository-structure.md`
- Reference: `frontend/src/app/AppRouter.tsx`
- Reference: `frontend/src/pages/*.tsx`
- Reference: `frontend/src/features/navigation/**`
- Reference: `frontend/src/services/*.ts`
- Reference: `backend/src/main/java/com/navigator/backend/**`
- Reference: `backend/pom.xml`
- Reference: `frontend/package.json`
- Reference: `frontend/admin/package.json`
- Reference: `docker-compose.yml`
- Reference: `.github/workflows/*.yml`

- [ ] **Step 1: Write the user guide from visible behavior**

Write `docs/user-guide.md` with:

- what the application solves;
- home page and main menu;
- building and space browsing;
- start/destination selection;
- elevator preference behavior described in user terms;
- multi-floor segment and step navigation;
- shared route opening and PDF/QR features only after confirmation in current UI;
- expected errors and simple recovery actions;
- explicit note that admin editing is not an end-user feature.

Use Slovenian UI terms from `frontend/src/i18n/messages/sl.ts`. Do not copy technical DTO names into user instructions.

- [ ] **Step 2: Verify user-facing feature claims**

Run:

```powershell
rg -n "share|pdf|qr|allowElevator|activeSegment|activeStep|objekti|navigacija" frontend/src -g "*.tsx" -g "*.ts"
```

Expected: every feature in `docs/user-guide.md` has a current code reference. Remove claims that cannot be confirmed.

- [ ] **Step 3: Write the architecture overview**

Write `docs/architecture.md` with:

- a Mermaid system context diagram;
- component responsibilities for browser, public frontend, local admin frontend, Nginx, backend and PostgreSQL/PostGIS;
- a Mermaid request flow for route calculation;
- concise flows for catalog browsing, location search, route sharing and admin export;
- architectural boundaries:
  - backend owns routing decisions;
  - frontend renders backend contracts;
  - PostgreSQL/PostGIS owns persistent domain/navigation data;
  - Git plus migrations owns reviewed production data changes;
  - admin UI is a local editing tool, not a public production control panel;
- known constraints that materially affect changes.

Do not include full endpoint tables or database column lists.

- [ ] **Step 4: Write the repository and technology reference**

Write `docs/repository-structure.md` with:

- verified version table containing value and source file;
- tree limited to important directories;
- entry points for public frontend, admin frontend and backend;
- configuration map;
- table of sources of truth:

```text
Application behavior -> source code and automated tests
Backend dependencies -> backend/pom.xml
Frontend dependencies -> package.json and lock files
Local runtime -> docker-compose.yml
Production-like runtime -> docker-compose.prod.yml
Base database bootstrap -> database/init/
Post-bootstrap changes -> backend/src/main/resources/db/migration/
Map assets used by backend -> database/maps/
Automated verification -> .github/workflows/
Current documentation -> README.md, AGENTS.md and docs/*.md outside docs/superpowers/
```

State that exact dependency patch versions come from lock files, while the document keeps only versions useful to a maintainer.

- [ ] **Step 5: Check document scope and duplication**

Run:

```powershell
rg -n "GET /api|POST /api|CREATE TABLE|docker compose -f" docs/user-guide.md docs/architecture.md docs/repository-structure.md
```

Expected:

- no full API reference in user or architecture docs;
- no schema dump;
- production commands are linked to `deployment-and-operations.md` rather than duplicated.

- [ ] **Step 6: Commit the core mental model**

```powershell
git add -- docs/user-guide.md docs/architecture.md docs/repository-structure.md
git commit -m "docs: add user architecture and repository guides"
```

---

### Task 4: Document frontend, backend/API and navigation data

**Files:**
- Create: `docs/frontend.md`
- Create: `docs/backend-and-api.md`
- Create: `docs/data-and-navigation.md`
- Reference: `frontend/src/app/**`
- Reference: `frontend/src/pages/**`
- Reference: `frontend/src/components/**`
- Reference: `frontend/src/features/navigation/**`
- Reference: `frontend/src/services/**`
- Reference: `frontend/src/types/**`
- Reference: `frontend/src/i18n/**`
- Reference: `frontend/admin/src/**`
- Reference: `backend/src/main/java/com/navigator/backend/**`
- Reference: `backend/src/main/resources/application*.properties`
- Reference: `database/init/*.sql`
- Reference: `backend/src/main/resources/db/migration/*.sql`

- [ ] **Step 1: Write the frontend guide**

Write `docs/frontend.md` with:

- public frontend entry point and route map;
- page responsibilities;
- shared component versus navigation-feature boundaries;
- API service and runtime URL behavior;
- localization flow and supported languages;
- navigation state, route segments, active steps and map/SVG coordinate handling;
- admin frontend location, startup model and responsibility;
- common change map: where to edit pages, navigation UI, API clients, translations and admin behavior;
- frontend invariants;
- required verification matrix:

```text
Any frontend change -> npm.cmd run build
Style or general code change -> npm.cmd run lint and npm.cmd run format:check
Navigation behavior -> npm.cmd run test:e2e or the focused Playwright spec
Admin frontend change -> npm.cmd run build in frontend/admin
```

Do not enumerate every component.

- [ ] **Step 2: Build the current API inventory from controllers**

Run:

```powershell
rg -n "@RequestMapping|@(Get|Post|Patch|Delete)Mapping" backend/src/main/java/com/navigator/backend/controller backend/src/main/java/com/navigator/backend/admin/controller -g "*.java"
```

Expected groups:

- `/api/catalog`;
- `/api/navigation`;
- `/api/graph`;
- `/api/admin/map-editor`.

- [ ] **Step 3: Write the backend and API guide**

Write `docs/backend-and-api.md` with:

- package/layer mental model;
- request flow through controller, service, repository and DTO;
- current active endpoint tables with method, path, purpose, key inputs and response type;
- a separate legacy/development-only subsection for `/path` and `/api/graph`;
- route error model and centralized exception handling;
- security and admin-enabled behavior;
- `dev`, `test` and `prod` profile roles;
- rules for changing DTO/API contracts;
- test map linking controller/service behavior to test files.

Derive endpoint details from controller signatures and DTO classes, not from old documentation.

- [ ] **Step 4: Verify API names and response fields**

Run:

```powershell
rg -n "class .*Dto|record .*Dto|private .*;" backend/src/main/java/com/navigator/backend/dto backend/src/main/java/com/navigator/backend/admin/dto -g "*.java"
rg -n "apiFetch<|/api/" frontend/src/services frontend/admin/src -g "*.ts" -g "*.tsx"
```

Expected: public endpoint descriptions match both server definitions and current frontend consumers. Explicitly document server endpoints not currently used by the public frontend as internal, admin or compatibility endpoints.

- [ ] **Step 5: Write the data and navigation guide**

Write `docs/data-and-navigation.md` with:

- bootstrap versus Flyway lifecycle;
- conceptual entity relationship diagram in Mermaid;
- roles of buildings, floors, spaces, navigation locations, nodes, edges, node types, edge types and route shares;
- map asset and coordinate-system contract;
- directed-edge and stable `external_id` invariants;
- route calculation and vertical traversal policy at a conceptual level;
- route segmentation and step-generation contract;
- admin graph edit -> preview -> SQL export -> reviewed Flyway migration -> deployment flow;
- safe procedures for:
  - adding a map/floor;
  - adding or changing a location;
  - changing graph nodes/edges;
  - adding a Flyway migration;
- failure modes: disconnected graph, missing node mapping, wrong map dimensions, duplicate labels, unsafe production data editing.

Do not claim that old `database/init` files alone update an existing environment.

- [ ] **Step 6: Verify schema and migration statements**

Run:

```powershell
rg -n "^CREATE TABLE|^ALTER TABLE|navigation_locations|navigation_nodes|navigation_edges|route_share|primary_node_id|external_id|coordinate_width|coordinate_height" database/init backend/src/main/resources/db/migration -g "*.sql"
```

Expected: every documented entity and invariant can be located in the current SQL chain.

- [ ] **Step 7: Commit the technical domain guides**

```powershell
git add -- docs/frontend.md docs/backend-and-api.md docs/data-and-navigation.md
git commit -m "docs: document application technical domains"
```

---

### Task 5: Document local development and production operations

**Files:**
- Create: `docs/development.md`
- Create: `docs/deployment-and-operations.md`
- Reference: `docker-compose.yml`
- Reference: `docker-compose.prod.yml`
- Reference: `.env.example`
- Reference: `backend/src/main/resources/application*.properties`
- Reference: `frontend/Dockerfile`
- Reference: `backend/Dockerfile`
- Reference: `frontend/nginx.conf`
- Reference: `.github/workflows/*.yml`
- Reference: `deploy/verify-prod-maps-mount.ps1`

- [ ] **Step 1: Write the local development guide**

Write `docs/development.md` with:

- Docker Desktop, Docker Compose, Java 21 and Node.js 22 prerequisites;
- recommended full-stack startup:

```powershell
docker compose up -d --build
docker compose ps
```

- local URLs and service responsibilities;
- logs, rebuild and shutdown commands;
- backend tests:

```powershell
Set-Location backend
.\mvnw.cmd test
```

- public frontend checks:

```powershell
Set-Location frontend
npm.cmd ci
npm.cmd run build
npm.cmd run lint
npm.cmd run format:check
npm.cmd run test:e2e
```

- admin frontend checks:

```powershell
Set-Location frontend\admin
npm.cmd ci
npm.cmd run build
npm.cmd run dev
```

- when Docker, local Node and local Maven workflows should be used;
- development environment variables;
- troubleshooting decision tree for backend startup, database health, frontend API failures and Playwright failures;
- links to domain docs instead of duplicating architecture.

- [ ] **Step 2: Validate development command availability**

Run:

```powershell
docker compose config
Test-Path backend\mvnw.cmd
Get-Content -Raw frontend\package.json
Get-Content -Raw frontend\admin\package.json
```

Expected:

- Compose config renders successfully;
- Maven wrapper exists;
- every documented npm script exists;
- admin guide does not claim scripts that are absent from its `package.json`.

- [ ] **Step 3: Write the production and operations guide**

Write `docs/deployment-and-operations.md` with:

- supported production-like topology from `docker-compose.prod.yml`;
- prerequisites and `.env` preparation;
- required variables:
  - `SPRING_PROFILES_ACTIVE`;
  - `POSTGRES_DB`;
  - `DB_URL`;
  - `DB_USERNAME`;
  - `DB_PASSWORD`;
  - `APP_CORS_ALLOWED_ORIGINS`;
  - `APP_SHARE_BASE_URL`;
  - `APP_ADMIN_ENABLED`;
  - optional `VITE_API_BASE_URL`;
- pre-deploy verification;
- backup before migration;
- deployment command and health checks;
- post-deploy smoke checks;
- log inspection;
- database restore procedure with an explicit stop/replace/verify sequence;
- rollback split into:
  - application-only rollback;
  - database-affecting rollback requiring backup restore or a forward corrective migration;
- regular maintenance checklist;
- current limitations:
  - no TLS termination in the repository;
  - no repository-managed secrets platform;
  - no monitoring/alerting stack;
  - no rate limiting;
  - admin is not a permanently hosted authenticated service;
  - resource limits/log rotation depend on the hosting environment.

Do not provide destructive database commands without a preceding backup and explicit scope warning.

- [ ] **Step 4: Validate production Compose using non-secret test values**

Run:

```powershell
$env:DB_USERNAME='ci'
$env:DB_PASSWORD='ci'
$env:POSTGRES_DB='feri_navigator'
$env:APP_CORS_ALLOWED_ORIGINS='https://staging.example.com'
$env:APP_SHARE_BASE_URL='https://staging.example.com'
docker compose -f docker-compose.prod.yml config
```

Expected: exit code `0`; generated config has no public backend or PostgreSQL port and keeps admin disabled.

- [ ] **Step 5: Verify operational claims**

Run:

```powershell
rg -n "health|readiness|APP_ADMIN_ENABLED|APP_CORS_ALLOWED_ORIGINS|APP_SHARE_BASE_URL|baseline-on-migrate|ports:|expose:" docker-compose.prod.yml backend/src/main/resources frontend/nginx.conf -g "*"
```

Expected: health endpoints, variables, proxy paths and runtime exposure in the document match repository configuration.

- [ ] **Step 6: Commit development and operations guides**

```powershell
git add -- docs/development.md docs/deployment-and-operations.md
git commit -m "docs: add development and operations guides"
```

---

### Task 6: Add strict AI-agent rules

**Files:**
- Create: `docs/ai-agents.md`
- Modify: `AGENTS.md`
- Reference: all new `docs/*.md`
- Reference: `.github/workflows/*.yml`
- Reference: `.gitignore`

- [ ] **Step 1: Write the mandatory reading matrix**

Start `docs/ai-agents.md` with a normative table:

```text
Any task -> README.md, AGENTS.md, docs/ai-agents.md
Frontend -> docs/frontend.md, docs/development.md
Backend/API -> docs/backend-and-api.md, docs/development.md
Database/navigation -> docs/data-and-navigation.md, docs/development.md
Deployment/runtime -> docs/deployment-and-operations.md
Cross-cutting architecture -> docs/architecture.md, docs/repository-structure.md
```

State that `docs/superpowers/` may explain historical intent but never overrides current code, tests or current documentation.

- [ ] **Step 2: Write strict change rules**

Add explicit `mora`, `ne sme` and `pred zaključkom preveri` rules covering:

- inspect `git status` before editing;
- preserve unrelated user changes;
- use current repository patterns;
- keep changes scoped;
- verify claims in source files;
- do not invent endpoints, dependencies or production capabilities;
- coordinate API changes across controllers, DTOs, frontend types/services and tests;
- coordinate schema changes across SQL, JPA, migrations and documentation;
- preserve stable navigation identifiers and map coordinate contracts;
- never treat admin UI edits as production source of truth;
- never edit an already applied Flyway migration;
- never expose admin functionality in production without a separate security decision;
- update documentation with contract/process changes.

- [ ] **Step 3: Write the verification matrix**

Include the exact minimum checks:

```text
Backend code -> backend\mvnw.cmd test
Public frontend -> npm.cmd run build
Frontend behavior -> npm.cmd run test:e2e or focused Playwright test
Frontend style/config -> npm.cmd run lint and npm.cmd run format:check
Admin frontend -> npm.cmd run build in frontend/admin
Compose change -> docker compose config
Production Compose change -> docker compose -f docker-compose.prod.yml config with required env
Documentation -> link/path scan, command/source verification, placeholder scan
```

Require agents to report checks they could not run.

- [ ] **Step 4: Add security and completion gates**

Require:

- no secrets in commits;
- no wildcard production CORS;
- no destructive database action without backup and explicit approval;
- no success claim before verification;
- final summary listing changed files, verified commands and remaining limitations.

- [ ] **Step 5: Reconcile root and detailed agent rules**

Read `AGENTS.md` and remove any duplicate detail that belongs only in `docs/ai-agents.md`. Keep root rules short and ensure every mandatory root statement is expanded in the detailed document.

- [ ] **Step 6: Commit agent rules**

```powershell
git add -- AGENTS.md docs/ai-agents.md
git commit -m "docs: enforce project rules for AI agents"
```

---

### Task 7: Remove obsolete docs and verify the complete system

**Files:**
- Delete: all files listed under “Remove after migration”
- Verify: `README.md`
- Verify: `AGENTS.md`
- Verify: `docs/README.md`
- Verify: `docs/user-guide.md`
- Verify: `docs/architecture.md`
- Verify: `docs/repository-structure.md`
- Verify: `docs/frontend.md`
- Verify: `docs/backend-and-api.md`
- Verify: `docs/data-and-navigation.md`
- Verify: `docs/development.md`
- Verify: `docs/deployment-and-operations.md`
- Verify: `docs/ai-agents.md`
- Preserve: `docs/superpowers/**`

- [ ] **Step 1: Compare every old document against the new ownership map**

For each old file, confirm that every still-valid operational fact is either:

- represented in its target new document;
- intentionally omitted because it is implementation detail, obsolete, speculative or duplicated;
- preserved only as historical context under `docs/superpowers/`.

Do not copy claims that conflict with current controllers, routes, SQL or runtime configuration.

- [ ] **Step 2: Delete obsolete manual documentation**

Use `apply_patch` to delete exactly the files listed in the plan’s “Remove after migration” section. Remove empty directories `docs/ai_strategija/`, `docs/language/` and `docs/workflows/` only after their files are gone.

Do not delete or move anything under:

```text
docs/superpowers/plans/
docs/superpowers/specs/
```

- [ ] **Step 3: Verify the final documentation file set**

Run:

```powershell
rg --files docs -g "*.md" | Sort-Object
```

Expected current-document set outside `docs/superpowers/`:

```text
docs/README.md
docs/ai-agents.md
docs/architecture.md
docs/backend-and-api.md
docs/data-and-navigation.md
docs/deployment-and-operations.md
docs/development.md
docs/frontend.md
docs/repository-structure.md
docs/user-guide.md
```

- [ ] **Step 4: Scan for stale references and unfinished text**

Run:

```powershell
rg -n "docs/(admin|admin_panel|backend|navigation|issues|toDo|workflows|ai_strategija|language)|opis\.md|handover\.md|NavigacijaPage|TBD|TODO|placeholder|dodano naknadno" README.md AGENTS.md docs -g "*.md" -g "!docs/superpowers/**"
```

Expected: no stale links, old filenames, obsolete frontend class names or unfinished placeholder text in current documentation.

- [ ] **Step 5: Check all relative Markdown links**

Run this PowerShell check from the repository root:

```powershell
$markdownFiles = @('README.md', 'AGENTS.md') + @(Get-ChildItem docs -File -Filter *.md | ForEach-Object FullName)
$broken = foreach ($file in $markdownFiles) {
  $absoluteFile = (Resolve-Path $file).Path
  $content = Get-Content $absoluteFile -Raw
  $base = Split-Path $absoluteFile
  foreach ($match in [regex]::Matches($content, '\[[^\]]+\]\((?!https?://|#)([^)#]+)(?:#[^)]+)?\)')) {
    $target = [uri]::UnescapeDataString($match.Groups[1].Value)
    $resolved = Join-Path $base $target
    if (-not (Test-Path $resolved)) {
      "$absoluteFile -> $target"
    }
  }
}
if ($broken) { $broken; exit 1 }
```

Expected: exit code `0` and no broken local links.

- [ ] **Step 6: Verify language consistency**

Run:

```powershell
rg -n "\b(Sta|Kako|Gde|Cilj|Koristi|Pokreni|Zelis|Menjas|Ogranicenja|Postojeca)\b" README.md AGENTS.md docs -g "*.md" -g "!docs/superpowers/**"
```

Expected: no Serbian section prose in current documentation. Code identifiers and quoted API values are exempt.

- [ ] **Step 7: Run repository verification documented by the guides**

Run:

```powershell
docker compose config
```

Run:

```powershell
Set-Location backend
.\mvnw.cmd test
```

Run:

```powershell
Set-Location frontend
npm.cmd run build
npm.cmd run lint
npm.cmd run format:check
npm.cmd run test:e2e
```

Run:

```powershell
Set-Location frontend\admin
npm.cmd run build
```

Run production config validation with the environment values from Task 5.

Expected:

- every command exits with code `0`;
- if an unrelated pre-existing code or data change causes a failure, record the exact failure and do not rewrite documentation to hide it.

- [ ] **Step 8: Review the documentation as two readers**

Reader A, non-technical:

1. Start at `README.md`.
2. Find `docs/user-guide.md`.
3. Explain how to search for a destination and follow a multi-floor route.

Reader B, new developer:

1. Start at `README.md`.
2. Find prerequisites and startup commands.
3. Identify frontend, backend, database and deployment sources of truth.
4. Identify the correct checks for a backend, frontend or database change.
5. Find the production deployment and rollback limitations.

Expected: neither reader needs an old document or oral explanation for these tasks.

- [ ] **Step 9: Review the final diff**

Run:

```powershell
git diff --check
git status --short
git diff -- README.md AGENTS.md docs
```

Expected:

- no whitespace errors;
- only intended documentation files are staged for this task;
- pre-existing unrelated SQL/test changes remain untouched.

- [ ] **Step 10: Commit cleanup and final verification fixes**

```powershell
git add -- README.md AGENTS.md docs
git commit -m "docs: complete concise project documentation"
```

---

## Final Acceptance Checklist

- [ ] All current documentation is Slovenian.
- [ ] `README.md` gets a user or developer to the correct next document quickly.
- [ ] `docs/README.md` routes by task rather than repeating technical details.
- [ ] Every information category has one clear owner.
- [ ] Versions and commands point to repository sources.
- [ ] API documentation matches controllers, DTOs and frontend consumers.
- [ ] Navigation documentation matches SQL, JPA and migration behavior.
- [ ] Development commands were executed.
- [ ] Production Compose was validated with explicit test environment values.
- [ ] Production limitations are stated without claiming missing infrastructure.
- [ ] `AGENTS.md` and `docs/ai-agents.md` contain strict, testable rules.
- [ ] Old manual docs are removed.
- [ ] `docs/superpowers/plans/` and `docs/superpowers/specs/` are preserved unchanged.
- [ ] Relative links resolve.
- [ ] No placeholders, stale filenames or competing sources of truth remain.

## Self-Review

This plan covers every target file and acceptance criterion from
`docs/superpowers/specs/2026-06-09-project-documentation-system-design.md`.
It separates source inspection, writing, cleanup and verification so obsolete files are not removed before their useful facts are checked. It also keeps the user’s unrelated worktree changes outside all documentation commits.
