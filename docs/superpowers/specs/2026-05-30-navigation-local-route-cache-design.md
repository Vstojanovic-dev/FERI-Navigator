# Navigation Local Route Cache Design

**Date:** 2026-05-30

**Status:** Proposed and user-validated

**Goal**

Add local route persistence so the app can reuse the last 5 routes and named favorite routes without calling the server every time, while still detecting backend navigation graph changes and revalidating cached data safely.

## Scope

This design covers:

- client-side caching of full route responses
- client-side persistence of named favorites
- client-side persistence of deduplicated recent routes limited to 5 items
- caching of already seen map assets used by saved routes
- backend `graphRevision` signaling and invalidation flow
- background route revalidation when the app detects a newer revision
- UI changes on the navigation page only

This design explicitly does not cover:

- full offline location search
- backend route-result cache in V1
- home-page or global-menu shortcuts for saved routes

## Product Decisions

The following decisions were explicitly agreed:

- Client caching is mandatory.
- Backend route cache is postponed to a later phase and is not part of V1.
- Local storage technology is `IndexedDB`.
- A `service worker` is part of the solution.
- Backend exposes a dedicated revision endpoint and also returns the revision in route responses.
- Revision invalidation covers all navigation-relevant changes:
  - graph node changes
  - graph edge changes
  - location-to-node mapping changes
  - enabled/disabled navigation location changes
  - floor/building metadata that affects route rendering, including map image URLs and coordinate dimensions
- Full offline search is out of scope for V1.
- Favorites survive invalidation as saved intents even when their route payload becomes stale.
- Recent routes are deduplicated and limited to 5 items.
- Favorites are named favorites.
- UI for favorites and recents lives only on the navigation page in V1.
- Revision checks happen both:
  - on app start
  - on navigation page entry, especially when the last known revision check is stale or the app resumed after being backgrounded
- If a background refresh fails, stale routes remain accessible, but they must be clearly labeled as stale and the user must be prompted to refresh.
- If the currently open route becomes invalid due to a revision mismatch, the user sees a non-blocking banner with a refresh action.
- Favorite count is unlimited in V1.
- Favorite creation uses an auto-generated default name like `A -> B`, with an editable field.

## High-Level Architecture

The system has four cooperating parts:

1. Backend revision signaling
2. Frontend route persistence in `IndexedDB`
3. Frontend route cache controller and background revalidation logic
4. Service worker for static/runtime map asset caching

### 1. Backend revision signaling

The backend becomes the source of truth for navigation-data freshness.

It will expose:

- `GET /api/navigation/revision`
- `graphRevision` in every `GET /api/navigation/route` response

The backend must increment or replace `graphRevision` every time navigation-relevant data changes. The revision must be monotonic from the frontend point of view. A numeric counter is preferred over a timestamp because it is easier to compare and less error-prone.

### 2. Frontend route persistence in IndexedDB

The frontend stores:

- route payloads
- favorite definitions
- recent-route definitions
- revision metadata

This persistence is device-local and survives reloads and browser restarts.

### 3. Frontend route cache controller

The frontend route cache controller will:

- resolve cache keys for route requests
- serve locally cached routes when allowed
- track revision metadata
- invalidate stale route payloads when a revision mismatch is detected
- launch background recalculation for favorites and recents
- expose status to the navigation UI

### 4. Service worker

The service worker will cache:

- app shell assets
- map images already used by saved routes

The service worker is not responsible for route-result persistence. Route JSON stays in `IndexedDB`, not in the Cache API.

## Backend Design

### Revision model

Add a persistent backend-side `graphRevision` source. Recommended implementation:

- create a small table such as `navigation_metadata`
- store one row with:
  - `id`
  - `graph_revision`
  - `updated_at`

Alternative acceptable implementation:

- dedicated application config table if one already exists

Do not derive revision ad hoc from request time. The revision must reflect actual data changes.

### Revision endpoint

Add:

- `GET /api/navigation/revision`

Response shape:

```json
{
  "graphRevision": 42,
  "updatedAt": "2026-05-30T10:15:00Z"
}
```

`updatedAt` is informational; `graphRevision` is the comparison key.

### Route response extension

Extend `RouteResponseDto` so every route response includes:

```json
{
  "graphRevision": 42,
  "...existingRouteFields": "..."
}
```

This allows every freshly fetched route to be stored together with the revision that produced it.

### Revision bump rules

Any mutation that changes navigation-relevant data must bump the revision in the same logical change flow.

Must bump revision:

- admin node create/update/delete
- admin edge create/update/delete
- navigation location changes affecting node linkage or availability
- space-to-primary-node changes if they affect route results
- floor/building metadata changes that affect route visualization or route payload semantics

Must not bump revision:

- purely cosmetic content unrelated to navigation route correctness or rendering

### Revision bump placement

The preferred implementation is a dedicated service, for example `NavigationRevisionService`, used by mutation services.

Do not scatter raw SQL increments across controllers.

Responsibilities:

- read current revision
- bump revision atomically
- expose revision DTO for the public endpoint

### Backend cache in V1

Do not implement route-result caching on the backend in V1.

Rationale:

- client cache already removes most redundant route requests
- backend route cache adds invalidation and capacity complexity
- it should be introduced only after measuring post-V1 route traffic and A* cost

## Frontend Data Model

Use `IndexedDB` with a dedicated database, for example `feri-navigation-cache`.

Recommended object stores:

### `route_entries`

Stores the full route payload plus cache metadata.

Fields:

- `cacheKey` string, primary key
- `requestKind` string: `exact` or `nearest`
- `fromLocationId` number
- `toLocationId` number nullable
- `targetType` string nullable
- `allowElevator` boolean
- `graphRevision` number
- `status` string: `fresh`, `stale`, `refreshing`
- `savedAt` ISO string
- `lastValidatedAt` ISO string nullable
- `route` full route response payload

### `favorite_routes`

Stores saved route intents and naming metadata.

Fields:

- `favoriteId` string, primary key
- `name` string
- `autoName` string
- `fromLocationId` number
- `toLocationId` number nullable
- `targetType` string nullable
- `allowElevator` boolean
- `linkedCacheKey` string nullable
- `createdAt` ISO string
- `updatedAt` ISO string

### `recent_routes`

Stores the deduplicated last 5 route intents.

Fields:

- `cacheKey` string, primary key
- `fromLocationId` number
- `toLocationId` number nullable
- `targetType` string nullable
- `allowElevator` boolean
- `linkedCacheKey` string
- `lastOpenedAt` ISO string

The store is trimmed to 5 entries after every update.

### `navigation_meta`

Stores client-side revision tracking data.

Fields:

- `key` string, primary key
- `value` arbitrary JSON

Expected keys:

- `lastKnownGraphRevision`
- `lastRevisionCheckAt`
- `dbSchemaVersion`

## Cache Key Design

Cache keys must be deterministic and derived from route intent, not from returned route IDs.

Recommended key format:

- exact route:
  - `exact:<fromLocationId>:<toLocationId>:<allowElevator>`
- nearest target:
  - `nearest:<fromLocationId>:<targetType>:<allowElevator>`

This key is used for:

- route entry lookup
- recent deduplication
- favorite-to-route linking

## Client Cache Behavior

### Route open flow

When the user requests a route:

1. Build the cache key from request intent.
2. Check `IndexedDB` for a matching `route_entries` record.
3. If a local route exists and is allowed for display under the current revision knowledge, open it immediately.
4. If no usable local route exists, fetch from `/api/navigation/route`.
5. Save the fresh route response to `route_entries`.
6. Update `recent_routes`.
7. If the user saves the route as favorite, update `favorite_routes`.

### Allowed local display rules

There are three cases:

1. No known revision mismatch
- locally saved routes may be shown, including offline

2. Known revision mismatch, background refresh succeeded
- only the refreshed route payload may be shown

3. Known revision mismatch, background refresh failed
- stale route may still be shown
- the route UI must clearly label it as stale
- the user must be prompted to refresh when online

This rule is stricter than a normal content cache but less strict than total lockout, matching the agreed hybrid behavior.

### Revision check triggers

Revision checks happen:

- on app start
- on entry to the navigation page
- optionally on app resume when the last check is old enough

Use a small freshness window to avoid redundant spam. For example, the navigation page can skip a second revision check if the app-start check completed very recently. The exact threshold should be decided during implementation and documented in code.

### Revision mismatch handling

When the frontend sees a backend `graphRevision` newer than `lastKnownGraphRevision`:

1. Update `navigation_meta.lastKnownGraphRevision`.
2. Mark all `route_entries` with an older revision as `stale`.
3. Start background recalculation for:
  - all favorites
  - all recents
4. Replace each successfully refreshed route entry atomically.
5. Keep failed refreshes as `stale`.
6. Notify open route views if their current cache entry changed from valid to stale.

### Background recalculation behavior

Background refresh should:

- run sequentially or with very low concurrency
- reuse the same cache-key scheme
- update route payloads in place
- update `graphRevision`, `status`, and `lastValidatedAt`

Do not block the whole page on bulk refresh.

### Active route behavior

If the user is currently viewing a route and that route becomes stale after a revision mismatch:

- show a non-blocking banner
- explain that navigation data changed
- offer an action such as `Refresh route`

If auto-refresh of that specific route succeeds quickly, the banner may disappear and the route may update in place. If not, the banner remains until the route is refreshed or the view is left.

## UI Design

All V1 UI changes stay inside the navigation page.

### New sections

Add:

- `Favorites`
- `Recent routes`

These sections live near the route form and remain accessible when no active route is displayed.

### Favorite actions

For an active route:

- show `Save as favorite` if it is not yet favorited
- show `Remove favorite` if it already exists

When saving:

- prefill the name with auto-generated `A -> B`
- allow the user to edit before confirming

### Recent actions

Every successfully opened route updates the deduplicated recents list:

- if the route already exists, move it to the top
- otherwise insert it at the top
- trim to 5

### Stale state presentation

When a route is stale:

- show a visible stale label in route cards and route detail view
- explain that navigation data changed
- provide a refresh action

The stale warning must appear both:

- when a background refresh failed
- when the user opens a stale route entry after a known mismatch

### Offline behavior

If the app is offline:

- previously saved routes may be opened
- if no mismatch is known yet, show them normally
- if a mismatch is already known and refresh did not succeed, show the route but mark it stale and refresh-required

## Service Worker Design

The service worker is responsible for static/runtime asset caching, not route JSON persistence.

### What to cache

- app shell assets required for startup
- map image files requested by route segments

### What not to cache there

- route JSON responses
- favorites/recent metadata
- revision state

Those remain in `IndexedDB`.

### Map asset strategy

When a route is stored locally, the frontend should also ensure that map assets referenced by its segments are requested in a way the service worker can cache them for later reuse.

Recommended behavior:

- on saving or refreshing a route, prefetch segment `mapImageUrl` assets
- let the service worker cache them with a cache-first or stale-while-revalidate runtime strategy

This ensures a saved route can still render its known map backgrounds offline.

## Failure Handling

### Revision endpoint failure

If the revision check fails:

- do not invalidate anything solely because of the failure
- keep the last known revision state
- allow cached routes using the last known state

### Route refresh failure

If background refresh for a specific route fails:

- keep the route entry
- keep its stale status
- allow access to it
- require a visible stale warning and refresh prompt

### IndexedDB failure

If `IndexedDB` is unavailable or corrupted:

- app must still support live server-fetched routing
- favorites/recent persistence degrades gracefully
- route caching features should fail soft, not break navigation entirely

### Service worker failure

If service worker registration or map caching fails:

- route caching in `IndexedDB` still works
- offline map rendering may be incomplete
- app should not block route usage because of service worker failure

## Security and Consistency Notes

- Do not trust client cache for correctness after a known revision mismatch without stale labeling.
- Do not use route IDs as cache keys; they are presentation identifiers, not stable request identities.
- Do not make service worker logic the only place where revision state lives.
- Do not couple favorite existence to route payload validity.

## Testing Strategy

### Backend tests

Add tests for:

- revision endpoint response
- revision field included in route responses
- revision bump on admin node mutations
- revision bump on admin edge mutations
- no accidental omission of bump logic for navigation-relevant mutations

### Frontend unit/integration tests

Add tests for:

- cache key generation
- route storage and replacement in `IndexedDB`
- recent-route deduplication and trim to 5
- favorite save/remove behavior
- stale marking after revision mismatch
- background refresh success flow
- background refresh failure flow with stale warning preserved
- active-route invalidation banner behavior

### Browser/E2E tests

Extend Playwright coverage for:

- open route, reload page, reopen from local cache without route API call
- save favorite and reopen it
- recent routes list behavior
- revision mismatch detected on app start or navigation entry
- background refresh replacing stale route
- background refresh failure leaving route accessible but marked stale
- offline open of previously cached route with cached map assets

## Open Implementation Notes

These details are intentionally left for the implementation plan rather than decided implicitly here:

- exact `IndexedDB` wrapper choice: native wrapper module vs small utility abstraction
- exact service worker tooling choice in Vite setup
- exact app-resume freshness threshold for repeating revision checks
- exact UI composition and styling details for favorites/recent cards and stale banners

They are implementation details, not product ambiguities.

## Future Phase 2

Potential later additions:

- backend route-result cache keyed by `graphRevision + route intent`
- full offline location search
- prefetching user-specific likely routes
- cross-device sync of favorites
