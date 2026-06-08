# Dual Language Delivery 2 Agent-Ready Implementation Plan

> Purpose: this plan is written so an AI agent can implement Delivery 2 end-to-end with minimal ambiguity.
> Scope: Slovenian remains default. English is optional and switchable. Public frontend, admin frontend, and backend-generated text must all follow the active language.
> Non-goal: do not redesign the app, rename technical identifiers, or introduce a heavyweight i18n library.

## 1. Delivery Goal

Implement production-ready dual-language support with these exact behaviors:

- Default language on first load is `sl`
- User can switch to `en`
- Selected language persists across refresh
- Public frontend reacts immediately to language changes
- Admin frontend reacts immediately to language changes
- Backend-generated route instructions and user-facing API errors respect `Accept-Language`
- Slovenian remains the fallback language whenever a translation is missing

Definition of done:

- public frontend build passes
- admin frontend build passes
- targeted backend tests pass
- frontend smoke/e2e verifies default `sl`, switch to `en`, and persistence
- no remaining user-facing hardcoded mixed-language copy in migrated surfaces

## 2. Constraints

- Keep the existing Delivery 1 Slovenian baseline as source-of-truth
- Do not translate internal IDs like `glavni_ulaz`, `izlaz_za_g3_objekat`, `ulaz_prezihova_ulica`
- Do not add `i18next`, `react-intl`, or similar libraries
- Do not split components into duplicated `Sl` and `En` versions
- Do not change API payload structure unless strictly necessary
- Prefer `Accept-Language` header over request-body `lang`
- Keep backend error `code` fields stable

## 3. Architecture Decision

Use a lightweight typed dictionary + provider pattern in both frontends, plus backend language resolution through `Accept-Language`.

This means:

- frontend public app has its own i18n runtime
- frontend admin app has its own i18n runtime
- both share the same language codes and same storage key
- backend resolves `sl` or `en` from request headers
- backend localizes generated text at service level

Rationale:

- smallest implementation surface
- easiest to test
- no dependency risk
- compatible with current codebase structure

## 4. Implementation Order

The agent must follow this order:

1. Create public frontend i18n infrastructure
2. Migrate public frontend UI copy
3. Add public language switcher and persistence
4. Send language through frontend API layer
5. Create admin i18n infrastructure
6. Migrate admin copy and add switcher
7. Add backend language resolution
8. Localize backend-generated route/share/error text
9. Update tests
10. Run verification

Do not start backend localization before frontend language propagation exists, because there would be no reliable caller language.

## 5. File Plan

### 5.1 Create

- `frontend/src/i18n/language.ts`
- `frontend/src/i18n/messages/sl.ts`
- `frontend/src/i18n/messages/en.ts`
- `frontend/src/i18n/messages/index.ts`
- `frontend/src/i18n/I18nProvider.tsx`
- `frontend/src/i18n/useI18n.ts`
- `frontend/src/i18n/runtimeLanguage.ts`
- `frontend/admin/src/i18n/language.ts`
- `frontend/admin/src/i18n/messages/sl.ts`
- `frontend/admin/src/i18n/messages/en.ts`
- `frontend/admin/src/i18n/messages/index.ts`
- `frontend/admin/src/i18n/I18nProvider.tsx`
- `frontend/admin/src/i18n/useI18n.ts`
- `frontend/admin/src/i18n/runtimeLanguage.ts`
- `backend/src/main/java/com/navigator/backend/i18n/AppLanguage.java`
- `backend/src/main/java/com/navigator/backend/i18n/AppLanguageResolver.java`
- `backend/src/main/java/com/navigator/backend/i18n/NavigationMessages.java`

### 5.2 Modify

- `frontend/src/main.tsx`
- `frontend/src/components/MainMenuOverlay.tsx`
- `frontend/src/components/SubPageHeader.tsx`
- `frontend/src/components/OverlayModal.tsx`
- `frontend/src/components/SpaceDetailsView.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/BuildingsPage.tsx`
- `frontend/src/pages/NavigationPage.tsx`
- `frontend/src/features/navigation/NavigationView.tsx`
- `frontend/src/features/navigation/SharePanel.tsx`
- `frontend/src/features/navigation/RoutePdf.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/services/catalogService.ts`
- `frontend/src/services/navigationService.ts`
- `frontend/src/utils/spaceDescription.ts`
- `frontend/src/utils/spaceTypeFilter.ts`
- `frontend/admin/src/main.tsx`
- `frontend/admin/src/AdminApp.tsx`
- `backend/src/main/java/com/navigator/backend/controller/NavigationController.java`
- `backend/src/main/java/com/navigator/backend/config/ApiExceptionHandler.java`
- `backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java`
- `backend/src/main/java/com/navigator/backend/service/NavigationShareService.java`
- `frontend/tests/app-smoke.spec.ts`
- `backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java`
- `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`

## 6. Public Frontend Implementation

### Task A: Create base language model

Create `frontend/src/i18n/language.ts` with:

- `SUPPORTED_LANGUAGES = ['sl', 'en'] as const`
- `type AppLanguage = 'sl' | 'en'`
- `DEFAULT_LANGUAGE = 'sl'`
- `APP_LANGUAGE_STORAGE_KEY = 'feri.navigator.language'`
- `isAppLanguage(value)` guard

Completion criteria:

- all public frontend i18n files import language types from one place

### Task B: Create typed dictionaries

Create `sl.ts` first, then `en.ts`.

Rule:

- `sl.ts` is the shape contract
- `en.ts` must match the exact same keys

Minimum groups:

- `common`
- `menu`
- `home`
- `buildings`
- `navigation`
- `share`
- `pdf`
- `errors`
- `filters`
- `spaceTypes`

Important:

- keep room/building proper nouns out of dictionaries unless they are true UI labels
- dictionary values must only be generic UI text

Completion criteria:

- every migrated component string has a home in the dictionary

### Task C: Create provider and hook

Provider responsibilities:

- initialize from `localStorage`
- fallback to `DEFAULT_LANGUAGE`
- persist on changes
- expose `language`, `setLanguage`, and `t()`
- update `runtimeLanguage.ts` whenever the selected language changes

Recommended `t()` shape:

```ts
t((m) => m.navigation.showRoute)
```

This avoids string path parsing and keeps typing simple.

Completion criteria:

- `frontend/src/main.tsx` wraps app with `I18nProvider`
- one simple component can read current language and translated text

### Task D: Add public language switch UI

Place the switcher in `MainMenuOverlay.tsx`.

Required behavior:

- visible labels for `Slovenščina` and `English`
- selected button uses `aria-pressed`
- switching updates UI immediately

Do not hide this behind settings for Delivery 2.

Completion criteria:

- a user can switch language from any public route via menu

### Task E: Migrate public components

Migrate in this order:

1. `MainMenuOverlay.tsx`
2. `SubPageHeader.tsx`
3. `OverlayModal.tsx`
4. `HomePage.tsx`
5. `BuildingsPage.tsx`
6. `NavigationPage.tsx`
7. `NavigationView.tsx`
8. `SharePanel.tsx`
9. `SpaceDetailsView.tsx`
10. `RoutePdf.tsx`

Migration rule:

- replace every user-visible literal with `t(...)`
- leave CSS class names, route names, and technical keys untouched

Things that must not remain hardcoded:

- headings
- placeholders
- button text
- helper messages
- empty states
- loading text
- share text
- close/back/copy actions

Completion criteria:

- public app UI visibly flips between `sl` and `en`

### Task F: Refactor helper-generated text

Review:

- `spaceDescription.ts`
- `spaceTypeFilter.ts`

If helper returns user-visible text, make it translation-aware by:

- passing `t()` into helper, or
- moving string assembly into component layer

Do not leave Slovenian hardcoded in utility functions after migration.

Completion criteria:

- no migrated helper returns fixed Slovenian UI text

## 7. API Layer Propagation

### Task G: Send active language automatically

Modify `frontend/src/services/api.ts`.

Required behavior:

- every request includes `Accept-Language`
- source language comes from `getRuntimeLanguage()`

Implementation note:

- do this once centrally
- do not add `language` arguments to every service unless unavoidable

Completion criteria:

- network layer always sends `sl` or `en`

### Task H: Remove service-level Slovenian leakage

Inspect:

- `catalogService.ts`
- `navigationService.ts`

If services currently inject Slovenian labels like `Učilnica`, convert them to:

- raw type codes
- or canonical keys mapped later in UI

Completion criteria:

- services return language-neutral data where possible

## 8. Admin Frontend Implementation

### Task I: Mirror i18n runtime in admin

Create the same structure under `frontend/admin/src/i18n`.

Rules:

- same storage key as public app
- same language codes
- same default `sl`

Wrap admin root with `I18nProvider`.

Completion criteria:

- admin can read and change the current language independently of public app runtime, but shares persisted choice

### Task J: Add admin language switcher

Place switcher in a top-level visible section of `AdminApp.tsx`.

Required:

- `SL` and `EN` buttons or full labels
- immediate visual switch
- persistence through refresh

Completion criteria:

- admin operator can change language without deep navigation

### Task K: Migrate admin copy

Replace user-facing literals in `AdminApp.tsx`, especially:

- button labels
- tool labels
- alerts
- loading errors
- panel titles
- mode labels

Completion criteria:

- admin UI flips between `sl` and `en`

## 9. Backend Implementation

### Task L: Add backend language model

Create:

- `AppLanguage.java`
- `AppLanguageResolver.java`

Rules:

- any header beginning with `en` resolves to `EN`
- everything else resolves to `SL`

Completion criteria:

- backend can resolve request language deterministically

### Task M: Centralize localized backend messages

Create `NavigationMessages.java`.

It must own:

- route instruction phrases
- share-related messages
- user-facing error text for navigation/share flows

Required methods should cover:

- continue toward location
- arrive at location
- elevator/stairs floor transfer
- no route
- location missing / invalid
- share not found / expired / invalid

Completion criteria:

- services no longer contain scattered hardcoded bilingual text

### Task N: Thread language through controller and services

Modify `NavigationController.java`:

- read `Accept-Language`
- resolve `AppLanguage`
- pass language into service methods

Modify `NavigationRouteService.java` and `NavigationShareService.java`:

- accept `AppLanguage language`
- use `NavigationMessages`

Completion criteria:

- backend-generated text follows request language

### Task O: Keep humanizer bilingual-safe

Current code already has fallback label humanization logic.

Required final behavior:

- old technical labels like `izlaz_za_g3_objekat` become natural Slovenian in `sl`
- same labels become natural English in `en`
- fallback must not produce mixed-language phrases

This is important for routes where display names are missing.

Completion criteria:

- route tests for fallback-generated labels pass in both languages

## 10. Testing Plan

### Task P: Public frontend e2e

Update `frontend/tests/app-smoke.spec.ts`.

Add tests for:

- first load defaults to Slovenian
- switch to English from menu
- page refresh preserves English
- navigation screen labels update in English

Required assertions must avoid brittle CSS selectors where possible.

Completion criteria:

- one test proves default language
- one test proves switch and persistence

### Task Q: Backend language tests

Update:

- `NavigationControllerTest.java`
- `NavigationRouteServiceTest.java`

Add:

- Slovenian request expectations
- English request expectations
- fallback label generation expectations

Completion criteria:

- tests cover both `sl` and `en` outputs

### Task R: Admin verification

If there is no separate admin e2e harness, verify through:

- admin build
- at least one deterministic component-level or smoke check if possible

Minimum acceptance:

- admin build succeeds
- visible admin labels are dictionary-driven

## 11. Verification Commands

Run in this order:

### Public frontend

Workdir: `frontend`

```powershell
npm.cmd run lint
npm.cmd run build
```

Then:

```powershell
npm.cmd run test:e2e
```

If Playwright teardown hangs but tests pass, report that explicitly and include the pass count.

### Admin frontend

Workdir: `frontend/admin`

```powershell
npm.cmd run build
```

### Backend

Workdir: `backend`

```powershell
.\mvnw.cmd test
```

If network/sandbox blocks Maven, rerun with approval and report exact reason.

## 12. Failure Handling Rules

If a checkpoint fails:

- stop changing unrelated files
- inspect the exact failing component/service/test
- fix the root cause before continuing

If backend fallback text still leaks Serbian identifiers:

- fix `NavigationRouteService` humanization or message assembly
- do not patch tests to accept mixed-language output

If English text is missing:

- add missing key to `en.ts`
- do not silently fallback in a way that hides incomplete migration during review

If admin migration becomes too large:

- still keep it in Delivery 2
- split internal execution into smaller tasks, but do not defer admin language support out of scope

## 13. Final Audit

Run grep on migrated code to ensure user-facing strings are not left scattered:

```powershell
rg -n "Domov|Navigacija|Začetna lokacija|Ciljna lokacija|Prikaži pot|Slovenščina|English|Share|Deli|Close|Zapri" frontend/src frontend/admin/src backend/src/main
```

Expected result:

- most hits are inside dictionary files
- remaining hits outside dictionaries should be intentional tests or backend message definitions

Also run:

```powershell
git diff -- frontend/src frontend/admin/src backend/src/main frontend/tests backend/src/test
```

Review for:

- no unrelated refactors
- no accidental route/path changes
- no mutation of technical identifiers used for joins/relations

## 14. Final Handoff Format

Agent final summary should state:

- dual-language support implemented
- default `sl`
- switchable `en`
- persistence added
- backend-generated text localized via `Accept-Language`
- admin included
- any residual known issue such as Playwright teardown hang

Exact style target:

`Completed Isporuka 2: Slovenian remains the default language, English can be selected and is persisted, and both frontend apps plus backend-generated navigation/share/error text now follow the active language.`
