# Utilities Guide

## Purpose

- Documents `src/utils.js` for future AI agents.
- `utils.js` contains shared low-level helpers used across routing, storage, views, and components.
- Prefer reusing these helpers before adding feature-local duplicates.

## Utility Categories

- Date-key helpers.
- Display formatting helpers.
- Calendar math helpers.
- Numeric normalization helpers.
- DOM creation helpers.
- ID generation helpers.
- Accessibility/focus helpers.
- Shared calendar labels.

## Shared Constants

### `WEEKDAY_LABELS`

```js
['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
```

- Monday-first weekday labels.
- Used by `calendar.js`.
- Keep Spanish abbreviations unless the app is intentionally localized.

## Date-Key Helpers

### `padNumber(value)`

- Converts a value to string and pads to two characters with leading zero.
- Used by date/month key formatters.

### `formatDateKey(date)`

- Converts a local `Date` object into `YYYY-MM-DD`.
- Uses local date getters:
  - `getFullYear()`
  - `getMonth()`
  - `getDate()`
- Use this whenever creating task date keys or route date parameters.

### `parseDateKey(dateKey)`

- Parses and validates `YYYY-MM-DD`.
- Returns a local `Date` object for valid keys.
- Returns `null` for invalid input.
- Rejects impossible dates through a round-trip check.

Important implementation:

```text
YYYY-MM-DD string
  -> regex match
  -> Number(year/month/day)
  -> new Date(year, month - 1, day)
  -> verify parsed year/month/day match input
```

### `isValidDateKey(dateKey)`

- Boolean wrapper around `parseDateKey`.
- Use for route parameter validation and storage record validation.

## Display Formatting Helpers

### `formatHumanDate(dateKey, options = {})`

- Formats a date key with `Intl.DateTimeFormat('es-MX')`.
- Defaults to long weekday, long month, numeric day, numeric year.
- Accepts `options.weekday` override.
- Returns `Fecha invalida` when the date key is invalid.

### `formatMonthYear(date)`

- Formats a `Date` object as month/year in `es-MX`.
- Used by the calendar header.

### `formatTimestamp(value)`

- Formats timestamp-like values with month, day, year, hour, and minute.
- Returns `No disponible` for missing or invalid values.
- Used in task detail metadata.

### `formatTime(value)`

- Formats timestamp-like values as hour/minute.
- Returns `No disponible` for missing or invalid values.
- Used in task card metadata.

## Calendar Math Helpers

### `getDaysInMonth(year, monthIndex)`

- Returns the number of days in a local month.
- `monthIndex` is zero-based, matching JavaScript `Date`.

### `getMondayBasedWeekdayIndex(date)`

- Converts JavaScript Sunday-first `getDay()` output into Monday-first grid index.
- Formula: `(date.getDay() + 6) % 7`.
- Used to calculate leading empty cells in the calendar grid.

### `isToday(dateKey)`

- Compares a date key to today's local date key.
- Uses `formatDateKey(new Date())`.

### `isSameDateKey(first, second)`

- Simple string equality for date keys.
- Used to mark selected calendar date.

### `getPreviousMonth(date)`

- Returns a `Date` for the first day of the previous month.

### `getNextMonth(date)`

- Returns a `Date` for the first day of the next month.

### `getMonthKey(date)`

- Returns `YYYY-MM`.
- Currently exported but not used by source modules.
- Useful for future month-level route or grouping features.

## Numeric Helpers

### `clampInteger(value, min, max)`

- Converts `value` with `Number(value)`.
- If the converted value is not an integer, returns `min`.
- Otherwise clamps value between `min` and `max`.
- Used by storage normalization for task points.

## DOM Helpers

### `createElement(tag, options = {})`

- Creates a DOM element and applies common options.

Supported options:

- `className`
  - Assigned to `element.className`.

- `text`
  - Assigned to `element.textContent`.
  - Safe for user-provided content.

- `html`
  - Assigned to `element.innerHTML`.
  - Only safe for trusted static markup.

- `attrs`
  - Object of attributes set through `setAttribute`.
  - `null` and `undefined` values are skipped.

Use this helper for most DOM creation in app modules.

## ID Helpers

### `generateId()`

- Uses `globalThis.crypto.randomUUID()` when available.
- Falls back to `task-${Date.now()}-${randomString}`.
- Used by `storage.js` for task IDs.
- Not cryptographic in fallback mode; adequate for local task IDs.

## Accessibility / Focus Helpers

### `getFocusableElements(container)`

- Returns focusable descendants of `container`.
- Selector includes:
  - links with `href`
  - enabled buttons
  - enabled inputs
  - enabled textareas
  - enabled selects
  - focusable elements with `tabindex` except `tabindex="-1"`
- Filters out elements with the `hidden` attribute.
- Used by modal and confirm dialog focus traps.

## Current Usage By Module

- `router.js`
  - `formatDateKey`
  - `isValidDateKey`
  - `parseDateKey`

- `storage.js`
  - `clampInteger`
  - `generateId`
  - `isValidDateKey`

- `calendar.js`
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

- `tasks.js`
  - `createElement`
  - `formatHumanDate`
  - `formatTime`
  - `formatTimestamp`

- `components/modal.js`
  - `createElement`
  - `getFocusableElements`

- `components/confirm-dialog.js`
  - `createElement`
  - `getFocusableElements`

- `components/toast.js`
  - `createElement`

## Reuse Guidelines

### Date Keys

- Always create date keys with `formatDateKey`.
- Always validate route/storage date keys with `isValidDateKey`.
- Use `parseDateKey` when a date key must become a `Date`.
- Keep task `date` fields as local date keys, not timestamps.

### Formatting

- Use existing `es-MX` formatting helpers for UI dates/times.
- Add new formatting helpers here if multiple modules need the same display format.
- Keep invalid fallback strings in Spanish.

### DOM Creation

- Use `createElement({ text })` for user-provided text.
- Use `createElement({ attrs })` for accessibility attributes and form metadata.
- Build child structure with `.append(...)`.
- Attach event listeners in the module creating the interactive element.

### Focus Management

- Use `getFocusableElements` for any future overlay, modal, popover, or trapped-focus UI.
- Preserve Escape, Tab, Shift+Tab, and previous-focus behavior in overlay components.

### New Utilities

- Add a helper to `utils.js` only when:
  - It is used by multiple modules, or
  - It encodes a project-wide invariant such as local date-key parsing.
- Keep feature-specific helpers private to the feature module.
- Prefer pure functions when possible.
- Avoid adding helpers that hide significant side effects.

## Anti-Patterns

- Do not parse task date keys with `new Date("YYYY-MM-DD")`.
- Do not duplicate date-key regexes outside `utils.js` unless there is a narrow parser with different semantics.
- Do not manually build `YYYY-MM-DD` strings outside `formatDateKey`.
- Do not insert user-provided text with `innerHTML`.
- Do not use `createElement({ html })` for dynamic or stored content.
- Do not add generic utilities before there are real repeated call sites.
- Do not move feature business logic into `utils.js`.
- Do not make `utils.js` depend on app feature modules such as `storage.js`, `router.js`, `calendar.js`, or `tasks.js`.
- Do not change Spanish locale formatting casually; UI copy and date formatting are currently Spanish/Mexico oriented.
- Do not remove local-date validation round trips from `parseDateKey`.
