# Dual Language Delivery 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add production-ready dual-language support with Slovenian as the default language and English as the optional secondary language across the user-facing frontend, admin frontend, and backend-generated navigation/error messages.

**Architecture:** Keep Slovenian as the source baseline from Delivery 1 and layer English on top through explicit translation dictionaries. The two React apps remain separate builds, so each app gets its own lightweight i18n runtime, but both use the same language model (`sl`/`en`) and the same browser storage key for persistence. For backend-generated route instructions and API error messages, frontend requests carry the active language via `Accept-Language`, and backend services localize messages before returning them.

**Tech Stack:** React 19 + TypeScript + Vite frontend, React admin frontend, Spring Boot backend, Playwright e2e tests, Maven/JUnit backend tests, localStorage persistence, HTTP `Accept-Language` propagation

---

## File Structure

**Create**
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

**Modify**
- `frontend/src/main.tsx`
- `frontend/src/app/App.tsx`
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
- `frontend/src/utils/spaceDescription.ts`
- `frontend/src/utils/spaceTypeFilter.ts`
- `frontend/src/utils/displayNames.ts`
- `frontend/src/services/api.ts`
- `frontend/src/services/catalogService.ts`
- `frontend/src/services/navigationService.ts`
- `frontend/admin/src/main.tsx`
- `frontend/admin/src/AdminApp.tsx`
- `frontend/admin/src/config.ts`
- `backend/src/main/java/com/navigator/backend/controller/NavigationController.java`
- `backend/src/main/java/com/navigator/backend/config/ApiExceptionHandler.java`
- `backend/src/main/java/com/navigator/backend/service/NavigationRouteException.java`
- `backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java`
- `backend/src/main/java/com/navigator/backend/service/NavigationShareService.java`
- `frontend/tests/app-smoke.spec.ts`
- `backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java`
- `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`

## Guardrails

- Do not replace the Delivery 1 Slovenian baseline; Slovenian remains the default language and the fallback source of truth.
- Do not translate database-owned proper nouns such as building names, room codes, and space display names unless the backend already stores localized values.
- Do not add a heavyweight i18n library. Use a small typed dictionary + provider approach to minimize moving parts.
- Do not localize by branching entire components into `if (lang === 'en')`; localize through translation keys.
- Do not change API payload shapes unless necessary for localization. Prefer `Accept-Language` over adding `lang` fields to every request body.
- Backend error `code` values must stay stable even if message text changes by language.

### Task 1: Build the main frontend i18n foundation

**Files:**
- Create: `frontend/src/i18n/language.ts`
- Create: `frontend/src/i18n/messages/sl.ts`
- Create: `frontend/src/i18n/messages/en.ts`
- Create: `frontend/src/i18n/messages/index.ts`
- Create: `frontend/src/i18n/I18nProvider.tsx`
- Create: `frontend/src/i18n/useI18n.ts`
- Create: `frontend/src/i18n/runtimeLanguage.ts`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Define the language model and storage contract**

Create `frontend/src/i18n/language.ts` with:

```ts
export const APP_LANGUAGE_STORAGE_KEY = 'feri.navigator.language';

export const SUPPORTED_LANGUAGES = ['sl', 'en'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = 'sl';

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === 'sl' || value === 'en';
}
```

Expected:
- The entire frontend has one canonical type for the active language.
- Slovenian is explicitly encoded as the default, not inferred.

- [ ] **Step 2: Create the typed message dictionaries**

Create `frontend/src/i18n/messages/sl.ts` with the Slovenian baseline keys and values, for example:

```ts
export const sl = {
  common: {
    close: 'Zapri',
    back: 'Nazaj',
    share: 'Deli',
    copy: 'Kopiraj',
  },
  menu: {
    home: 'Domov',
    buildings: 'Vsi objekti',
    navigation: 'Navigacija',
    languageLabel: 'Jezik',
    languageSl: 'Slovenščina',
    languageEn: 'English',
  },
  navigation: {
    startLabel: 'Začetna lokacija',
    targetLabel: 'Ciljna lokacija',
    showRoute: 'Prikaži pot',
    allowElevator: 'Uporabi dvigalo',
  },
} as const;
```

Create `frontend/src/i18n/messages/en.ts` with the exact same key structure:

```ts
export const en = {
  common: {
    close: 'Close',
    back: 'Back',
    share: 'Share',
    copy: 'Copy',
  },
  menu: {
    home: 'Home',
    buildings: 'All buildings',
    navigation: 'Navigation',
    languageLabel: 'Language',
    languageSl: 'Slovenian',
    languageEn: 'English',
  },
  navigation: {
    startLabel: 'Start location',
    targetLabel: 'Destination',
    showRoute: 'Show route',
    allowElevator: 'Use elevator',
  },
} as const;
```

Create `frontend/src/i18n/messages/index.ts`:

```ts
import { en } from './en';
import { sl } from './sl';

export const messages = { sl, en } as const;
export type MessageTree = typeof sl;
```

Expected:
- Slovenian and English dictionaries are key-for-key compatible.
- `sl` becomes the type contract the English dictionary must satisfy.

- [ ] **Step 3: Create provider, hook, and runtime language bridge**

Create `frontend/src/i18n/runtimeLanguage.ts`:

```ts
import { DEFAULT_LANGUAGE, type AppLanguage } from './language';

let runtimeLanguage: AppLanguage = DEFAULT_LANGUAGE;

export function setRuntimeLanguage(language: AppLanguage) {
  runtimeLanguage = language;
}

export function getRuntimeLanguage(): AppLanguage {
  return runtimeLanguage;
}
```

Create `frontend/src/i18n/I18nProvider.tsx` and `frontend/src/i18n/useI18n.ts` with:

```tsx
type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (selector: (messages: MessageTree) => string) => string;
};

// Provider loads from localStorage, falls back to DEFAULT_LANGUAGE,
// persists updates, and calls setRuntimeLanguage(language) on changes.
```

Wrap the root in `frontend/src/main.tsx`:

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>
);
```

Expected:
- Any frontend component can read `language`, `setLanguage`, and `t(...)`.
- The active language is available to services through `runtimeLanguage.ts`.

- [ ] **Step 4: Verify the foundation builds before migration**

Run:

```powershell
npm.cmd run lint
npm.cmd run build
```

Workdir:

```text
frontend
```

Expected:
- The new i18n infrastructure compiles even before all components are migrated.

### Task 2: Migrate the main frontend to translation keys and add the language switcher

**Files:**
- Modify: `frontend/src/components/MainMenuOverlay.tsx`
- Modify: `frontend/src/components/SubPageHeader.tsx`
- Modify: `frontend/src/components/OverlayModal.tsx`
- Modify: `frontend/src/components/SpaceDetailsView.tsx`
- Modify: `frontend/src/pages/HomePage.tsx`
- Modify: `frontend/src/pages/BuildingsPage.tsx`
- Modify: `frontend/src/pages/NavigationPage.tsx`
- Modify: `frontend/src/features/navigation/NavigationView.tsx`
- Modify: `frontend/src/features/navigation/SharePanel.tsx`
- Modify: `frontend/src/features/navigation/RoutePdf.tsx`
- Modify: `frontend/src/utils/spaceDescription.ts`
- Modify: `frontend/src/utils/spaceTypeFilter.ts`
- Modify: `frontend/src/utils/displayNames.ts`

- [ ] **Step 1: Add the main-app language switcher to the menu**

Modify `frontend/src/components/MainMenuOverlay.tsx` to use `useI18n()` and render a two-button language control inside the menu panel:

```tsx
const { language, setLanguage, t } = useI18n();

<div className={styles.languageSection}>
  <span className={styles.languageLabel}>{t((m) => m.menu.languageLabel)}</span>
  <div className={styles.languageButtons}>
    <button
      type="button"
      aria-pressed={language === 'sl'}
      onClick={() => setLanguage('sl')}
    >
      {t((m) => m.menu.languageSl)}
    </button>
    <button
      type="button"
      aria-pressed={language === 'en'}
      onClick={() => setLanguage('en')}
    >
      {t((m) => m.menu.languageEn)}
    </button>
  </div>
</div>
```

Expected:
- The main frontend exposes a language toggle reachable from every page via the menu.
- The switcher updates the active language immediately.

- [ ] **Step 2: Replace hardcoded main-app copy with dictionary selectors**

For each migrated component, replace literal text with `t(...)` calls. Example targets:

```tsx
// HomePage.tsx
aria-label={t((m) => m.menu.openMenu)}
placeholder={t((m) => m.search.homePlaceholder)}
<h2>{t((m) => m.search.resultsTitle)}</h2>

// NavigationView.tsx
label={t((m) => m.navigation.startLabel)}
placeholder={t((m) => m.navigation.startPlaceholder)}
{isRouting ? t((m) => m.navigation.calculating) : t((m) => m.navigation.showRoute)}

// SharePanel.tsx
{copied ? t((m) => m.share.copied) : t((m) => m.common.copy)}
```

Expected:
- The main app no longer contains user-facing hardcoded Slovenian strings except dictionary files.
- Switching languages changes the visible UI text without reloading.

- [ ] **Step 3: Localize utility-generated labels**

Refactor helper outputs that currently return localized Slovenian text directly:

```ts
// spaceTypeFilter.ts
export function getSpaceTypeFilters(t: (selector: (messages: MessageTree) => string) => string) {
  return [
    { key: 'all', label: t((m) => m.filters.all) },
    { key: 'classroom', label: t((m) => m.filters.classrooms) },
  ];
}
```

For `spaceDescription.ts`, stop embedding fixed Slovenian prose in a static helper. Either:

1. Move the sentence assembly into the component where `t(...)` is available, or
2. Change the helper signature to accept translation callbacks and pretranslated fragments.

Expected:
- No helper produces fixed Slovenian copy internally if the output is user-visible text.

- [ ] **Step 4: Localize generated PDF labels**

Modify `RoutePdf.tsx` so labels like `Začetek`, `Cilj`, `Nadstropja`, `Natisnjeno`, and step chips are passed in from translated strings rather than hardcoded.

Recommended shape:

```tsx
type RoutePdfCopy = {
  printedAt: string;
  start: string;
  destination: string;
  floors: string;
  stepSingular: string;
  stepDual: string;
  stepPlural: string;
};
```

Expected:
- Exported route PDFs reflect the active language as well.

- [ ] **Step 5: Verify main frontend localization**

Run:

```powershell
npm.cmd run lint
npm.cmd run build
```

Workdir:

```text
frontend
```

Expected:
- The main frontend builds cleanly after translation migration.

### Task 3: Propagate the active language through frontend services

**Files:**
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/services/catalogService.ts`
- Modify: `frontend/src/services/navigationService.ts`
- Modify: `frontend/src/i18n/runtimeLanguage.ts`

- [ ] **Step 1: Make `apiFetch` send the active language**

Modify `frontend/src/services/api.ts`:

```ts
import { getRuntimeLanguage } from '../i18n/runtimeLanguage';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const language = getRuntimeLanguage();

  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'Accept-Language': language,
      ...(init?.headers ?? {}),
    },
  });
  // existing error handling stays here
}
```

Expected:
- All existing API calls automatically carry `sl` or `en` without changing every caller.

- [ ] **Step 2: Remove hardcoded Slovenian type-label translation from service mappers**

`frontend/src/services/catalogService.ts` currently hardcodes Slovenian labels in `SPACE_TYPE_LABELS`. Replace that with language-neutral values from the backend (`classroom`, `laboratory`, etc.) or canonical keys that the UI can translate later.

Target direction:

```ts
function mapLocationToCatalogSpace(location: NavigationLocation): CatalogSpace {
  return {
    // ...
    type: location.locationType,
  };
}
```

Expected:
- Services stop baking Slovenian text into returned UI models.
- UI components own the final language mapping.

- [ ] **Step 3: Keep navigation/share services contract-stable**

Do not add `lang` to every service method signature unless required. Because `apiFetch` sends `Accept-Language`, these should stay close to current shape:

```ts
export async function fetchRoute(input: {
  fromLocationId: number;
  toLocationId?: number;
  targetType?: string;
  allowElevator?: boolean;
}) {
  // unchanged call shape
}
```

Expected:
- Feature rollout touches language propagation once in `apiFetch`, not N times across services.

### Task 4: Add the admin frontend i18n layer and switcher

**Files:**
- Create: `frontend/admin/src/i18n/language.ts`
- Create: `frontend/admin/src/i18n/messages/sl.ts`
- Create: `frontend/admin/src/i18n/messages/en.ts`
- Create: `frontend/admin/src/i18n/messages/index.ts`
- Create: `frontend/admin/src/i18n/I18nProvider.tsx`
- Create: `frontend/admin/src/i18n/useI18n.ts`
- Create: `frontend/admin/src/i18n/runtimeLanguage.ts`
- Modify: `frontend/admin/src/main.tsx`
- Modify: `frontend/admin/src/AdminApp.tsx`

- [ ] **Step 1: Mirror the lightweight i18n runtime for admin**

Recreate the same pattern from Task 1 under `frontend/admin/src/i18n`, reusing:

```ts
APP_LANGUAGE_STORAGE_KEY = 'feri.navigator.language'
DEFAULT_LANGUAGE = 'sl'
SUPPORTED_LANGUAGES = ['sl', 'en'] as const
```

Wrap `AdminApp` in the provider from `frontend/admin/src/main.tsx`.

Expected:
- Admin and main frontend remember the same selected language through the same storage key.

- [ ] **Step 2: Add an admin-visible language switcher**

Place the switcher near the existing top controls or sidebar in `AdminApp.tsx`, not hidden in a deep modal. The switcher should be visible without extra clicks so admin users can validate translations quickly.

Suggested UI block:

```tsx
<div className="language-switcher">
  <span>{t((m) => m.common.language)}</span>
  <button aria-pressed={language === 'sl'} onClick={() => setLanguage('sl')}>SL</button>
  <button aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
</div>
```

Expected:
- Admin users can switch language from the main editor screen.

- [ ] **Step 3: Migrate admin copy and notices**

Replace admin literals such as:

```tsx
'Premakni / izberi'
'Dodaj vozlišče'
'Ni mogoče naložiti admin urejevalnika.'
'Predogled poti'
'Išči lokacijo'
```

with dictionary-backed `t(...)` selectors.

Expected:
- Admin UI text changes live with the selected language.
- Admin notices, alerts, and button labels all use the same dictionaries.

- [ ] **Step 4: Verify admin localization**

Run:

```powershell
npm.cmd run build
```

Workdir:

```text
frontend/admin
```

Expected:
- Admin build passes with the new provider and translated UI.

### Task 5: Localize backend-generated navigation and error messages

**Files:**
- Create: `backend/src/main/java/com/navigator/backend/i18n/AppLanguage.java`
- Create: `backend/src/main/java/com/navigator/backend/i18n/AppLanguageResolver.java`
- Create: `backend/src/main/java/com/navigator/backend/i18n/NavigationMessages.java`
- Modify: `backend/src/main/java/com/navigator/backend/controller/NavigationController.java`
- Modify: `backend/src/main/java/com/navigator/backend/config/ApiExceptionHandler.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/NavigationRouteException.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/NavigationRouteService.java`
- Modify: `backend/src/main/java/com/navigator/backend/service/NavigationShareService.java`

- [ ] **Step 1: Introduce backend language resolution with Slovenian fallback**

Create `AppLanguage.java`:

```java
public enum AppLanguage {
  SL,
  EN;

  public static AppLanguage fromHeader(String value) {
    if (value == null) return SL;
    String lowered = value.toLowerCase(Locale.ROOT);
    if (lowered.startsWith("en")) return EN;
    return SL;
  }
}
```

Create `AppLanguageResolver.java`:

```java
@Component
public class AppLanguageResolver {
  public AppLanguage resolve(HttpServletRequest request) {
    return AppLanguage.fromHeader(request.getHeader("Accept-Language"));
  }
}
```

Expected:
- Backend can deterministically resolve `sl` or `en` for every request.

- [ ] **Step 2: Replace string literals with message helper calls**

Create `NavigationMessages.java` with methods like:

```java
public String noRoute(AppLanguage language) { ... }
public String invalidTarget(AppLanguage language) { ... }
public String continueTowards(AppLanguage language, String label) { ... }
public String arrivedAt(AppLanguage language, String label) { ... }
public String elevatorEnter(AppLanguage language, String floorLabel) { ... }
```

Then refactor `NavigationRouteService` and `NavigationShareService` to use those methods instead of hardcoded message strings.

Expected:
- Backend has one authoritative place for localized navigation/error copy.
- English support is not scattered across controller/service classes.

- [ ] **Step 3: Thread the resolved language into service methods**

Modify controller methods to resolve the language and pass it through:

```java
public ResponseEntity<RouteResponseDto> getRoute(...) {
  AppLanguage language = languageResolver.resolve(request);
  RouteResponseDto route =
      navigationRouteService.route(fromLocationId, toLocationId, targetType, allowElevator, language);
  return ResponseEntity.ok(route);
}
```

Adjust service signatures accordingly:

```java
public RouteResponseDto route(..., AppLanguage language)
public NavigationShareDto.CreateResponse createShare(..., AppLanguage language)
public NavigationLocationDto getLocation(Long locationId, AppLanguage language)
```

Expected:
- The resolved language is explicit in the call graph and testable.

- [ ] **Step 4: Keep exception codes stable while localizing messages**

Update `NavigationRouteException` usage only at message-creation sites. Keep this invariant:

```java
new NavigationRouteException(HttpStatus.NOT_FOUND, "NO_ROUTE", localizedMessage)
```

Do not change `code` values such as `NO_ROUTE`, `LOCATION_NOT_FOUND`, `SHARE_NOT_FOUND`.

Expected:
- Frontend logic that keys off error codes stays intact.
- Only the human-readable text changes by language.

- [ ] **Step 5: Verify backend localization compile path**

Run:

```powershell
.\mvnw.cmd test
```

Workdir:

```text
backend
```

Expected:
- Backend compiles with the new language-aware method signatures and message helper.

### Task 6: Extend automated tests for both languages

**Files:**
- Modify: `frontend/tests/app-smoke.spec.ts`
- Modify: `backend/src/test/java/com/navigator/backend/controller/NavigationControllerTest.java`
- Modify: `backend/src/test/java/com/navigator/backend/service/NavigationRouteServiceTest.java`

- [ ] **Step 1: Add frontend smoke tests for default Slovenian**

Preserve the existing baseline checks and explicitly assert the default language:

```ts
await page.goto('/');
await expect(page.getByPlaceholder('Išči učilnico, laboratorij ali pisarno')).toBeVisible();
await expect(page.getByRole('button', { name: 'Domov' })).toHaveCount(0);
```

Expected:
- Delivery 1 behavior remains intact on first load.

- [ ] **Step 2: Add frontend smoke tests for switching to English**

Add tests that:

1. Open the menu
2. Switch to English
3. Assert visible English labels
4. Refresh and confirm the language persists

Example:

```ts
await page.goto('/');
await page.getByLabel('Odpri meni').click();
await page.getByRole('button', { name: 'English' }).click();
await expect(page.getByPlaceholder('Search for a classroom, lab, or office')).toBeVisible();
await page.reload();
await expect(page.getByPlaceholder('Search for a classroom, lab, or office')).toBeVisible();
```

Expected:
- Main app translation and persistence are covered end-to-end.

- [ ] **Step 3: Add admin language-switch smoke coverage**

If no admin Playwright suite exists yet, add one minimal spec in the admin app or expand current verification so that:

```text
default = Slovenian
switch to English = visible admin controls change
refresh = English persists
```

Expected:
- Admin language switching is validated, not assumed.

- [ ] **Step 4: Add backend tests for Slovenian vs English messages**

In `NavigationControllerTest.java`, add two request cases with different `Accept-Language` headers:

```java
mockMvc.perform(get("/api/navigation/route")
    .header("Accept-Language", "sl")
    ...)
  .andExpect(jsonPath("$.message").value("Za izbrani lokaciji še ni vnesene poti."));

mockMvc.perform(get("/api/navigation/route")
    .header("Accept-Language", "en")
    ...)
  .andExpect(jsonPath("$.message").value("No route has been entered yet for the selected locations."));
```

In `NavigationRouteServiceTest.java`, add assertions for English route steps such as:

```java
assertEquals("Continue toward Alpha.", result.getSegments().get(0).getSteps().get(0).getText());
assertEquals("You have arrived at Alpha.", result.getSegments().get(0).getSteps().get(1).getText());
```

Expected:
- Backend localization is tested independently from frontend rendering.

- [ ] **Step 5: Run the complete verification suite**

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

Then run:

```powershell
npm.cmd run build
```

Workdir:

```text
frontend/admin
```

Then run:

```powershell
.\mvnw.cmd test
```

Workdir:

```text
backend
```

Expected:
- Both frontends build cleanly.
- Frontend e2e covers both languages.
- Backend tests validate localized messages and instructions.

### Task 7: Final regression sweep and handoff for Delivery 2

**Files:**
- Modify if needed: any touched files above

- [ ] **Step 1: Re-run language debt audit**

Run:

```powershell
rg -n "Domov|Vsi objekti|Navigacija|Začetna lokacija|Ciljna lokacija|Prikaži pot|Išči učilnico|Ni rezultatov|Premakni / izberi|Predogled poti|Za izbrani lokaciji še ni vnesene poti" frontend/src frontend/admin/src backend/src/main/java
```

Expected:
- Hits should appear mostly inside `sl.ts` dictionaries or deliberate Slovenian test fixtures, not as random hardcoded UI strings.

- [ ] **Step 2: Confirm English keys exist for all migrated text**

Run:

```powershell
Get-Content frontend\src\i18n\messages\sl.ts
Get-Content frontend\src\i18n\messages\en.ts
Get-Content frontend\admin\src\i18n\messages\sl.ts
Get-Content frontend\admin\src\i18n\messages\en.ts
```

Expected:
- Every Slovenian message key used by code has an English counterpart.
- No placeholder English values like `TODO_TRANSLATE` remain.

- [ ] **Step 3: Review the working tree diff**

Run:

```bash
git diff -- frontend/src frontend/admin/src backend/src/main/java frontend/tests backend/src/test docs/superpowers/plans
```

Expected:
- The diff shows i18n plumbing, dictionary files, service propagation, and tests.
- No unrelated redesign or behavioral refactor is mixed into this delivery.

- [ ] **Step 4: Write the final handoff summary**

Use this summary shape in the final response:

```text
Completed Isporuka 2: the app now defaults to Slovenian, supports English switching, persists the selected language across both frontend apps, and localizes backend-generated navigation/error messages through Accept-Language. Delivery 1 Slovenian baseline remains the source fallback.
```

Expected:
- The handoff clearly marks Delivery 2 as the dual-language layer built on top of the Delivery 1 baseline.
