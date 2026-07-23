# Implementation Patterns

## Purpose

- Documents recurring implementation patterns in the project.
- Future AI agents should reuse these patterns before inventing new structures.
- These are conventions observed in existing source, not generic JavaScript rules.

## Repeated Coding Patterns

### DOM Builder Pattern

Used throughout `calendar.js`, `tasks.js`, and component modules.

```text
const element = createElement(tag, { className, text, attrs })
element.append(children...)
element.addEventListener(...)
return element
```

Rules:

- Use `createElement()` from `utils.js`.
- Use `{ text }` for user or stored content.
- Use `{ attrs }` for IDs, ARIA, form attributes, and button types.
- Append child nodes with `.append(...)`.
- Attach event listeners close to the element creation.

### Private Helper Pattern

Feature modules define private helpers above exported render/open functions.

Examples:

- `calendar.js`
  - `createIcon`
  - `getStatusMeta`
  - `renderMonthSummary`
  - `renderCalendarCell`
  - `renderCalendarGrid`

- `tasks.js`
  - `icon`
  - `sortPending`
  - `sortCompleted`
  - `validateTaskForm`
  - `buildTaskForm`
  - `handleDelete`
  - `handleToggle`
  - `metaRow`
  - `renderTaskCard`
  - `renderTaskSection`

Rule:

- Keep helpers private until another module truly needs them.

### Named Export Pattern

- Modules export named functions/constants.
- No app source module uses default exports.
- Import only the functions needed by the caller.

### Early Return Pattern

Used for invalid or no-op flows.

Examples:

- Invalid day route returns calendar route.
- Invalid `navigateToDay(dateKey)` no-ops.
- Missing task in `openTaskDetailModal(taskId)` returns.
- Missing changed task in `handleToggle(task)` returns.
- `closeModal()` and `closeConfirmDialog()` return if nothing is active.

Rule:

- Prefer early returns over nested control flow for invalid states.

## UI Patterns

### Page Container Pattern

Calendar and day views start with a centered max-width container.

```text
mx-auto max-w-* px-3 py-4 sm:px-6 lg:px-8
```

- Calendar uses `max-w-7xl`.
- Day view uses `max-w-6xl`.

### Surface Pattern

Main UI panels use:

```text
rounded-xl border border-slate-200 bg-white shadow-sm
```

Use this for cards, sections, headers, and contained app surfaces.

### Button Pattern

Use shared CSS classes:

- `primary-button`
  - Create/save/main positive action.

- `secondary-button`
  - Navigation, cancel, edit, detail, neutral actions.

- `danger-button`
  - Confirmed destructive actions.

- `icon-button`
  - Compact icon-only controls, currently modal close.

Avoid one-off button styles unless extending a shared class with small overrides like `!min-h-10 !px-3`.

### Empty State Pattern

Empty lists use dashed borders and muted copy.

```text
rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500
```

Day-level empty state uses an indigo-tinted dashed panel and a primary action.

### Metadata Pattern

Small metadata cards use:

```text
rounded-lg border border-slate-200 bg-slate-50 p-3
```

Label:

```text
text-xs font-medium uppercase tracking-wide text-slate-500
```

Value:

```text
mt-1 text-sm font-semibold text-slate-900
```

### Status Pattern

Task and calendar status color semantics:

- Empty/no tasks: slate.
- Completed/success: green.
- Mixed/info: indigo.
- Pending/warning: amber.
- Destructive/error: red.

Do not use these colors for unrelated meanings.

### Modal Pattern

```text
build content DOM
build action buttons in DocumentFragment
wire button events
openModal({ title, content, actions, maxWidth })
```

Use generic modal for forms and detail views.

### Delete Confirmation Pattern

```text
openDeleteDialog({
  taskName: task.name,
  onConfirm: () => {
    deleteTask(task.id)
    closeModal()
    showToast('...', 'warning')
    rerender()
  }
})
```

Use this pattern instead of browser `confirm()`.

### Toast Feedback Pattern

Mutation feedback uses `showToast(message, type)`.

- Create/update/complete: `success`.
- Restore to pending: `info`.
- Delete: `warning`.
- User-visible failure: `error`.

## Event Patterns

### Route Event Pattern

```text
view click
  -> router navigation helper
  -> hash changes
  -> window hashchange
  -> renderApp()
```

Current examples:

- Calendar cell click -> `navigateToDay(dateKey)`.
- Day back button click -> `navigateToCalendar`.

### Month Navigation Pattern

Month navigation is local state, not route state.

```text
button click
  -> onMonthChange(nextMonth)
  -> main updates state.currentMonth
  -> renderApp()
```

Current examples:

- Previous month.
- Today.
- Next month.

### Form Submit Pattern

```text
submit event
  -> event.preventDefault()
  -> collect trimmed values
  -> validate
  -> if errors: render inline errors and return
  -> storage mutation
  -> toast
  -> closeModal()
  -> rerender()
```

### Inline Validation Event Pattern

```text
input event
  -> collect current values
  -> validate
  -> applyErrors(errors)
```

Used for task name and description fields.

### Toggle Button Pattern

Point selection buttons update internal state, ARIA, classes, and display copy.

```text
button click
  -> update current value
  -> loop sibling buttons
  -> set aria-pressed
  -> update selected/unselected classes
  -> update summary text
  -> hide field error
```

### Overlay Keyboard Pattern

Modals and confirm dialogs:

- Escape closes.
- Tab stays inside the panel.
- Shift+Tab wraps backward.
- Previous focus is restored after close.

## State Patterns

### Top-Level App State Pattern

`main.js` owns only transient route/view state:

```js
const state = {
  currentMonth,
  selectedDate: null,
  activeModal: null,
};
```

Rules:

- Keep task data out of `main.js`.
- Read task data from storage during render.
- Add app-level state only when multiple views need it.

### Rerender Callback Pattern

`tasks.js` does not import `main.js`.

```text
tasks.js has private rerender no-op
main.js calls setTaskRerender(renderApp)
tasks.js calls rerender() after mutations
```

This avoids circular imports while letting task actions refresh the app.

### Local Closure State Pattern

Form-only state stays inside the form builder.

Example:

```js
const pointsValue = { current: String(task?.points ?? 5) };
```

Use this for UI-local state that does not need routing or persistence.

### Route-Derived State Pattern

The current view is derived from `getRoute()`.

- Day route sets `selectedDate` and month context.
- Calendar route uses existing/current month state.

Do not maintain a separate view enum that can disagree with the hash.

## Rendering Patterns

### Full View Replacement Pattern

`main.js` renders by replacing `#app` children.

```text
appRoot.replaceChildren(renderDayView(...))
appRoot.replaceChildren(renderCalendarView(...))
```

Rules:

- Render functions return DOM nodes.
- Do not manually patch large parts of previous views unless there is a measured need.

### View Renderer Pattern

View renderer functions:

- Read needed data.
- Build top-level container.
- Build child DOM tree.
- Attach event listeners.
- Return the container.

Current public renderers:

- `renderCalendarView({ state, onMonthChange })`.
- `renderDayView(date)`.

### Section Renderer Pattern

Repeated sections are rendered by helper functions that accept data and labels.

Example:

```text
renderTaskSection(title, tasks, emptyText)
```

Use this pattern for future repeated UI blocks.

### Card Renderer Pattern

Data cards:

- Use an article/section-like element.
- Build top row, metadata, actions.
- Attach per-card handlers using task ID or task object.

### Conditional DOM Pattern

Build optional content with simple conditionals.

Examples:

- Append completed timestamp only if `task.completedAt`.
- Render day empty state only if `tasks.length === 0`.
- Render section empty message when section task array is empty.

## Storage Patterns

### Storage Boundary Pattern

Only `storage.js` touches `localStorage`.

```text
UI module
  -> storage helper
  -> getTasks/saveTasks
  -> localStorage
```

### Normalize On Read/Write Pattern

```text
getTasks()
  -> parse
  -> normalizeTasks

saveTasks(tasks)
  -> normalizeTasks
  -> stringify
  -> localStorage.setItem
```

Rule:

- Never persist unnormalized task objects.

### Mutation Pattern

Mutations read the full list, derive a new list, save the list, return useful result.

Examples:

- `createTask` returns created task.
- `updateTask` returns updated task or `null`.
- `deleteTask` returns boolean removed flag.
- `toggleTaskStatus` returns changed task or `null`.

### Stats Pattern

Stats are derived, not stored.

```text
task list
  -> calculateStats(tasks)
  -> totals and percentages
```

Do not persist derived stats.

## Error Patterns

### Safe Storage Recovery Pattern

```text
try JSON.parse
  -> if not array: console.warn and []
catch parse error
  -> console.warn and []
```

Use safe recovery for corrupt local user data.

### Invalid Record Drop Pattern

`normalizeTask(rawTask)` returns `null` for invalid records.

`normalizeTasks(rawTasks)` skips:

- non-objects.
- invalid date keys.
- too-short names/descriptions.
- duplicate IDs.

### Invalid Navigation No-Op Pattern

```text
if (!isValidDateKey(dateKey)) return
```

Use no-op navigation for invalid user/programmatic route input.

### Missing Entity No-Op Pattern

```text
const task = getTaskById(taskId)
if (!task) return
```

Use no-op behavior when the UI tries to open a missing task.

### Inline Validation Error Pattern

Validation returns an error object keyed by field name.

```text
errors = validateTaskForm(values)
applyErrors(errors)
if Object.keys(errors).length: return
```

Errors are displayed inline and in Spanish.

## Patterns To Prefer For New Features

- Add private render helpers before creating new modules.
- Add storage helpers before filtering persisted task data in multiple UI places.
- Add router helpers before constructing hashes in views.
- Use modal/toast/confirm components for transient UI.
- Keep user input validation in the UI and defensive normalization in storage.
- Keep state local unless it must be shared or route-derived.
- Preserve full view rerender unless performance measurements justify finer updates.

## Patterns To Avoid

- Avoid framework-style component abstractions.
- Avoid global event buses.
- Avoid direct `localStorage` access outside `storage.js`.
- Avoid direct `window.location.hash` writes outside `router.js`.
- Avoid HTML string rendering.
- Avoid duplicating modal, confirm, toast, button, or date utilities.
- Avoid caching task arrays without a clear invalidation strategy.
- Avoid storing derived stats.
