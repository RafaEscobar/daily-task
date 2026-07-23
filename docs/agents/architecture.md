# Application Architecture

## Purpose

- This document is for future AI agents working on the application.
- It describes runtime architecture, module communication, and lifecycle flows.
- Source of truth is the `src/` directory; generated `dist/` files are not architectural source.

## High-Level Shape

- Single-page browser app.
- Framework-free vanilla JavaScript with ES modules.
- Vite loads `src/main.js` from `index.html`.
- UI is rendered by imperative DOM builders that return real DOM nodes.
- Routing is hash-based and handled entirely in the browser.
- Task data is persisted in `localStorage`.

## Module Map

- `src/main.js`
  - Imports global CSS.
  - Owns top-level transient state.
  - Chooses calendar view vs day view from the current route.
  - Registers the task rerender callback.
  - Handles startup and `hashchange`.

- `src/router.js`
  - Parses `window.location.hash`.
  - Validates date routes.
  - Provides navigation helpers.
  - Converts a day route into its month context.

- `src/calendar.js`
  - Renders the month view.
  - Reads month/date stats from storage.
  - Navigates to day routes when calendar cells are clicked.
  - Emits month changes through an `onMonthChange` callback.

- `src/tasks.js`
  - Renders the day view.
  - Builds task list sections, task cards, task forms, and task detail modals.
  - Handles create, update, delete, complete, restore, and details interactions.
  - Calls storage functions for mutations.
  - Calls `showToast`, closes modals, and triggers rerender after mutations.

- `src/storage.js`
  - Owns the task persistence boundary.
  - Reads and writes `localStorage`.
  - Normalizes stored task records.
  - Provides CRUD and stats helpers.

- `src/utils.js`
  - Shared date, formatting, DOM, ID, numeric, and accessibility helpers.

- `src/components/modal.js`
  - Generic modal lifecycle.
  - Focus trapping, Escape close, backdrop close, previous focus restoration.

- `src/components/confirm-dialog.js`
  - Specialized destructive-action confirmation dialog.
  - Independent overlay root and focus handling.

- `src/components/toast.js`
  - Temporary user notifications.

## Startup Sequence

1. Browser loads `index.html`.
2. Static roots become available:
   - `#app`
   - `#toast-root`
   - `#modal-root`
   - `#confirm-root`
3. Browser loads `src/main.js` as an ES module.
4. `src/main.js` imports `src/styles.css`.
5. `src/main.js` imports render, route, and task callback modules.
6. `appRoot` is resolved with `document.querySelector('#app')`.
7. Initial `state.currentMonth` is calculated from `monthFromRouteOrCurrent(getRoute())`.
8. `setTaskRerender(renderApp)` registers the top-level rerender callback for task mutations.
9. A `hashchange` listener is attached.
10. If no hash exists, startup redirects to `#/`.
11. If a hash exists, startup calls `renderApp()` immediately.

## Initialization Sequence

- Initial route is obtained from `getRoute()`.
- Valid `#/day/YYYY-MM-DD` routes initialize the day view and set:
  - `state.selectedDate`
  - `state.currentMonth` to the selected date's month.
- Calendar or invalid routes initialize the calendar view.
- Calendar initialization uses the current local month unless a valid day route supplies month context.
- No task data is eagerly loaded at app startup; render functions read storage as needed.

## Routing Flow

```text
window.location.hash
  -> router.getRoute()
  -> main.renderApp()
  -> calendar view or day view
```

- Calendar route: `#/`
- Day route: `#/day/YYYY-MM-DD`
- Day route date must pass `isValidDateKey`.
- Unknown hashes fall back to calendar route behavior.
- Navigation functions mutate the hash:
  - `navigateToCalendar()`
  - `navigateToDay(dateKey)`
- Hash mutation triggers `hashchange`, which calls `renderApp()`.
- Browser back/forward works because views are route-derived from hash history.

## Rendering Flow

```text
main.renderApp()
  -> router.getRoute()
  -> route.name === "day" ?
       appRoot.replaceChildren(renderDayView(route.date))
     :
       appRoot.replaceChildren(renderCalendarView({ state, onMonthChange }))
```

- Rendering replaces the entire `#app` content.
- View functions produce DOM nodes, not strings.
- `calendar.js` and `tasks.js` read task data during render through `storage.js`.
- Event listeners are attached during DOM creation.
- Modal, confirm, and toast roots are outside `#app`, so they can overlay either view.

## Calendar Rendering Flow

```text
renderCalendarView({ state, onMonthChange })
  -> render header and month navigation
  -> renderMonthSummary(state.currentMonth)
       -> getMonthStats(monthDate)
  -> renderCalendarGrid(state.currentMonth, state.selectedDate)
       -> renderCalendarCell(dateKey, selectedDate)
            -> getDateStats(dateKey)
            -> navigateToDay(dateKey) on click
```

- Month navigation does not change the route.
- Month navigation calls `onMonthChange(nextMonth)`.
- `main.js` handles the callback, updates `state.currentMonth`, and rerenders.
- Calendar cells route to day view by setting the hash.

## Day Rendering Flow

```text
renderDayView(date)
  -> getTasksByDate(date)
  -> calculateStats(tasks)
  -> split pending/completed
  -> sort pending by points desc, createdAt asc
  -> sort completed by completedAt/updatedAt desc
  -> render header, empty state if needed, pending section, completed section
```

- The day header includes back navigation and the create-task action.
- Task cards expose details, edit, complete/restore, and delete actions.
- Empty state appears when the selected day has no tasks.
- Pending and completed sections always render.

## Event Flow

### Route Events

```text
user clicks calendar cell/back button/browser navigation
  -> router navigation or browser hash change
  -> hashchange
  -> main.renderApp()
```

### Month Events

```text
user clicks previous/today/next
  -> calendar onMonthChange callback
  -> main updates state.currentMonth
  -> main.renderApp()
```

### Task Mutation Events

```text
user submits form or clicks task action
  -> tasks.js handler
  -> storage.js mutation
  -> showToast(...)
  -> close modal/dialog if relevant
  -> rerender()
  -> main.renderApp()
```

### Modal Events

```text
openModal(...)
  -> close any existing modal
  -> render overlay in #modal-root
  -> add body.modal-open
  -> trap focus
  -> close on Escape, backdrop, or close button
```

### Confirm Dialog Events

```text
openDeleteDialog(...)
  -> render overlay in #confirm-root
  -> confirm button calls supplied onConfirm
  -> closeConfirmDialog()
```

## Data Flow

```text
localStorage
  -> storage.getTasks()
  -> storage.normalizeTasks()
  -> view renderers
  -> user events
  -> storage mutations
  -> storage.saveTasks()
  -> localStorage
  -> rerendered views
```

- Views never receive task arrays from `main.js`.
- Views pull the current task snapshot through storage helpers.
- Mutations are synchronous.
- There is no remote data, async fetch lifecycle, cache layer, or server sync.

## Storage Lifecycle

1. A view or handler calls a storage helper.
2. `getTasks()` reads `dailyTasksCalendar.tasks` from `localStorage`.
3. Missing data returns `[]`.
4. Malformed JSON logs `console.warn` and returns `[]`.
5. Non-array parsed data logs `console.warn` and returns `[]`.
6. Arrays are normalized by `normalizeTasks()`.
7. Invalid task records are dropped.
8. Duplicate IDs are dropped.
9. Mutating helpers build the next task array.
10. `saveTasks()` normalizes again before writing JSON.
11. The mutation returns the changed task, boolean, or normalized list depending on helper.

## Component Communication

- There is no global event bus.
- There are no custom events.
- Parent-to-child communication is direct function arguments.
- Child-to-parent communication uses callbacks:
  - Calendar month changes call `onMonthChange`.
  - Task module rerenders call the callback registered through `setTaskRerender`.
  - Confirm dialog calls the supplied `onConfirm`.
- Cross-module side effects are explicit imports:
  - `tasks.js` imports storage, modal, confirm, toast, router helpers.
  - `calendar.js` imports router and storage helpers.
  - `main.js` imports renderers and router helpers.

## Module Interaction Graph

```text
index.html
  -> src/main.js
       -> src/styles.css
       -> src/router.js
            -> src/utils.js
       -> src/calendar.js
            -> src/router.js
            -> src/storage.js
            -> src/utils.js
       -> src/tasks.js
            -> src/storage.js
            -> src/router.js
            -> src/utils.js
            -> src/components/modal.js
                 -> src/utils.js
            -> src/components/confirm-dialog.js
                 -> src/utils.js
            -> src/components/toast.js
                 -> src/utils.js
```

## Persistence Contract

- Storage key: `dailyTasksCalendar.tasks`.
- Persisted format: JSON array.
- Task date format: local `YYYY-MM-DD`.
- Task timestamps: ISO strings.
- Normalization is backward-compatible and defensive.
- Any future persisted field must be optional-safe for existing stored records.

## Important Invariants

- `src/storage.js` is the only module that should touch `localStorage`.
- `src/router.js` is the only module that should construct route hashes.
- `src/utils.js` date helpers must be used for date keys.
- Render functions should be deterministic for a given route and current storage snapshot.
- Task mutations must be followed by rerender to refresh stats and lists.
- User text must be inserted with `textContent` through `createElement({ text })`.
- `innerHTML` is reserved for trusted inline SVG icons only.
- Modal and confirm overlays must preserve focus management behavior.
