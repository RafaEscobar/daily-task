# Storage Guide

## Purpose

- Documents `src/storage.js` for future AI agents.
- Storage is the persistence boundary for all task data.
- No other source file should read or write `localStorage` directly.

## Storage Backend

- Backend: browser `localStorage`.
- Access pattern: synchronous reads and writes.
- Remote sync: none.
- Database: none.
- Cache layer: none.
- Data owner: `src/storage.js`.

## Keys

- `STORAGE_KEY`
  - Value: `dailyTasksCalendar.tasks`
  - Purpose: stores all tasks as one JSON array.

Do not rename this key unless explicitly performing a storage migration. Existing users' saved data depends on it.

## Storage Format

Stored value is a JSON string representing an array of normalized task objects.

```js
[
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
]
```

## Task Field Contract

- `id`
  - Non-empty string.
  - Generated with `crypto.randomUUID()` through `generateId()` when missing during normalization.

- `date`
  - Required local date key.
  - Exact format: `YYYY-MM-DD`.
  - Must pass `isValidDateKey()`.

- `name`
  - Required string.
  - Trimmed.
  - Minimum length: 2.
  - Maximum persisted length: 80.

- `description`
  - Required string.
  - Trimmed.
  - Minimum length: 3.
  - Maximum persisted length: 500.

- `points`
  - Integer from 1 to 10.
  - Normalized with `clampInteger(rawTask.points, 1, 10)`.
  - Non-integer values become `1`.

- `completed`
  - Boolean.
  - Normalized with `Boolean(rawTask.completed)`.

- `createdAt`
  - ISO-like timestamp string.
  - If missing or invalid, replaced with current `nowIso()`.

- `updatedAt`
  - ISO-like timestamp string.
  - If missing or invalid, replaced with current `nowIso()`.

- `completedAt`
  - String only when `completed === true` and the raw value is a string.
  - Otherwise `null`.

## Serialization

- Read path uses `JSON.parse`.
- Write path uses `JSON.stringify`.
- Only normalized arrays are written.
- Serialization is centralized in:
  - `getTasks()`
  - `saveTasks(tasks)`
- Do not serialize tasks in UI modules.

## Read Flow

```text
caller
  -> getTasks()
  -> localStorage.getItem(STORAGE_KEY)
  -> if missing: []
  -> JSON.parse(raw)
  -> if parsed is not an array: warn and []
  -> normalizeTasks(parsed)
  -> return normalized tasks
```

Important behavior:

- Missing key returns `[]`.
- Malformed JSON is caught.
- Non-array parsed data is rejected.
- Recovery logs a Spanish `console.warn`.
- Invalid task records are dropped.
- Duplicate IDs are dropped after the first valid occurrence.

## Write Flow

```text
caller
  -> saveTasks(tasks)
  -> normalizeTasks(tasks)
  -> JSON.stringify(normalized)
  -> localStorage.setItem(STORAGE_KEY, serialized)
  -> return normalized
```

Important behavior:

- Every write normalizes the full array.
- Invalid records are not persisted.
- Callers receive the normalized data that was written.
- `localStorage.setItem` errors are not currently caught.

## CRUD Flows

### Create

```text
createTask(taskData)
  -> nowIso()
  -> normalizeTask({ ...taskData, id, completed: false, timestamps })
  -> if invalid: throw Error('Datos de tarea invalidos')
  -> getTasks()
  -> saveTasks([...tasks, task])
  -> return task
```

- Creation always starts as incomplete.
- `createdAt` and `updatedAt` are set to the same timestamp.
- `completedAt` starts as `null`.

### Update

```text
updateTask(taskId, updates)
  -> getTasks()
  -> map matching task
  -> normalizeTask({ ...task, ...updates, id: original, createdAt: original, updatedAt: nowIso() })
  -> saveTasks(tasks)
  -> return updatedTask or null
```

- `id` cannot be changed by updates.
- `createdAt` cannot be changed by updates.
- `updatedAt` is refreshed.
- If merged data cannot normalize, the original task remains.

### Delete

```text
deleteTask(taskId)
  -> getTasks()
  -> filter out matching id
  -> saveTasks(nextTasks)
  -> return true if removed, false otherwise
```

### Toggle Completion

```text
toggleTaskStatus(taskId)
  -> getTasks()
  -> invert completed on matching task
  -> completedAt = nowIso() when completed
  -> completedAt = null when restored to pending
  -> updatedAt = nowIso()
  -> saveTasks(tasks)
  -> return changedTask or null
```

### Lookup

```text
getTaskById(taskId)
  -> getTasks()
  -> find matching id
  -> return task or null
```

### Query By Date

```text
getTasksByDate(date)
  -> getTasks()
  -> filter task.date === date
```

## Stats Flow

- `calculateStats(tasks)` is pure and does not read storage.
- `getDateStats(date)` reads tasks for a date and delegates to `calculateStats`.
- `getMonthStats(monthDate)` reads all tasks, filters by year/month, and delegates to `calculateStats`.

Stats object:

```js
{
  total,
  pending,
  completed,
  totalPoints,
  pendingPoints,
  completedPoints,
  completionPercentage
}
```

## Cache Strategy

- Current strategy: no cache.
- Every query reads from `localStorage` and normalizes.
- Benefits:
  - Simple source of truth.
  - Safe recovery from manually edited/corrupt stored data.
  - No stale in-memory task snapshots.
- Costs:
  - Repeated reads during render can reparse the same JSON.
  - Calendar rendering calls date stats repeatedly.

Do not add caching unless there is a measured performance problem. If caching is introduced, it must preserve normalization guarantees and update correctly after every mutation.

## Current Callers

- `src/calendar.js`
  - `getDateStats(dateKey)` for each rendered date cell.
  - `getMonthStats(monthDate)` for the month summary.

- `src/tasks.js`
  - `getTasksByDate(date)` for day rendering.
  - `calculateStats(tasks)` for day summary.
  - `createTask`, `updateTask`, `deleteTask`, `toggleTaskStatus` for mutations.
  - `getTaskById(taskId)` for detail modal.

## Error Handling

- Read errors recover to `[]`.
- Invalid parsed shape recovers to `[]`.
- Invalid individual records are ignored silently.
- Duplicate IDs are ignored silently after first occurrence.
- Invalid create data throws a Spanish error message.
- Update/delete/toggle missing IDs do not throw.
- Write failures from `localStorage.setItem` are not handled today.

## Future Extension Guidelines

### Adding A Task Field

1. Add default/backward-compatible handling in `normalizeTask`.
2. Accept missing field values from older stored records.
3. Keep invalid field values from corrupting the whole task when possible.
4. Update create/update UI in `tasks.js`.
5. Update detail rendering in `tasks.js` if the field is user-visible.
6. Update stats helpers only if the new field affects calculations.
7. Update docs after the contract changes.

### Adding A New Query

- Prefer a storage helper instead of filtering in UI modules when the query is reused.
- Base queries on `getTasks()` so normalization remains centralized.
- Keep pure transformations separate when useful, like `calculateStats(tasks)`.

### Adding Import/Export

- Import must parse external JSON defensively.
- Imported arrays must pass through `normalizeTasks`.
- Save only with `saveTasks`.
- Export should use `getTasks()` so exported data is normalized.

### Adding Migrations

- Prefer normalization-based migrations.
- Do not require a one-time migration for fields that can be defaulted safely.
- If the key must change, read the old key, normalize, write the new key, and keep fallback behavior.
- Never discard valid existing tasks because a new optional field is missing.

### Adding Caching

- Keep `localStorage` as the persistence source of truth.
- Invalidate cache after every write.
- Ensure external/corrupt storage recovery still works.
- Avoid returning mutable shared arrays that callers can accidentally mutate.
- Document cache semantics in this file if added.

### Adding Async Storage Later

- This app currently assumes synchronous storage.
- Moving to IndexedDB or remote sync would require changing callers and rerender timing.
- Introduce async storage only with a deliberate architecture change.

## Things To Avoid

- Do not access `localStorage` outside `storage.js`.
- Do not write unnormalized task data.
- Do not change `STORAGE_KEY` casually.
- Do not parse task date keys with UTC-sensitive date parsing.
- Do not make UI modules responsible for storage recovery.
- Do not throw on corrupt stored arrays during read; recover safely.
- Do not introduce hidden in-memory state that can disagree with persisted tasks.
