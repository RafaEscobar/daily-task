# Router Guide

## Purpose

- Documents `src/router.js` for future AI agents.
- Routing is intentionally small, hash-based, and framework-free.
- `router.js` parses and creates routes; `main.js` decides what view to render.

## Current Routes

| Route | Route Object | Purpose |
| --- | --- | --- |
| `#/` | `{ name: 'calendar' }` | Monthly calendar view |
| `#/day/YYYY-MM-DD` | `{ name: 'day', date: 'YYYY-MM-DD' }` | Day task view |

## Route Registration

- There is no route registry array or router library.
- Routes are registered manually inside `getRoute()`.
- `getRoute()` reads `window.location.hash || '#/'`.
- It checks known route patterns in priority order.
- If no pattern matches, it returns the calendar route.

Current registration logic:

```text
hash
  -> match /^#\/day\/(\d{4}-\d{2}-\d{2})$/
  -> validate captured date with isValidDateKey()
  -> return { name: 'day', date }
  -> otherwise return { name: 'calendar' }
```

## Navigation Flow

```text
user action
  -> navigateToCalendar() or navigateToDay(dateKey)
  -> window.location.hash changes
  -> browser fires hashchange
  -> main.renderApp()
  -> getRoute()
  -> render matching view
```

- `main.js` owns the `hashchange` listener.
- `router.js` does not render UI.
- Browser back/forward support comes from hash history.
- Navigation helpers only mutate `window.location.hash`.

## Dynamic Routes

- Current dynamic route: `#/day/:date`.
- The `date` parameter must have exact shape `YYYY-MM-DD`.
- The `date` parameter must pass semantic validation through `isValidDateKey`.
- Invalid dates fall back to calendar behavior because `getRoute()` does not return a day route.

Examples:

- `#/day/2026-07-23` -> `{ name: 'day', date: '2026-07-23' }`
- `#/day/2026-02-31` -> `{ name: 'calendar' }`
- `#/day/not-a-date` -> `{ name: 'calendar' }`
- `#/unknown` -> `{ name: 'calendar' }`

## Parameters

- Route parameters are plain object properties.
- Current parameter:
  - `date`: local date key string in `YYYY-MM-DD`.
- Date parameters must be produced or validated with utilities from `src/utils.js`.
- Do not parse `YYYY-MM-DD` with `new Date("YYYY-MM-DD")`.
- Use:
  - `formatDateKey(date)` to create date keys.
  - `parseDateKey(dateKey)` to convert valid date keys into local `Date` objects.
  - `isValidDateKey(dateKey)` to validate route input.

## Public API

- `getRoute()`
  - Parses current hash into a route object.
  - Returns only valid route objects.

- `navigateToCalendar()`
  - Sets hash to `#/`.

- `navigateToDay(dateKey)`
  - Validates `dateKey`.
  - No-ops when invalid.
  - Sets hash to `#/day/${dateKey}` when valid.

- `monthFromRouteOrCurrent(route)`
  - Used by `main.js` to initialize/update calendar month context.
  - For a day route, returns first day of that day's month.
  - For calendar route, returns first day of current local month.

- `todayRouteKey()`
  - Returns today's local date key.
  - Currently exported but not used by source modules.

## Navigation Conventions

- Do not assign `window.location.hash` directly outside `router.js`.
- Add a named `navigateToX()` helper for every new route.
- Validate route parameters before mutating the hash.
- Invalid navigation input should no-op rather than throw.
- Keep route names stable and simple, e.g. `calendar`, `day`, `settings`.
- Route objects should be serializable plain objects.
- Use hash routes, not History API routes, unless explicitly redesigning routing.
- Keep calendar route as the fallback for invalid or unknown hashes.

## Interaction With `main.js`

- `main.js` imports `getRoute()` and `monthFromRouteOrCurrent()`.
- `main.js` calls `getRoute()` during each render.
- `main.js` branches on `route.name`.
- Current behavior:

```text
route.name === 'day'
  -> set selectedDate
  -> set currentMonth from route
  -> renderDayView(route.date)

otherwise
  -> renderCalendarView({ state, onMonthChange })
```

- When adding a route, `main.js` must get a new branch for its view.

## Interaction With Views

- `calendar.js`
  - Imports `navigateToDay`.
  - Calendar cell clicks call `navigateToDay(dateKey)`.

- `tasks.js`
  - Imports `navigateToCalendar`.
  - Back button in day view calls `navigateToCalendar`.

- Views should call router helpers only.
- Views should not know route regex details.

## How Future Pages Should Be Added

1. Define the URL shape.
   - Prefer short hash paths: `#/settings`, `#/task/:id`, `#/month/YYYY-MM`.

2. Add parsing to `getRoute()`.
   - Put more specific patterns before broader patterns.
   - Validate every dynamic segment.
   - Return a plain route object, e.g. `{ name: 'task', id }`.

3. Add a navigation helper.
   - Example: `navigateToTask(taskId)`.
   - Validate input and no-op on invalid input.

4. Add route-derived helpers if needed.
   - Example: a helper similar to `monthFromRouteOrCurrent()` when a route affects shared state.

5. Add a render branch in `main.js`.
   - Import the new view renderer.
   - Call `appRoot.replaceChildren(renderNewView(...))`.
   - Update transient state only when needed.

6. Update calling views/components.
   - Use the new `navigateToX()` helper.
   - Do not construct hashes inline.

7. Update agent docs.
   - Update this file.
   - Update `docs/agents/architecture.md` and `docs/agents/src.md` if module interactions change.

## Example: Adding Static Settings Page

```text
router.js
  getRoute():
    if hash === '#/settings' return { name: 'settings' }

  navigateToSettings():
    window.location.hash = '#/settings'

main.js
  if route.name === 'settings':
    appRoot.replaceChildren(renderSettingsView())
    return
```

## Example: Adding Dynamic Task Page

```text
router.js
  const taskMatch = /^#\/task\/([^/]+)$/.exec(hash)
  if taskMatch && taskMatch[1]) return { name: 'task', id: taskMatch[1] }

  navigateToTask(taskId):
    if (!taskId) return
    window.location.hash = `#/task/${encodeURIComponent(taskId)}`
```

- If adding encoded parameters, also decode and validate them in `getRoute()`.
- Keep task lookup and missing-task behavior in the view module, not in `router.js`.

## Things To Avoid

- Do not add a routing dependency for the current app size.
- Do not move rendering into `router.js`.
- Do not parse route dates with UTC-sensitive date constructors.
- Do not throw for unknown hashes.
- Do not silently accept malformed dynamic parameters.
- Do not duplicate navigation helpers in feature modules.
