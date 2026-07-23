# Source File Guide

## Purpose

- This document explains every file under `src/` for future AI agents.
- It is optimized so agents can understand responsibilities and integration points before opening source.
- Source files remain the final authority when implementation details change.

## Import Graph Summary

```text
main.js
  -> styles.css
  -> calendar.js
  -> router.js
  -> tasks.js

calendar.js
  -> router.js
  -> storage.js
  -> utils.js

tasks.js
  -> components/modal.js
  -> components/confirm-dialog.js
  -> components/toast.js
  -> storage.js
  -> router.js
  -> utils.js

router.js
  -> utils.js

storage.js
  -> utils.js

components/modal.js
  -> utils.js

components/confirm-dialog.js
  -> utils.js

components/toast.js
  -> utils.js

styles.css
  -> Tailwind CSS
```

## `src/main.js`

### Responsibility

- Application entry point and top-level render coordinator.
- Imports global styles.
- Creates and owns the small transient app state object.
- Chooses between calendar view and day view based on the current hash route.
- Registers the rerender callback used by task actions.
- Handles initial route normalization and `hashchange` rerenders.

### Public Functions

- None exported.
- Internal `renderApp()` is the central render function for the app.

### Dependencies

- `./styles.css`
- `renderCalendarView` from `./calendar.js`
- `getRoute`, `monthFromRouteOrCurrent` from `./router.js`
- `setTaskRerender`, `renderDayView` from `./tasks.js`
- DOM root `#app` from `index.html`
- `window.location.hash`
- `window.hashchange`

### Used By

- Loaded directly by `index.html` through `<script type="module" src="/src/main.js">`.
- Its `renderApp()` callback is indirectly used by `tasks.js` after `setTaskRerender(renderApp)`.

### Possible Extension Points

- Add new route/view branches inside `renderApp()` after extending `router.js`.
- Add top-level transient UI state only when it affects multiple views.
- Add global event listeners here only when they affect app-level behavior.
- Add app-level initialization here if it must run once before any view renders.

### Important Implementation Details

- `state.currentMonth` is initialized from the current route; day routes set the visible month to the day route's month.
- Day route rendering updates `state.selectedDate` and `state.currentMonth`.
- Calendar rendering passes `state` and an `onMonthChange` callback into `renderCalendarView`.
- Month navigation updates local state without changing the hash.
- If no hash exists, startup redirects to `#/` with `window.location.replace`.
- Full view rerenders use `appRoot.replaceChildren(...)`.

## `src/router.js`

### Responsibility

- Owns hash route parsing and navigation.
- Validates day route dates.
- Provides helpers for deriving month context and today's route key.

### Public Functions

- `getRoute()`
  - Reads `window.location.hash`.
  - Returns `{ name: 'day', date }` for valid `#/day/YYYY-MM-DD`.
  - Returns `{ name: 'calendar' }` for calendar, invalid, or unknown hashes.

- `navigateToCalendar()`
  - Sets hash to `#/`.

- `navigateToDay(dateKey)`
  - Validates the date key.
  - Sets hash to `#/day/YYYY-MM-DD` only when valid.

- `monthFromRouteOrCurrent(route)`
  - For day routes, returns the first day of that date's month.
  - For calendar route, returns the first day of the current local month.

- `todayRouteKey()`
  - Returns today's local date key via `formatDateKey(new Date())`.

### Dependencies

- `formatDateKey`, `isValidDateKey`, `parseDateKey` from `./utils.js`
- `window.location.hash`

### Used By

- `main.js`: route selection and initial/current month calculation.
- `calendar.js`: `navigateToDay`.
- `tasks.js`: `navigateToCalendar`.

### Possible Extension Points

- Add new hash route patterns in `getRoute()`.
- Add matching navigation helpers for new routes.
- Add route-to-state derivation helpers when new views need route context.

### Important Implementation Details

- Current route scheme is intentionally minimal:
  - `#/`
  - `#/day/YYYY-MM-DD`
- Invalid dates never produce day routes.
- Do not construct route hashes directly in view modules; add helpers here.
- Date route validation depends on local date-key parsing in `utils.js`.

## `src/calendar.js`

### Responsibility

- Renders the monthly calendar screen.
- Calculates and displays month-level and date-level stats.
- Renders Monday-first calendar grid with leading/trailing empty cells.
- Handles previous, today, and next month controls.
- Navigates to the day view when a date cell is clicked.

### Public Functions

- `renderCalendarView({ state, onMonthChange })`
  - Returns a DOM node for the full calendar view.
  - Expects `state.currentMonth` as a `Date`.
  - Uses `state.selectedDate` to visually mark the selected date.
  - Calls `onMonthChange(nextMonth)` for month controls.

### Dependencies

- `navigateToDay` from `./router.js`
- `getDateStats`, `getMonthStats` from `./storage.js`
- Utilities from `./utils.js`:
  - `WEEKDAY_LABELS`
  - `createElement`
  - `formatDateKey`
  - `formatMonthYear`
  - `getDaysInMonth`
  - `getMondayBasedWeekdayIndex`
  - `getNextMonth`
  - `getPreviousMonth`
  - `isSameDateKey`
  - `isToday`
  - `parseDateKey`

### Used By

- `main.js` imports and calls `renderCalendarView`.

### Possible Extension Points

- Add more month summary metrics in `renderMonthSummary`.
- Add richer date-cell indicators in `renderCalendarCell`.
- Add filters or display modes by expanding the `state` object passed from `main.js`.
- Add month-level actions to the calendar header.

### Important Implementation Details

- Private `createIcon()` creates trusted inline SVG nodes through `innerHTML`.
- `getStatusMeta(stats)` centralizes visual state for empty, pending, mixed, and complete dates.
- Calendar cells are buttons with descriptive `aria-label`.
- Today's date gets a filled indigo day number.
- Selected date adds an indigo focus-like ring.
- Mobile date cells show compact task/point counts; desktop cells show more detail.
- Month navigation calls `onMonthChange`; it does not mutate route hash.
- Date cell clicks call `navigateToDay(dateKey)`.

## `src/tasks.js`

### Responsibility

- Renders the day-specific task view.
- Builds task cards, task sections, empty state, task form modal, and task detail modal.
- Owns form validation for user feedback.
- Handles task create, edit, delete, complete, restore, and inspect actions.
- Bridges storage mutations to UI feedback and rerendering.

### Public Functions

- `setTaskRerender(callback)`
  - Stores a callback invoked after task mutations.
  - `main.js` passes `renderApp`.

- `openTaskFormModal(date, task = null)`
  - Opens create or edit modal for a date.
  - If `task` is provided, pre-fills edit values and saves changes through `updateTask`.
  - If no `task` is provided, creates a new task through `createTask`.

- `openTaskDetailModal(taskId)`
  - Reads the task by ID.
  - Opens a details modal with metadata and action buttons.
  - No-ops if the task is missing.

- `renderDayView(date)`
  - Returns a DOM node for the full day view.
  - Reads tasks for `date`, calculates stats, sorts tasks, and renders sections.

### Dependencies

- `closeModal`, `openModal` from `./components/modal.js`
- `openDeleteDialog` from `./components/confirm-dialog.js`
- `showToast` from `./components/toast.js`
- Storage functions from `./storage.js`:
  - `calculateStats`
  - `createTask`
  - `deleteTask`
  - `getTaskById`
  - `getTasksByDate`
  - `toggleTaskStatus`
  - `updateTask`
- `navigateToCalendar` from `./router.js`
- Utilities from `./utils.js`:
  - `createElement`
  - `formatHumanDate`
  - `formatTime`
  - `formatTimestamp`

### Used By

- `main.js` imports `setTaskRerender` and `renderDayView`.
- `tasks.js` private functions call public functions internally for modal transitions.

### Possible Extension Points

- Add new task fields in `buildTaskForm`, `validateTaskForm`, storage normalization, and detail rendering.
- Add new task actions in `renderTaskCard` and `openTaskDetailModal`.
- Add new day-level sections by changing the split/sort logic in `renderDayView`.
- Add richer validation by expanding `validateTaskForm`.
- Add different point controls inside `buildTaskForm`.

### Important Implementation Details

- Private `rerender` defaults to a no-op until `setTaskRerender` is called.
- Private `icon()` creates trusted inline SVG nodes through `innerHTML`.
- Pending tasks sort by higher points first, then older creation time first.
- Completed tasks sort by most recent completion/update time first.
- Form validation is immediate for name/description input and on submit.
- Points are selected with buttons from 1 to 10 and tracked in a local object.
- Create/edit flow:
  1. Validate form.
  2. Call `createTask` or `updateTask`.
  3. Show success toast.
  4. Close modal.
  5. Rerender app.
- Delete flow:
  1. Open confirm dialog.
  2. On confirm, call `deleteTask`.
  3. Close modal.
  4. Show warning toast.
  5. Rerender app.
- Toggle flow:
  1. Call `toggleTaskStatus`.
  2. If no task changed, no-op.
  3. Show success/info toast.
  4. Close modal.
  5. Rerender app.
- Day view always renders pending and completed sections, even when there are no tasks.

## `src/storage.js`

### Responsibility

- Owns all task persistence and task data normalization.
- Provides synchronous localStorage CRUD helpers.
- Provides task lookup and stats helpers.
- Shields the rest of the app from malformed stored data.

### Public Functions

- `STORAGE_KEY`
  - Constant: `dailyTasksCalendar.tasks`.

- `normalizeTasks(rawTasks)`
  - Returns a clean task array.
  - Drops invalid records and duplicate IDs.

- `getTasks()`
  - Reads from localStorage.
  - Parses JSON safely.
  - Returns normalized tasks or `[]`.

- `saveTasks(tasks)`
  - Normalizes tasks.
  - Writes JSON to localStorage.
  - Returns normalized tasks.

- `getTasksByDate(date)`
  - Returns tasks matching a date key.

- `createTask(taskData)`
  - Creates a new normalized incomplete task.
  - Throws `Error('Datos de tarea invalidos')` if input cannot normalize.
  - Saves and returns the task.

- `updateTask(taskId, updates)`
  - Updates a matching task while preserving `id` and `createdAt`.
  - Refreshes `updatedAt`.
  - Saves and returns the updated task or `null`.

- `deleteTask(taskId)`
  - Removes matching task.
  - Saves and returns whether a task was removed.

- `toggleTaskStatus(taskId)`
  - Toggles `completed`.
  - Sets or clears `completedAt`.
  - Refreshes `updatedAt`.
  - Saves and returns changed task or `null`.

- `getTaskById(taskId)`
  - Returns matching task or `null`.

- `calculateStats(tasks)`
  - Returns total, pending, completed, point totals, and completion percentage.

- `getDateStats(date)`
  - Calculates stats for one date.

- `getMonthStats(monthDate)`
  - Calculates stats for the month represented by a `Date`.

### Dependencies

- `clampInteger`, `generateId`, `isValidDateKey` from `./utils.js`
- Browser `localStorage`
- `Date`
- `JSON.parse`, `JSON.stringify`

### Used By

- `calendar.js`: `getDateStats`, `getMonthStats`.
- `tasks.js`: CRUD, lookup, date task list, and stats helpers.

### Possible Extension Points

- Add task fields in private `normalizeTask`.
- Add migrations by enhancing normalization, not by requiring one-time scripts.
- Add new query helpers for filters, ranges, or search.
- Add new stats helpers while keeping `calculateStats` generic.
- Add import/export helpers if requested, still using normalization before save.

### Important Implementation Details

- Private `nowIso()` returns the current ISO timestamp.
- Private `normalizeTask(rawTask)` returns a valid task object or `null`.
- `normalizeTask` enforces:
  - Valid local date key.
  - Name length 2-80 after trimming.
  - Description length 3-500 after trimming.
  - Points clamped to integer 1-10.
  - Boolean completion state.
  - Valid created/updated timestamps when present, otherwise current timestamp.
  - `completedAt` only kept when task is completed and value is a string.
- `normalizeTasks` drops duplicate IDs after first occurrence.
- `getTasks()` logs Spanish warnings for corrupt storage and recovers with `[]`.
- `saveTasks()` always normalizes before persistence.
- `getMonthStats()` compares year/month from date keys without constructing UTC date objects.

## `src/utils.js`

### Responsibility

- Shared utility layer for date keys, display formatting, calendar math, DOM creation, IDs, numeric clamping, and focusable element discovery.

### Public Functions And Constants

- `WEEKDAY_LABELS`
  - Monday-first Spanish weekday abbreviations: `Lun`, `Mar`, `Mie`, `Jue`, `Vie`, `Sab`, `Dom`.

- `padNumber(value)`
  - Pads a numeric value to at least two characters.

- `formatDateKey(date)`
  - Converts a local `Date` to `YYYY-MM-DD`.

- `parseDateKey(dateKey)`
  - Validates and parses `YYYY-MM-DD` into a local `Date`.
  - Returns `null` for invalid dates.

- `isValidDateKey(dateKey)`
  - Boolean wrapper around `parseDateKey`.

- `formatHumanDate(dateKey, options = {})`
  - Formats a date key in Spanish Mexico locale.
  - Returns `Fecha invalida` for invalid keys.

- `formatMonthYear(date)`
  - Formats a month/year label in Spanish Mexico locale.

- `formatTimestamp(value)`
  - Formats an ISO-like timestamp for metadata.
  - Returns `No disponible` for missing/invalid input.

- `formatTime(value)`
  - Formats only hour/minute.
  - Returns `No disponible` for missing/invalid input.

- `getDaysInMonth(year, monthIndex)`
  - Returns the number of days in a month.

- `getMondayBasedWeekdayIndex(date)`
  - Converts JS Sunday-first weekday to Monday-first grid index.

- `isToday(dateKey)`
  - Compares a date key with today's local date key.

- `isSameDateKey(first, second)`
  - String equality helper for date keys.

- `getPreviousMonth(date)`
  - Returns first day of previous month.

- `getNextMonth(date)`
  - Returns first day of next month.

- `getMonthKey(date)`
  - Returns `YYYY-MM`.

- `clampInteger(value, min, max)`
  - Converts to number, requires integer, clamps to range, returns `min` for non-integers.

- `createElement(tag, options = {})`
  - DOM helper supporting `className`, `text`, `html`, and `attrs`.

- `generateId()`
  - Uses `crypto.randomUUID()` when available.
  - Falls back to timestamp plus random string.

- `getFocusableElements(container)`
  - Returns visible focusable descendants for focus traps.

### Dependencies

- Browser DOM APIs.
- `Intl.DateTimeFormat`.
- `Date`.
- `globalThis.crypto`.

### Used By

- `router.js`
- `storage.js`
- `calendar.js`
- `tasks.js`
- `components/modal.js`
- `components/confirm-dialog.js`
- `components/toast.js`

### Possible Extension Points

- Add general date-key helpers here.
- Add locale formatting helpers here.
- Add general DOM helpers only if multiple modules need them.
- Add accessibility helpers for dialogs, menus, or future overlays.

### Important Implementation Details

- `parseDateKey` constructs dates with `new Date(year, month - 1, day)` to avoid UTC date-key bugs.
- `parseDateKey` verifies round-trip year, month, and day to reject impossible dates.
- `createElement({ text })` uses `textContent`; prefer this for user-provided text.
- `createElement({ html })` sets `innerHTML`; only use with trusted static markup.
- `getFocusableElements` excludes disabled controls and `[tabindex="-1"]`, then filters hidden elements.

## `src/components/modal.js`

### Responsibility

- Generic modal overlay component.
- Provides dialog semantics, focus management, scroll locking, close behavior, and optional action footer.

### Public Functions

- `closeModal()`
  - Closes active modal if present.
  - Removes key listener.
  - Removes `body.modal-open`.
  - Clears `#modal-root`.
  - Restores previous focus.

- `openModal({ title, content, actions, labelledById = 'modal-title', maxWidth = 'max-w-xl' })`
  - Closes any existing modal.
  - Renders modal into `#modal-root`.
  - Adds header, close button, content body, and optional footer actions.
  - Sets focus trap and Escape handling.

### Dependencies

- `createElement`, `getFocusableElements` from `../utils.js`
- DOM root `#modal-root`
- `document.body`
- `document.activeElement`
- `document.keydown`

### Used By

- `tasks.js`

### Possible Extension Points

- Add modal sizes through the existing `maxWidth` parameter.
- Add optional lifecycle callbacks if future flows need them.
- Add additional ARIA attributes through parameters if needed.
- Add animation classes while preserving focus and close behavior.

### Important Implementation Details

- Private `activeModal` tracks root, previous focus, and key handler.
- Opening a modal first calls `closeModal()`.
- Backdrop uses `data-modal-backdrop="true"`.
- Panel has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
- Escape closes the modal.
- Tab and Shift+Tab are trapped within focusable panel elements.
- Clicking the backdrop closes the modal.
- Initial focus moves to the first focusable element, or the panel fallback.
- Close icon is trusted static inline SVG.

## `src/components/confirm-dialog.js`

### Responsibility

- Specialized confirmation dialog for deleting tasks.
- Owns a separate overlay root and z-index above generic modals.
- Provides focus trapping, Escape close, backdrop close, and destructive confirmation callback.

### Public Functions

- `closeConfirmDialog()`
  - Closes active confirm dialog if present.
  - Removes key listener.
  - Removes `body.modal-open`.
  - Clears `#confirm-root`.
  - Restores previous focus.

- `openDeleteDialog({ taskName, onConfirm })`
  - Opens delete confirmation UI for a task name.
  - Calls `onConfirm()` when the user clicks delete.
  - Closes itself after confirmation.

### Dependencies

- `createElement`, `getFocusableElements` from `../utils.js`
- DOM root `#confirm-root`
- `document.body`
- `document.activeElement`
- `document.keydown`

### Used By

- `tasks.js`

### Possible Extension Points

- Generalize to other confirm types if more destructive flows are added.
- Add configurable title/body/action labels while preserving current delete defaults.
- Add error handling around `onConfirm` if future confirmation actions can fail.

### Important Implementation Details

- Private `activeDialog` tracks root, previous focus, and key handler.
- Dialog uses `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="confirm-title"`.
- Delete button receives initial focus.
- Escape and backdrop click close the dialog.
- Tab focus is trapped within dialog controls.
- Confirmation calls the supplied `onConfirm()` then closes the confirm dialog.
- `taskName` is inserted as text, not HTML.

## `src/components/toast.js`

### Responsibility

- Creates temporary status notifications.
- Provides consistent visual styling by toast type.
- Allows manual dismissal.

### Public Functions

- `showToast(message, type = 'info')`
  - Renders a toast into `#toast-root`.
  - Supports `success`, `info`, `warning`, and `error`.
  - Falls back to `info` styling for unknown types.
  - Auto-removes after 4.2 seconds.

### Dependencies

- `createElement` from `../utils.js`
- DOM root `#toast-root`
- `window.setTimeout`

### Used By

- `tasks.js`

### Possible Extension Points

- Add new toast types in `TOAST_STYLES`.
- Add icons if visual status needs to be stronger.
- Add configurable duration if future flows require persistent notices.
- Add max toast count if notification stacking becomes noisy.

### Important Implementation Details

- If `#toast-root` is missing, `showToast` no-ops.
- Toast container has `role="status"`.
- Message is inserted as text.
- Dismiss button uses trusted static inline SVG.
- Removal adds opacity/translate classes, then removes the node after 160 ms.

## `src/styles.css`

### Responsibility

- Imports Tailwind CSS.
- Defines global font and color scheme.
- Defines shared reusable UI classes with Tailwind `@apply`.
- Defines calendar cell sizing.
- Locks body scroll while modals are open.

### Public Functions

- None. This is a stylesheet.

### Dependencies

- Tailwind CSS v4 through `@import "tailwindcss"`.
- Classes are consumed by DOM created in JavaScript modules.

### Used By

- Imported once by `main.js`.
- Shared class names used across:
  - `calendar.js`
  - `tasks.js`
  - `components/modal.js`
  - `components/confirm-dialog.js`
  - `components/toast.js`

### Possible Extension Points

- Add shared button/control classes when multiple modules need the same styling.
- Add layout primitives only when repeated enough to justify centralization.
- Add responsive fixed dimensions for reusable interactive elements.
- Add state classes for new component families.

### Important Implementation Details

- `:root` sets light color scheme and system font stack.
- `body.modal-open` disables background scrolling.
- `button`, `input`, and `textarea` inherit font.
- Shared classes:
  - `.focus-ring`
  - `.icon-button`
  - `.primary-button`
  - `.secondary-button`
  - `.danger-button`
  - `.calendar-cell`
- `.calendar-cell` uses fixed minimum heights:
  - Desktop/default: `8.25rem`.
  - Mobile under 640px: `5.4rem`.
