# Tasks Module Guide

## Purpose

- Documents `src/tasks.js` for future AI agents.
- `tasks.js` owns the day task UI and task interaction flows.
- Persistence remains in `src/storage.js`; `tasks.js` coordinates UI, validation, storage calls, toasts, modals, and rerendering.

## Responsibilities

- Render the day view for one date.
- Split tasks into pending and completed sections.
- Sort pending and completed tasks.
- Render task cards and task section empty states.
- Open create/edit task form modal.
- Open task detail modal.
- Open delete confirmation dialog.
- Handle create, update, delete, complete, and restore actions.
- Show feedback with toasts.
- Trigger app rerender after mutations.

## Public API

- `setTaskRerender(callback)`
  - Called by `main.js`.
  - Registers the top-level app rerender function used after task mutations.

- `openTaskFormModal(date, task = null)`
  - Opens create modal when `task` is `null`.
  - Opens edit modal when `task` is provided.

- `openTaskDetailModal(taskId)`
  - Looks up a task by ID.
  - Opens details modal when found.
  - No-ops when missing.

- `renderDayView(date)`
  - Renders the full day page for a date key.
  - Returns a DOM node.

## Data Model

`tasks.js` consumes normalized task objects from `storage.js`.

```js
{
  id: "unique-id",
  date: "YYYY-MM-DD",
  name: "Task name",
  description: "Task details",
  points: 1,
  completed: false,
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp",
  completedAt: null
}
```

Field usage in `tasks.js`:

- `id`: passed to detail, edit, delete, and toggle handlers.
- `date`: used for editing and day filtering through storage.
- `name`: form value, card title, modal title, delete confirmation label.
- `description`: form value, card preview, detail body.
- `points`: form selection, card badge, detail metadata, pending sort priority.
- `completed`: section filter, card visual state, detail metadata, toggle label.
- `createdAt`: card metadata, detail metadata, pending sort tie-breaker.
- `updatedAt`: detail metadata, completed sort fallback.
- `completedAt`: card metadata, detail metadata, completed sort priority.

## Render Flow

```text
renderDayView(date)
  -> getTasksByDate(date)
  -> calculateStats(tasks)
  -> pendingTasks = sortPending(tasks where completed is false)
  -> completedTasks = sortCompleted(tasks where completed is true)
  -> render header
  -> render empty day state if tasks.length === 0
  -> render pending section
  -> render completed section
  -> return container
```

- The day view reads current tasks from storage every render.
- The day view does not receive tasks from `main.js`.
- Pending and completed sections always render.
- The full app view is replaced by `main.js` through `appRoot.replaceChildren(...)`.

## CRUD Flow

### Create

```text
Nueva tarea button or empty-state button
  -> openTaskFormModal(date)
  -> buildTaskForm({ date })
  -> submit
  -> validateTaskForm(values)
  -> createTask(values)
  -> showToast('Tarea creada.', 'success')
  -> closeModal()
  -> rerender()
```

Important details:

- Create form defaults points to `5`.
- Submitted values are trimmed.
- Created tasks are always incomplete because `storage.createTask` enforces that.

### Read / Details

```text
Detalles button
  -> openTaskDetailModal(task.id)
  -> getTaskById(taskId)
  -> if missing: return
  -> openModal({ title: task.name, content, actions })
```

Detail modal displays:

- Description.
- Date.
- Points.
- Status.
- Created timestamp.
- Updated timestamp.
- Completed timestamp when present.

### Update

```text
Editar button from card or detail modal
  -> openTaskFormModal(task.date, task)
  -> buildTaskForm({ date, task })
  -> submit
  -> validateTaskForm(values)
  -> updateTask(task.id, values)
  -> showToast('Tarea actualizada.', 'success')
  -> closeModal()
  -> rerender()
```

Important details:

- Existing `name`, `description`, and `points` prefill the form.
- `storage.updateTask` preserves original `id` and `createdAt`.
- `storage.updateTask` refreshes `updatedAt`.

### Delete

```text
Eliminar button from card or detail modal
  -> handleDelete(task)
  -> openDeleteDialog({ taskName: task.name, onConfirm })
  -> onConfirm
  -> deleteTask(task.id)
  -> closeModal()
  -> showToast('Tarea eliminada.', 'warning')
  -> rerender()
```

Important details:

- Deletion uses the reusable confirm dialog, not browser `confirm`.
- `closeModal()` is called so a parent detail modal closes after deletion.
- The confirm dialog closes itself after `onConfirm`.

### Complete / Restore

```text
Completar or Pendiente button
  -> handleToggle(task)
  -> toggleTaskStatus(task.id)
  -> if no changed task: return
  -> showToast(...)
  -> closeModal()
  -> rerender()
```

Toast behavior:

- Completed: `Tarea completada.`, type `success`.
- Restored to pending: `Tarea movida a pendientes.`, type `info`.

## Validation

Validation is handled by private `validateTaskForm(values)`.

Rules:

- `name`
  - Required.
  - Minimum 2 trimmed characters.
  - Maximum 80 trimmed characters.

- `description`
  - Required.
  - Minimum 3 trimmed characters.
  - Maximum 500 trimmed characters.

- `points`
  - Must be an integer.
  - Must be from 1 to 10.

Validation UX:

- Form uses `novalidate` and custom inline errors.
- Name and description validate on input.
- All fields validate on submit.
- Error messages are Spanish.
- Invalid text inputs receive `border-red-400`.
- Points errors are hidden when a point button is selected.

Storage safety:

- `storage.js` still normalizes persisted values.
- Do not rely only on form validation for data integrity.

## Search

- There is currently no search feature in `tasks.js`.
- No search input is rendered.
- No query state exists in `main.js` or `tasks.js`.
- No storage search helper exists.

If adding search:

- Keep search state local to the day view unless it must survive navigation.
- Filter the already-loaded `tasks` array before status splitting if search should apply to both sections.
- Search likely fields:
  - `name`
  - `description`
- Normalize query with `trim().toLowerCase()`.
- Preserve the existing pending/completed sections unless the user requests a unified result list.
- Do not add raw localStorage reads for search; use storage helpers.

Suggested flow:

```text
tasks = getTasksByDate(date)
query = current search input state
searchedTasks = filter by query
pendingTasks = sortPending(searchedTasks where !completed)
completedTasks = sortCompleted(searchedTasks where completed)
```

## Filters

Current filters are implicit status filters:

- Pending section: `tasks.filter((task) => !task.completed)`
- Completed section: `tasks.filter((task) => task.completed)`

There are no user-controlled filter controls today.

If adding filters:

- Apply filters after `getTasksByDate(date)` and before sorting.
- Keep status filtering clear and explicit.
- Consider whether filters affect:
  - visible task lists only.
  - header stats.
  - section counts.
- Prefer local view state for UI-only filters.
- Add reusable filter helpers only when multiple views need them.

Possible future filters:

- Points range.
- Completion status toggle.
- Created/updated/completed time range.
- Text search.

## Sorting

### Pending Sort

Private `sortPending(tasks)`:

```text
higher points first
then older createdAt first
```

Implementation details:

- Returns a copied array with `[...tasks]`.
- Does not mutate the input array.
- Compares `points` descending.
- Uses `new Date(createdAt)` for tie-breaks.

### Completed Sort

Private `sortCompleted(tasks)`:

```text
newer completedAt/updatedAt first
then newer updatedAt first
```

Implementation details:

- Returns a copied array with `[...tasks]`.
- Does not mutate the input array.
- Uses `completedAt ?? updatedAt` as primary time.
- Uses `updatedAt` as secondary time.

### Sorting Guidelines

- Keep sorting helpers pure.
- Do not mutate the array returned by storage unless intentional.
- If adding user-selectable sort modes, centralize the sort mode selection near `renderDayView`.
- Preserve existing default order unless the user requests a behavior change.

## UI Pieces Inside `tasks.js`

- `buildTaskForm({ date, task })`
  - Private form builder for create/edit modal.

- `renderTaskCard(task)`
  - Private card builder with details, edit, toggle, and delete actions.

- `renderTaskSection(title, tasks, emptyText)`
  - Private section builder for pending/completed task lists.

- `metaRow(label, value)`
  - Private detail metadata row builder.

- `icon(path, className)`
  - Private inline SVG helper for trusted static icon paths.

## Dependencies

- Components:
  - `openModal`, `closeModal`
  - `openDeleteDialog`
  - `showToast`

- Storage:
  - `calculateStats`
  - `createTask`
  - `deleteTask`
  - `getTaskById`
  - `getTasksByDate`
  - `toggleTaskStatus`
  - `updateTask`

- Router:
  - `navigateToCalendar`

- Utils:
  - `createElement`
  - `formatHumanDate`
  - `formatTime`
  - `formatTimestamp`

## Extension Guidelines

### Adding A Task Field

1. Update `storage.js` normalization first.
2. Add input UI in `buildTaskForm`.
3. Add validation in `validateTaskForm`.
4. Include the field in submitted `values`.
5. Render it in `renderTaskCard` or `openTaskDetailModal` if user-visible.
6. Update sorting/filtering only if the field affects list behavior.
7. Keep labels and validation messages in Spanish.

### Adding A New Task Action

1. Implement storage behavior in `storage.js` if data changes.
2. Add a private handler in `tasks.js`.
3. Add buttons in both `renderTaskCard` and `openTaskDetailModal` when appropriate.
4. Use existing modal/confirm/toast components.
5. Call `rerender()` after mutations.

### Adding Search Or Filter UI

1. Decide whether state is local to day view or route-backed.
2. Add controls near the day header.
3. Apply query/filter transformations before status split and sorting.
4. Keep empty states accurate for filtered results.
5. Avoid changing persisted data for temporary filters.

### Adding A New Section

1. Derive the section task array from the day task list.
2. Add a pure sort helper if needed.
3. Reuse `renderTaskSection` when the card layout still applies.
4. Keep counts based on the section's rendered tasks.

## Things To Avoid

- Do not access `localStorage` directly from `tasks.js`.
- Do not create a second modal, confirm, or toast implementation.
- Do not insert user-provided task text with `innerHTML`.
- Do not skip `rerender()` after successful mutations.
- Do not move route parsing into this file.
- Do not make search/filter state persistent unless explicitly required.
- Do not change validation limits without updating `storage.js`.
