# Slovenian Language Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize all user-visible application text to correct, consistent Slovenian across the main frontend, admin frontend, and backend-exposed error messages, without introducing dual-language switching yet.

**Architecture:** Keep this delivery narrowly scoped to language cleanup and encoding correction. Do not introduce i18n infrastructure in this phase. Instead, first centralize the source-of-truth glossary, replace mixed Serbian/English/corrupted strings with valid Slovenian copy, and align tests around the Slovenian baseline so the codebase is ready for a later English translation layer.

**Tech Stack:** React 19 + TypeScript + Vite frontend, React admin frontend, Spring Boot backend, Playwright e2e tests, Maven/JUnit backend tests, ripgrep for string audit

---

## File Structure

**Create**
- `docs/language/slovenian-baseline-glossary.md`

**Modify**
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/BuildingsPage.tsx`
- `frontend/src/pages/NavigationPage.tsx`
- `frontend/src/components/SearchField.tsx`
- `frontend/src/components/MainMenuOverlay.tsx`
- `frontend/src/components/SubPageHeader.tsx`
- `frontend/src/components/SpaceDetailsView.tsx`
- `frontend/src/components/EmptyState.tsx`
- `frontend/src/components/OverlayModal.tsx`
- `frontend/src/features/navigation/NavigationView.tsx`
- `frontend/src/features/navigation/LocationPicker.tsx`
- `frontend/src/features/navigation/StepList.tsx`
- `frontend/src/features/navigation/SegmentTabs.tsx`
- `frontend/src/features/navigation/SharePanel.tsx`
- `frontend/src/features/navigation/RoutePdf.tsx`
- `frontend/src/utils/spaceTypeFilter.ts`
- `frontend/src/utils/spaceDescription.ts`
- `frontend/src/utils/displayNames.ts`
- `frontend/src/services/api.ts`
- `frontend/admin/src/AdminApp.tsx`
- `backend/src/main/java/com/navigator/backend/controller/NavigationController.java`
- `backend/src/main/java/com/navigator/backend/service/NavigationShareService.java`
- `backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java`
- `backend/src/main/java/com/navigator/backend/admin/service/MapEditorService.java`
- `backend/src/main/java/com/navigator/backend/service/NavGraphService.java`
- `frontend/tests/app-smoke.spec.ts`
- `backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java`
- `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`
- `backend/src/test/java/com/navigator/backend/service/CatalogServiceTest.java`

## Guardrails

- Do not add `i18n`, `context`, `language`, `locale`, `translation`, or `t()` helpers in this delivery.
- Do not change routing, API shapes, or component behavior unless required to expose corrected Slovenian copy.
- Preserve existing UX and layout; this is a copy/consistency pass, not a redesign.
- Fix mojibake and encoding artifacts as part of the same edits. Strings like `ZaÄetna` must become valid UTF-8 Slovenian text like `Začetna`.
- Keep backend message codes stable; only user-facing message text may change.

### Task 1: Build the Slovenian copy inventory and glossary

**Files:**
- Create: `docs/language/slovenian-baseline-glossary.md`
- Modify: none
- Audit only: `frontend/src`, `frontend/admin/src`, `backend/src/main/java`, `frontend/tests`

- [ ] **Step 1: Audit all user-visible strings**

Run:

```powershell
rg -n --glob "!**/*.css" --glob "!**/*.module.css" --glob "!**/*.svg" --glob "!**/*.png" "aria-label=|placeholder=|title=|label: '|label: \"|message\\(|setError\\(|setNotice\\(|window\\.alert\\(|window\\.confirm\\(|<h1>|<h2>|<h3>|<button|EmptyState|Route preview|Search location|Request failed|Ne mogu|Pocetna|Ciljna|Sacuv|Obrisi|Download|Copy|Select / move|Add node|Connect|Delete" frontend/src frontend/admin/src backend/src/main/java frontend/tests
```

Expected:
- A file-by-file list of hardcoded user-visible strings across main frontend, admin frontend, and backend fallbacks.
- You should explicitly spot mixed-language strings in `frontend/admin/src/AdminApp.tsx`, mojibake in `frontend/src/pages/HomePage.tsx`, `frontend/src/pages/BuildingsPage.tsx`, `frontend/src/features/navigation/NavigationView.tsx`, and Serbian backend messages in `backend/src/main/java/com/navigator/backend/service/NavigationShareService.java`.

- [ ] **Step 2: Write the glossary document**

Add this initial document content to `docs/language/slovenian-baseline-glossary.md`:

```md
# Slovenian Baseline Glossary

## Purpose

This document defines the canonical Slovenian wording for the current application baseline.
All user-visible strings in the app must match this glossary unless a screen requires a tighter UI variant.

## Navigation

- Začetna lokacija
- Ciljna lokacija
- Poišči začetno lokacijo
- Poišči cilj
- Prikaži pot
- Uporabi dvigalo
- Deli pot
- Uredi lokaciji
- Prejšnji korak
- Naprej
- Deljena pot trenutno ni na voljo.
- Deljena pot trenutno ni dostopna.
- Napaka pri izračunu poti.
- Napaka pri ustvarjanju povezave.
- Začetna in ciljna lokacija ne smeta biti enaki.
- Izberi začetno in ciljno lokacijo s seznama.

## Search and results

- Išči učilnico, laboratorij ali pisarno
- Išči objekt
- Išči prostor v objektu
- Prostori
- Ni rezultatov
- Poskusi z drugim nazivom prostora.
- Poskusi z drugim iskalnim nizom.
- Ni prostorov
- Za ta objekt še ni dodanih prostorov.
- Ni prostorov za izbrano iskanje.

## Buildings and spaces

- Objekt
- Nadstropje
- Oznaka
- Objekti
- Vsi objekti
- Načrt objekta
- Prostori v objektu
- Za ta objekt trenutno ni dodanega načrta.
- Poišči učilnico

## Menu and common actions

- Domov
- Navigacija
- Glavni meni
- Nazaj
- Odpri meni
- Odpri zemljevid
- Zemljevid FERI

## Admin

- Premakni / izberi
- Dodaj vozlišče
- Poveži
- Izbriši
- Shrani vozlišče
- Shrani povezavo
- Zapri
- Prenesi
- Kopiraj
- Predogled poti
- Iskanje lokacije
- Vir
- Ciljno nadstropje
- Ciljno vozlišče
- Pripravi medetažno povezavo

## Backend message style

- Use Slovenian.
- Use correct diacritics.
- Keep messages short and concrete.
- Prefer “ni najdena” over Serbian-style “nije pronadjena”.
- Prefer “ni mogoče” over “ne mogu”.
```

- [ ] **Step 3: Review the glossary for terminology conflicts**

Run:

```powershell
Get-Content docs\language\slovenian-baseline-glossary.md
```

Expected:
- The glossary contains no Serbian forms like `Pocetna`, `sacuvan`, `ucitam`, `obrisi`.
- The glossary contains no English UI labels meant for end users.

- [ ] **Step 4: Commit the glossary**

Run:

```bash
git add docs/language/slovenian-baseline-glossary.md
git commit -m "docs: define slovenian baseline glossary"
```

Expected:
- Commit succeeds with the glossary only.

### Task 2: Normalize shared frontend copy and encoding

**Files:**
- Modify: `frontend/src/components/SearchField.tsx`
- Modify: `frontend/src/components/MainMenuOverlay.tsx`
- Modify: `frontend/src/components/SubPageHeader.tsx`
- Modify: `frontend/src/components/SpaceDetailsView.tsx`
- Modify: `frontend/src/components/EmptyState.tsx`
- Modify: `frontend/src/components/OverlayModal.tsx`

- [ ] **Step 1: Inspect the shared components before editing**

Run:

```powershell
Get-Content frontend\src\components\SearchField.tsx
Get-Content frontend\src\components\MainMenuOverlay.tsx
Get-Content frontend\src\components\SubPageHeader.tsx
Get-Content frontend\src\components\SpaceDetailsView.tsx
Get-Content frontend\src\components\EmptyState.tsx
Get-Content frontend\src\components\OverlayModal.tsx
```

Expected:
- You can identify which strings are already Slovenian and which are mojibake-corrupted.
- `aria-label` and button text are visible from these shared components and must be corrected once here instead of repeatedly per page.

- [ ] **Step 2: Correct corrupted glyphs and standardize labels**

Apply edits so the shared component strings match this target baseline:

```tsx
// frontend/src/components/SubPageHeader.tsx
aria-label="Nazaj"
aria-label="Odpri meni"

// frontend/src/components/MainMenuOverlay.tsx
const MENU_ITEMS = [
  { path: '/', label: 'Domov' },
  { path: '/objekti', label: 'Vsi objekti' },
  { path: '/navigacija', label: 'Navigacija' },
];
aria-label="Glavni meni"

// frontend/src/components/SpaceDetailsView.tsx
const infoItems = [
  space.buildingName?.trim() ? { label: 'Objekt', value: space.buildingName } : null,
  space.floor?.trim() ? { label: 'Nadstropje', value: space.floor } : null,
  space.code?.trim() ? { label: 'Oznaka', value: space.code } : null,
].filter((item): item is { label: string; value: string } => item != null);

// Primary CTA text
Poišči učilnico
```

Expected:
- No mojibake remains in shared components.
- Shared button and menu copy matches the glossary exactly.

- [ ] **Step 3: Run lint to catch accidental JSX/string syntax errors**

Run:

```powershell
npm.cmd run lint
```

Workdir:

```text
frontend
```

Expected:
- ESLint passes.
- If unrelated pre-existing lint errors exist, document them in the working notes before continuing.

- [ ] **Step 4: Commit the shared frontend cleanup**

Run:

```bash
git add frontend/src/components/SearchField.tsx frontend/src/components/MainMenuOverlay.tsx frontend/src/components/SubPageHeader.tsx frontend/src/components/SpaceDetailsView.tsx frontend/src/components/EmptyState.tsx frontend/src/components/OverlayModal.tsx
git commit -m "fix: normalize shared slovenian frontend copy"
```

Expected:
- Commit succeeds and contains only shared component text cleanup.

### Task 3: Standardize user-facing copy in primary frontend pages

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`
- Modify: `frontend/src/pages/BuildingsPage.tsx`
- Modify: `frontend/src/pages/NavigationPage.tsx`
- Modify: `frontend/src/features/navigation/NavigationView.tsx`
- Modify: `frontend/src/features/navigation/LocationPicker.tsx`
- Modify: `frontend/src/features/navigation/StepList.tsx`
- Modify: `frontend/src/features/navigation/SegmentTabs.tsx`
- Modify: `frontend/src/features/navigation/SharePanel.tsx`
- Modify: `frontend/src/features/navigation/RoutePdf.tsx`
- Modify: `frontend/src/utils/spaceTypeFilter.ts`
- Modify: `frontend/src/utils/spaceDescription.ts`
- Modify: `frontend/src/utils/displayNames.ts`

- [ ] **Step 1: Inspect the main frontend screens**

Run:

```powershell
Get-Content frontend\src\pages\HomePage.tsx
Get-Content frontend\src\pages\BuildingsPage.tsx
Get-Content frontend\src\pages\NavigationPage.tsx
Get-Content frontend\src\features\navigation\NavigationView.tsx
Get-Content frontend\src\features\navigation\LocationPicker.tsx
Get-Content frontend\src\features\navigation\StepList.tsx
Get-Content frontend\src\features\navigation\SegmentTabs.tsx
Get-Content frontend\src\features\navigation\SharePanel.tsx
Get-Content frontend\src\features\navigation\RoutePdf.tsx
```

Expected:
- You can enumerate all visible text that needs normalization.
- You should identify corrupted strings like `IÅ¡Äi`, `ZaÄetna`, `PrikaÅ¾i`, `PrejÅ¡nji`.

- [ ] **Step 2: Apply the canonical Slovenian copy**

Use this target copy while editing:

```tsx
// frontend/src/pages/HomePage.tsx
aria-label="Odpri meni"
aria-label="Odpri zemljevid"
placeholder="Išči učilnico, laboratorij ali pisarno"
aria-label="Filter po tipu prostora"
<h2>Prostori</h2>
<EmptyState title="Ni rezultatov" text="Poskusi z drugim nazivom prostora." />
<span>Objekt</span>
<span>Nadstropje</span>
Poišči učilnico
title="Zemljevid FERI"
alt="Zemljevid FERI"

// frontend/src/features/navigation/NavigationView.tsx
'Deljena pot trenutno ni dostopna.'
'Izberi začetno in ciljno lokacijo s seznama.'
'Napaka pri izračunu poti.'
'Deljena pot trenutno ni na voljo.'
'Napaka pri ustvarjanju povezave.'
'Začetna lokacija'
'Ciljna lokacija'
'Poišči začetno lokacijo'
'Poišči cilj'
'Uporabi dvigalo'
'Prikaži pot'
'Računam pot...'
'Uredi lokaciji'
'Deli pot'
'Začetna in ciljna lokacija ne smeta biti enaki.'
'Spremeni odsek'
'Prejšnji korak'
'Naprej'
```

For `frontend/src/pages/BuildingsPage.tsx`, convert the existing literals to valid Slovenian:

```tsx
'Učilnica'
'Pritličje'
'Načrt objekta'
'Za ta objekt trenutno ni dodanega načrta.'
'Prostori v objektu'
'Išči prostor v objektu'
'Ni prostorov'
'Za ta objekt še ni dodanih prostorov.'
'Ni rezultatov'
'Ni prostorov za izbrano iskanje.'
'Objekti'
'Išči objekt'
'Poskusi z drugim iskalnim nizom.'
```

Expected:
- Visible main-app text becomes uniformly Slovenian with correct diacritics.
- No Serbian fallbacks remain in the user path.
- No English labels remain in the main app except immutable brand names.

- [ ] **Step 3: Review utility-generated labels**

Run:

```powershell
Get-Content frontend\src\utils\spaceTypeFilter.ts
Get-Content frontend\src\utils\spaceDescription.ts
Get-Content frontend\src\utils\displayNames.ts
```

Update any generated strings so they produce Slovenian output such as:

```ts
label: 'Vse'
label: 'Učilnice'
label: 'Laboratoriji'
label: 'Pisarne'
label: 'Skupni prostori'
```

Expected:
- Derived labels, badges, and descriptions match the glossary.
- The UI does not show mixed-language values generated from helpers.

- [ ] **Step 4: Build the frontend**

Run:

```powershell
npm.cmd run build
```

Workdir:

```text
frontend
```

Expected:
- Vite build succeeds.

- [ ] **Step 5: Commit the primary frontend language cleanup**

Run:

```bash
git add frontend/src/pages/HomePage.tsx frontend/src/pages/BuildingsPage.tsx frontend/src/pages/NavigationPage.tsx frontend/src/features/navigation/NavigationView.tsx frontend/src/features/navigation/LocationPicker.tsx frontend/src/features/navigation/StepList.tsx frontend/src/features/navigation/SegmentTabs.tsx frontend/src/features/navigation/SharePanel.tsx frontend/src/features/navigation/RoutePdf.tsx frontend/src/utils/spaceTypeFilter.ts frontend/src/utils/spaceDescription.ts frontend/src/utils/displayNames.ts
git commit -m "fix: standardize slovenian copy in main frontend"
```

Expected:
- Commit succeeds and contains only main frontend text normalization.

### Task 4: Standardize admin frontend copy and admin-side fallbacks

**Files:**
- Modify: `frontend/admin/src/AdminApp.tsx`

- [ ] **Step 1: Inspect the admin app and isolate all end-user strings**

Run:

```powershell
rg -n "Select / move|Add node|Connect|Delete|Download|Copy|Cross-floor|Route preview|routing|Search location|From|To|Save|Close|Public|Waypoint|Bidirectional|Forward instruction|Backward instruction|Landmark|Ne mogu|nije izabran|Obrisi|sacuv|ucitam|prikazem" frontend\admin\src\AdminApp.tsx
```

Expected:
- You see the mixed English/Serbian/admin-specific copy concentrated in one file.

- [ ] **Step 2: Replace admin copy with canonical Slovenian**

Use the following target replacements inside `frontend/admin/src/AdminApp.tsx`:

```tsx
const tools = [
  { id: 'select', label: 'Premakni / izberi', icon: 'V' },
  { id: 'add-node', label: 'Dodaj vozlišče', icon: '+' },
  { id: 'connect', label: 'Poveži', icon: '-' },
  { id: 'delete', label: 'Izbriši', icon: 'X' },
];

// Error/notice messages
'Ni mogoče naložiti admin urejevalnika.'
'Ni mogoče naložiti grafa nadstropja.'
'Ni mogoče naložiti vozlišč ciljnega nadstropja.'
'Položaj vozlišča je shranjen.'
'Ni mogoče shraniti premika vozlišča.'
'Izbrano izvorno vozlišče'
'Ni mogoče shraniti vozlišča.'
'Vozlišče je dodano.'
'Vozlišče je shranjeno.'
'Izbriši vozlišče'
'Vozlišče je izbrisano.'
'Ni mogoče izbrisati vozlišča.'
'Povezava je dodana.'
'Povezava je shranjena.'
'Ni mogoče shraniti povezave.'
'Izbriši povezavo'
'Povezava je izbrisana.'
'Ni mogoče izbrisati povezave.'
'Ni mogoče ustvariti SQL izvoza.'

// Export and panels
'Prenesi'
'Kopiraj'
'Medetažne povezave'
'Vir'
'ni izbrano'
'Ciljno nadstropje'
'Ciljno vozlišče'
'Izberi vozlišče'
'Pripravi medetažno povezavo'
'Oznaka'
'Zunanji ID'
'Vrsta vozlišča'
'ID prostora'
'Shrani vozlišče'
'Zapri'
'Od'
'Do'
'Vrsta povezave'
'Dvosmerna'
'Medetažna'
'Med objekti'
'Navodilo naprej'
'Navodilo nazaj'
'Orientir'
'Shrani povezavo'
'Predogled poti'
'računanje poti...'
'Od'
'Do'
'Išči lokacijo'
'Zahteva ni uspela.'
```

Expected:
- Admin UI is fully Slovenian and free of English/Serbian labels.
- Confirmation dialogs and notices use correct Slovenian diacritics.

- [ ] **Step 3: Build the admin frontend**

Run:

```powershell
npm.cmd run build
```

Workdir:

```text
frontend/admin
```

Expected:
- Admin build succeeds.

- [ ] **Step 4: Commit the admin cleanup**

Run:

```bash
git add frontend/admin/src/AdminApp.tsx
git commit -m "fix: standardize slovenian copy in admin frontend"
```

Expected:
- Commit succeeds with only admin copy changes.

### Task 5: Standardize backend-exposed Slovenian error messages

**Files:**
- Modify: `backend/src/main/java/com/navigator/backend/controller/NavigationController.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/NavigationShareService.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java`
- Modify: `backend/src/main/java/com/navigator/backend/admin/service/MapEditorService.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/NavGraphService.java`
- Modify: `backend/src/main/java/com/navigator/backend/config/ApiExceptionHandler.java`

- [ ] **Step 1: Inspect backend user-visible messages**

Run:

```powershell
rg -n "Parametar|Pocetna|Ciljna|nije pronadjena|Veza preskocena|Ne mogu|Request failed|ruta|pronadjen|ucitam|obrisi|sacuv" backend\src\main\java
```

Expected:
- You locate backend strings that surface to the client or to admin operators.

- [ ] **Step 2: Replace backend message text without changing codes**

Use Slovenian replacements like:

```java
// backend/src/main/java/com/navigator/backend/controller/NavigationController.java
"Parameter 'from' je obvezen."
"Parameter 'to' je obvezen."

// backend/src/main/java/com/navigator/backend/service/NavigationShareService.java
"Začetna lokacija ni najdena: " + request.getFromLocationId()
"Ciljna lokacija ni najdena: " + request.getToLocationId()

// backend/src/main/java/com/navigator/backend/service/NavGraphService.java
"Povezava je preskočena - vozlišče ni najdeno: {} -> {}"
"Medetažna povezava je preskočena: {} -> {}"
```

For `NavigationRouteService` and `MapEditorService`, keep existing codes and control flow, but normalize every user-facing Slovenian sentence to the same style as the glossary.

Expected:
- API payload messages are valid Slovenian.
- Exception codes and response shapes remain unchanged.

- [ ] **Step 3: Run backend tests**

Run:

```powershell
.\mvnw.cmd test
```

Workdir:

```text
backend
```

Expected:
- JUnit tests pass.
- If tests fail only because they assert old Serbian strings, update them in the next task rather than changing logic.

- [ ] **Step 4: Commit the backend message cleanup**

Run:

```bash
git add backend/src/main/java/com/navigator/backend/controller/NavigationController.java backend/src/main/java/com/navigator/backend/service/NavigationShareService.java backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java backend/src/main/java/com/navigator/backend/admin/service/MapEditorService.java backend/src/main/java/com/navigator/backend/service/NavGraphService.java backend/src/main/java/com/navigator/backend/config/ApiExceptionHandler.java
git commit -m "fix: normalize slovenian backend messages"
```

Expected:
- Commit succeeds with message-only backend changes.

### Task 6: Update tests to enforce the Slovenian baseline

**Files:**
- Modify: `frontend/tests/app-smoke.spec.ts`
- Modify: `backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java`
- Modify: `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`
- Modify: `backend/src/test/java/com/navigator/backend/service/CatalogServiceTest.java`

- [ ] **Step 1: Update Playwright fixtures and assertions**

Edit `frontend/tests/app-smoke.spec.ts` so mocked content is consistent with the Slovenian baseline. Replace examples like:

```ts
spaceTypeName: 'Classroom'
text: 'Nastavite prema Alfa.'
message: 'Za izabrane lokacije jos ne postoji unesena ruta.'
```

with Slovenian equivalents:

```ts
spaceTypeName: 'Učilnica'
text: 'Nadaljujte proti Alfa.'
message: 'Za izbrani lokaciji še ni vnesene poti.'
```

Also update button/text expectations to exact Slovenian labels where needed:

```ts
await expect(page.getByText('Prostori v objektu')).toBeVisible();
await expect(page.getByLabel('Deli pot')).toHaveCount(1);
```

Expected:
- Frontend smoke tests validate the Slovenian baseline instead of stale Serbian/English fixtures.

- [ ] **Step 2: Update backend tests for message assertions**

Run:

```powershell
rg -n "Pocetna|Ciljna|Parametar|pronadjena|obavezan|jos ne postoji|Nastavite prema|Request failed" backend\src\test\java frontend\tests
```

Then update assertions to the new canonical Slovenian text while keeping status codes and behavior unchanged.

Expected:
- Tests assert the new message text, not the previous mixed-language baseline.

- [ ] **Step 3: Run the full frontend verification**

Run:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e
```

Workdir:

```text
frontend
```

Expected:
- Lint passes.
- Build passes.
- Playwright smoke suite passes with Slovenian copy.

- [ ] **Step 4: Run final backend verification**

Run:

```powershell
.\mvnw.cmd test
```

Workdir:

```text
backend
```

Expected:
- Backend test suite passes after message updates.

- [ ] **Step 5: Commit the test baseline update**

Run:

```bash
git add frontend/tests/app-smoke.spec.ts backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java backend/src/test/java/com/navigator/backend/service/CatalogServiceTest.java
git commit -m "test: align automated checks with slovenian baseline"
```

Expected:
- Commit succeeds with test-only changes.

### Task 7: Final regression sweep and release checklist

**Files:**
- Modify if needed: any touched files above

- [ ] **Step 1: Re-run string audit to confirm there are no obvious mixed-language leftovers**

Run:

```powershell
rg -n --glob "!**/*.css" --glob "!**/*.module.css" "Select / move|Add node|Connect|Delete|Download|Copy|Search location|Route preview|Request failed|Ne mogu|Pocetna|Ciljna|pronadjena|sacuv|ucitam|obrisi|jos ne postoji|prema" frontend/src frontend/admin/src backend/src/main/java frontend/tests
```

Expected:
- No results, or only false positives in non-user-facing technical identifiers.

- [ ] **Step 2: Manually inspect the working tree diff**

Run:

```bash
git diff -- frontend/src frontend/admin/src backend/src/main/java frontend/tests docs/language
```

Expected:
- Diff contains only text normalization, encoding cleanup, and test expectation updates.
- No accidental behavior changes, refactors, or i18n scaffolding.

- [ ] **Step 3: Create the final delivery commit**

Run:

```bash
git add docs/language frontend/src frontend/admin/src backend/src/main/java frontend/tests backend/src/test
git commit -m "feat: establish slovenian language baseline"
```

Expected:
- Final feature commit succeeds.

- [ ] **Step 4: Write the implementation summary for handoff**

Include this in the final agent response:

```text
Completed Isporuka 1: all user-visible copy is normalized to Slovenian, mojibake is removed, backend-exposed messages match the same glossary, and automated tests now enforce the Slovenian baseline. No language switcher or translation infrastructure was introduced in this phase.
```

Expected:
- The handoff clearly states that the repo is now ready for Isporuka 2, where English and language switching can be added on top of a stable Slovenian source language.
