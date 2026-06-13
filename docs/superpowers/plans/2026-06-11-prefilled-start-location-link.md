# Prefilled Start Location Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support links such as `/?fromLocationId=11` that open the home page and preserve that start location until the user selects a destination and enters navigation.

**Architecture:** Keep this feature frontend-only. `HomePage` reads and validates the optional query parameter, carries the numeric ID through its existing router state, and passes it to `NavigationPage`; `NavigationView` resolves the ID through the existing `GET /api/navigation/locations/{id}` service and preselects the start field. Invalid, missing, or unavailable locations are ignored without blocking the normal navigation flow.

**Tech Stack:** React 19, TypeScript, React Router, existing navigation API service, Playwright

---

## Scope And Constraints

- The supported public link format is `/?fromLocationId=<positive navigation location ID>`.
- The link opens the existing home page; it does not display a confirmation banner.
- The selected start location must survive both home-page destination actions:
  - the inline **Poišči učilnico** button;
  - opening a space detail and then selecting **Poišči učilnico**.
- The destination remains user-selected.
- Existing complete-route sharing through `/share/:shareCode` remains unchanged.
- No QR generation UI is added. Any external QR generator can encode the supported URL.
- No backend endpoint, DTO, database table, or migration changes are required.
- Do not commit, push, or open a pull request unless the user explicitly requests it during execution.

## File Map

**Modify:**
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/NavigationPage.tsx`
- `frontend/src/features/navigation/NavigationView.tsx`
- `frontend/tests/app-smoke.spec.ts`
- `docs/user-guide.md`
- `docs/frontend.md`

**Reuse without modification unless implementation reveals a defect:**
- `frontend/src/services/navigationService.ts`
  - already exports `fetchLocation(locationId)`
- `frontend/src/types/navigation.ts`
  - already defines `NavigationLocation`
- `frontend/src/app/AppRouter.tsx`
  - already routes `/` to `HomePage` and `/navigacija` to `NavigationPage`

**Do not modify:**
- backend route/share services;
- Flyway migrations;
- `SharePanel.tsx`;
- `/share/:shareCode` behavior.

---

### Task 1: Add failing Playwright coverage for the start-location link

**Files:**
- Modify: `frontend/tests/app-smoke.spec.ts`

- [ ] **Step 1: Make the navigation-location mock support lookup by ID**

Replace the existing `**/api/navigation/locations**` mock in `test.beforeEach` with a pathname-aware response:

```ts
await page.route('**/api/navigation/locations**', async (route) => {
  const requestUrl = new URL(route.request().url());
  const locationMatch = requestUrl.pathname.match(/^\/api\/navigation\/locations\/(\d+)$/);

  if (locationMatch) {
    const locationId = Number(locationMatch[1]);
    const location = locations.find((item) => item.id === locationId);

    if (!location) {
      await route.fulfill({
        status: 404,
        json: {
          code: 'LOCATION_NOT_FOUND',
          message: 'Location not found.',
        },
      });
      return;
    }

    await route.fulfill({ json: location });
    return;
  }

  await route.fulfill({ json: locations });
});
```

- [ ] **Step 2: Add a failing test for the inline home-page action**

Add this test after the existing home-page target-prefill test:

```ts
test('home start-location link prefills start after destination selection', async ({ page }) => {
  await page.goto('/?fromLocationId=11');
  await page.locator('[data-testid="space-results"]').waitFor();

  await page.getByRole('button', { name: /Poi.*ilnico/i }).click();

  await expect(page).toHaveURL(/\/navigacija$/);
  await expect(page.locator('#start-location')).toHaveValue(/Glavni vhod/);
  await expect(page.locator('#target-location')).toHaveValue('Alfa');
});
```

- [ ] **Step 3: Add a failing test for the detail-page action**

Add a second regression test:

```ts
test('home start-location link survives opening destination details', async ({ page }) => {
  await page.goto('/?fromLocationId=11');
  await page.locator('[data-testid="space-results"]').waitFor();

  await page.getByText('Alfa').click();
  await page.getByRole('button', { name: /Poi.*ilnico/i }).click();

  await expect(page).toHaveURL(/\/navigacija$/);
  await expect(page.locator('#start-location')).toHaveValue(/Glavni vhod/);
  await expect(page.locator('#target-location')).toHaveValue('Alfa');
});
```

- [ ] **Step 4: Add a failing test for an invalid or unavailable ID**

The normal destination flow must remain usable:

```ts
test('invalid home start-location link is ignored', async ({ page }) => {
  await page.goto('/?fromLocationId=999');
  await page.locator('[data-testid="space-results"]').waitFor();

  await page.getByRole('button', { name: /Poi.*ilnico/i }).click();

  await expect(page).toHaveURL(/\/navigacija$/);
  await expect(page.locator('#start-location')).toHaveValue('');
  await expect(page.locator('#target-location')).toHaveValue('Alfa');
});
```

- [ ] **Step 5: Run only the new tests and verify RED**

Run from `frontend/`:

```powershell
npm.cmd run test:e2e -- tests/app-smoke.spec.ts --grep "start-location link"
```

Expected: the valid-link tests fail because `fromLocationId` is not propagated or loaded yet. The invalid-ID test may already pass and serves as a regression guard.

---

### Task 2: Preserve the start-location ID through the home-page flow

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`
- Test: `frontend/tests/app-smoke.spec.ts`

- [ ] **Step 1: Extend the existing home-page router state**

Change the state type to:

```ts
type HomePageState = {
  selectedSpace?: CatalogSpace;
  fromLocationId?: number;
};
```

- [ ] **Step 2: Parse only positive integer IDs from the home-page URL**

Immediately after reading `state`, add:

```ts
const fromLocationIdParam = new URLSearchParams(location.search).get('fromLocationId');
const parsedFromLocationId =
  fromLocationIdParam && /^\d+$/.test(fromLocationIdParam)
    ? Number(fromLocationIdParam)
    : undefined;
const fromLocationId =
  state?.fromLocationId ??
  (parsedFromLocationId && parsedFromLocationId > 0 ? parsedFromLocationId : undefined);
```

This rejects empty values, decimals, negative numbers, and non-numeric strings before any API request can be triggered.

- [ ] **Step 3: Preserve the ID when opening a space detail**

Change `openSpace` to:

```ts
const openSpace = (space: CatalogSpace) => {
  navigate('/', {
    state: {
      selectedSpace: space,
      fromLocationId,
    } satisfies HomePageState,
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

- [ ] **Step 4: Pass the ID when entering navigation**

Change `openNavigation` to:

```ts
const openNavigation = (space: CatalogSpace) => {
  navigate('/navigacija', {
    state: {
      initialTarget: getCatalogSpaceLabel(space),
      initialFromLocationId: fromLocationId,
    },
  });
};
```

- [ ] **Step 5: Run the focused tests**

Run from `frontend/`:

```powershell
npm.cmd run test:e2e -- tests/app-smoke.spec.ts --grep "start-location link"
```

Expected: valid-link tests still fail because `NavigationPage` and `NavigationView` do not consume `initialFromLocationId`; the ID is now present in router state.

---

### Task 3: Resolve and preselect the linked start location

**Files:**
- Modify: `frontend/src/pages/NavigationPage.tsx`
- Modify: `frontend/src/features/navigation/NavigationView.tsx`
- Test: `frontend/tests/app-smoke.spec.ts`

- [ ] **Step 1: Extend the navigation-page state contract**

Change `NavigationPageState` to:

```ts
type NavigationPageState = {
  initialTarget?: string;
  initialFromLocationId?: number;
};
```

- [ ] **Step 2: Pass the optional ID into `NavigationView`**

Add this prop alongside `initialTarget`:

```tsx
<NavigationView
  initialTarget={sharedRoute ? sharedInitialTarget : (state?.initialTarget ?? '')}
  initialFromLocationId={sharedRoute ? undefined : state?.initialFromLocationId}
  sharedFromLocationId={sharedRoute?.fromLocationId}
  sharedToLocationId={sharedRoute?.toLocationId}
  sharedTargetType={sharedRoute?.targetType}
  sharedAllowElevator={sharedRoute?.allowElevator}
/>
```

The `sharedRoute` guard prevents the new start-only flow from interfering with complete-route share resolution.

- [ ] **Step 3: Add the new prop and reuse the existing location service**

In `NavigationView.tsx`, update the service import:

```ts
import { createShare, fetchLocation, fetchRoute } from '../../services/navigationService';
```

Extend the props:

```ts
type NavigationViewProps = {
  initialTarget: string;
  initialFromLocationId?: number;
  sharedFromLocationId?: number;
  sharedToLocationId?: number;
  sharedTargetType?: string;
  sharedAllowElevator?: boolean;
};
```

Destructure `initialFromLocationId` in the component arguments.

- [ ] **Step 4: Resolve the start location with cancellation and silent fallback**

Add this effect before the existing complete-share effect:

```ts
useEffect(() => {
  if (!initialFromLocationId || sharedFromLocationId) {
    return;
  }

  let cancelled = false;

  const resolveInitialFromLocation = async () => {
    try {
      const location = await fetchLocation(initialFromLocationId);
      if (cancelled) {
        return;
      }

      const label = getLocalizedNavigationLocationLabel(location, language);
      setFromLocation(location);
      setFromQuery(label);
      prevFromQueryRef.current = label;
    } catch {
      if (!cancelled) {
        setFromLocation(null);
        setFromQuery('');
        prevFromQueryRef.current = '';
      }
    }
  };

  void resolveInitialFromLocation();

  return () => {
    cancelled = true;
  };
}, [initialFromLocationId, language, sharedFromLocationId]);
```

The failure path intentionally shows no banner because the agreed behavior is to ignore an unusable start-location link and leave the form usable.

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run from `frontend/`:

```powershell
npm.cmd run test:e2e -- tests/app-smoke.spec.ts --grep "start-location link"
```

Expected: all three start-location link tests pass.

- [ ] **Step 6: Run the existing navigation prefill tests**

Run:

```powershell
npm.cmd run test:e2e -- tests/app-smoke.spec.ts --grep "prefill navigation target|start-location link"
```

Expected: existing destination-only prefill behavior and the new start-location behavior both pass.

---

### Task 4: Document the supported link contract

**Files:**
- Modify: `docs/user-guide.md`
- Modify: `docs/frontend.md`

- [ ] **Step 1: Add a user-facing section**

In `docs/user-guide.md`, add this section before **Deljenje poti**:

```md
## Povezava z določeno začetno lokacijo

Povezava v obliki `/?fromLocationId=11` odpre začetno stran in si zapomni določeno začetno navigacijsko lokacijo. Uporabnik nato poišče ciljni prostor in izbere **Poišči učilnico**. Na strani navigacije je začetna lokacija že izbrana, cilj pa je prostor, ki ga je uporabnik izbral na začetni strani.

Takšno povezavo je mogoče zapisati tudi v zunanjo QR-kodo. Če identifikator ni veljaven ali lokacija ne obstaja, aplikacija odpre običajen navigacijski obrazec brez izbrane začetne lokacije.
```

- [ ] **Step 2: Record the frontend URL behavior**

In the public route table in `docs/frontend.md`, change the `/` row purpose to mention the optional parameter:

```md
| `/` | `HomePage` | Iskanje prostorov in prikaz podrobnosti; opcijski `fromLocationId` ohrani začetno lokacijo za navigacijo |
```

Add this paragraph after the route table:

```md
Povezava `/?fromLocationId=<id>` uporablja obstoječi javni endpoint za podrobnosti navigacijske lokacije. Parameter se prenese samo do strani navigacije; ne ustvarja zapisa za deljenje poti in ne spreminja vedenja `/share/:shareCode`.
```

- [ ] **Step 3: Check documentation references**

Run from the repository root:

```powershell
rg -n "fromLocationId|Povezava z določeno začetno lokacijo|/share/:shareCode" docs/user-guide.md docs/frontend.md
```

Expected: both documents describe the new URL and clearly distinguish it from complete-route sharing.

---

### Task 5: Run required frontend verification

**Files:**
- Verify all modified frontend and documentation files

- [ ] **Step 1: Run the complete app smoke specification**

From `frontend/`:

```powershell
npm.cmd run test:e2e -- tests/app-smoke.spec.ts
```

Expected: all tests in `app-smoke.spec.ts` pass.

- [ ] **Step 2: Run the complete Playwright suite**

```powershell
npm.cmd run test:e2e
```

Expected: all Playwright tests pass. If an environment dependency prevents execution, record the exact command, error, and remaining risk.

- [ ] **Step 3: Run the production build**

```powershell
npm.cmd run build
```

Expected: TypeScript compilation and Vite build finish with exit code `0`.

- [ ] **Step 4: Run lint**

```powershell
npm.cmd run lint
```

Expected: ESLint finishes with exit code `0`.

- [ ] **Step 5: Run formatting verification**

```powershell
npm.cmd run format:check
```

Expected: Prettier reports that all checked files match formatting rules.

- [ ] **Step 6: Review the final diff without committing**

From the repository root:

```powershell
git status --short
git diff -- frontend/src/pages/HomePage.tsx frontend/src/pages/NavigationPage.tsx frontend/src/features/navigation/NavigationView.tsx frontend/tests/app-smoke.spec.ts docs/user-guide.md docs/frontend.md
```

Expected: the diff is limited to the planned start-location link behavior, tests, and documentation. Existing unrelated working-tree changes remain untouched.

---

## Acceptance Checklist

- [ ] `/?fromLocationId=11` opens the existing home page.
- [ ] No new banner or confirmation message is displayed.
- [ ] The inline home-page destination action preserves the linked start location.
- [ ] The space-detail destination action preserves the linked start location.
- [ ] Navigation preselects the resolved start location and the user-selected target.
- [ ] The user must still explicitly request route calculation.
- [ ] Missing, malformed, non-positive, and unavailable IDs do not block normal navigation.
- [ ] Existing `/share/:shareCode` complete-route sharing is unchanged.
- [ ] No backend or database changes are introduced.
- [ ] Focused Playwright tests, full Playwright suite, build, lint, and formatting checks have documented results.
- [ ] No commit, push, or pull request is created without a separate explicit instruction.
