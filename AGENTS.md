# AGENTS.md

## Scope

- Applies to the entire repository.
- This is the primary knowledge base for future Codex sessions.
- Do not modify project code when the user asks only for documentation.

## Project Overview

- Browser-only daily task calendar.
- Language/UI copy: Spanish.
- Stack: Vite, vanilla ES modules, Tailwind CSS v4 via `@tailwindcss/vite`.
- No backend, database, auth, framework, calendar library, or client state library.
- Data is persisted only in browser `localStorage`.
- Production build is deployed to GitHub Pages from `master`.

## Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview build: `npm run preview`
- Deployment workflow uses Node 20 and `npm ci`.

## Architecture

- Entry point: `src/main.js`.
- Rendering model: imperative DOM creation with `document.createElement`, `replaceChildren`, and event listeners.
- App state is a small in-memory object in `main.js`; persisted task state lives in `localStorage`.
- Route changes trigger full view rerenders.
- Calendar and day views are independent render functions that return DOM nodes.
- Task mutations go through `src/storage.js`, then call the rerender callback registered by `setTaskRerender`.
- Components are simple DOM helpers, not framework components.

## Folder Structure

- `index.html`: Spanish HTML shell and root mounts: `#app`, `#toast-root`, `#modal-root`, `#confirm-root`.
- `vite.config.js`: Vite config, Tailwind plugin, GitHub Pages base `/daily-task/`.
- `src/main.js`: app bootstrap, global render function, route/view selection, state object.
- `src/router.js`: hash route parsing and navigation helpers.
- `src/calendar.js`: month calendar UI, month stats, date cells, month navigation.
- `src/tasks.js`: day view, task cards, form modal, detail modal, validation, task actions.
- `src/storage.js`: localStorage access, task normalization, CRUD, stats.
- `src/utils.js`: date formatting/parsing, DOM helper, ID generation, focus helpers.
- `src/components/modal.js`: accessible modal with focus trap and Escape/backdrop close.
- `src/components/confirm-dialog.js`: delete confirmation dialog.
- `src/components/toast.js`: temporary toast notifications.
- `src/styles.css`: Tailwind import plus shared component classes.
- `.github/workflows/deploy.yml`: GitHub Pages deployment.
- `dist/`: generated build output; do not edit directly.
- `node_modules/`: installed dependencies; do not edit.

## Routing

- Routing is hash-based.
- Calendar route: `#/`.
- Day route: `#/day/YYYY-MM-DD`.
- `getRoute()` validates day route dates with `isValidDateKey`.
- Invalid or unknown hashes resolve to `{ name: 'calendar' }`.
- `navigateToCalendar()` sets `window.location.hash = '#/'`.
- `navigateToDay(dateKey)` only navigates when `dateKey` is valid.
- `main.js` listens for `hashchange` and rerenders.
- If no hash exists at startup, `main.js` redirects to `#/`.

## State Management

- `main.js` owns transient view state:
  - `currentMonth`: first day of displayed month.
  - `selectedDate`: currently viewed day route date or `null`.
  - `activeModal`: currently unused; avoid expanding unless needed.
- Do not introduce Redux, Zustand, signals, context, or framework state.
- Keep state derivable where possible. Task lists and stats should be read from storage during render.
- After storage mutations, call the registered rerender callback and show a toast when user-visible.

## Storage

- Stable localStorage key: `dailyTasksCalendar.tasks`.
- All storage access must go through `src/storage.js`.
- Stored value must be a JSON array of normalized task objects.
- `getTasks()` safely handles missing, malformed, or non-array data and returns `[]`.
- `saveTasks()` normalizes before writing and returns the normalized list.
- Duplicate IDs are dropped during normalization.
- Never bypass normalization for persisted tasks.

## Task Model

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

- `date` is a local date key, not a UTC timestamp.
- Event timestamps use ISO strings.
- `name`: trimmed, 2-80 characters.
- `description`: trimmed, 3-500 characters.
- `points`: integer clamped from 1 to 10.
- IDs use `crypto.randomUUID()` with a timestamp/random fallback.

## Date Rules

- Date keys are always `YYYY-MM-DD`.
- Use `formatDateKey`, `parseDateKey`, and `isValidDateKey`.
- Do not parse date keys with `new Date("YYYY-MM-DD")`; that can introduce timezone bugs.
- Calendars start weeks on Monday.
- Locale formatting uses `es-MX`.

## Coding Conventions

- Use vanilla ES modules and named exports.
- Prefer small pure helpers in `utils.js` or feature-local private functions.
- Build DOM with `createElement()` and safe `textContent`.
- Use `innerHTML` only for trusted inline SVG icon markup.
- Add event listeners close to the element creation.
- Keep render functions returning DOM nodes; do not return HTML strings.
- Use early returns for invalid routes, missing tasks, and no-op actions.
- Keep validation duplicated intentionally where needed: form validation for UX, storage normalization for safety.
- Use ASCII text unless editing a file that already intentionally uses non-ASCII.

## Naming Conventions

- Files: lowercase kebab-case where applicable, e.g. `confirm-dialog.js`.
- Render functions: `renderXView`, `renderXSection`, `renderXCard`, `renderXGrid`.
- Actions/handlers: `handleX`, `openX`, `closeX`, `navigateToX`.
- Storage functions: CRUD/stat verbs such as `getTasks`, `createTask`, `updateTask`, `deleteTask`, `calculateStats`.
- Date variables:
  - `dateKey` for `YYYY-MM-DD` strings.
  - `monthDate` for a `Date` object representing the month.
  - `date` may be used for route day strings where existing code already does.

## UI Philosophy

- Practical task-management UI, not a marketing page.
- Spanish copy throughout.
- Light theme with slate surfaces, indigo primary actions, green complete state, amber pending/warning state, red danger state.
- Responsive first: desktop, tablet, and mobile layouts must be usable.
- Use Tailwind utility classes and shared classes from `src/styles.css`.
- Reuse `primary-button`, `secondary-button`, `danger-button`, `icon-button`, and `focus-ring`.
- Keep controls accessible with labels, `aria-label`, `aria-pressed`, `aria-live`, semantic buttons, and focus rings.
- Modals must trap focus, close on Escape/backdrop, restore previous focus, and set `body.modal-open`.
- Do not add decorative-only complexity or a separate design system.

## Error Handling

- Storage read errors are recovered with an empty task list and `console.warn`.
- Invalid persisted task records are ignored by normalization.
- Invalid create data throws `Error('Datos de tarea invalidos')`.
- Missing task lookup in detail modal returns without opening UI.
- Invalid navigation input is ignored.
- User-facing success/warning/info states should use `showToast`.
- Do not use blocking browser dialogs (`alert`, `confirm`, `prompt`); use existing modal/confirm/toast components.

## Existing Utilities

- Date: `padNumber`, `formatDateKey`, `parseDateKey`, `isValidDateKey`, `formatHumanDate`, `formatMonthYear`, `formatTimestamp`, `formatTime`.
- Calendar math: `getDaysInMonth`, `getMondayBasedWeekdayIndex`, `getPreviousMonth`, `getNextMonth`, `getMonthKey`, `isToday`, `isSameDateKey`.
- Data: `clampInteger`, `generateId`.
- DOM/accessibility: `createElement`, `getFocusableElements`.
- Constants: `WEEKDAY_LABELS`.

## Reusable Components

- `openModal({ title, content, actions, labelledById, maxWidth })`
- `closeModal()`
- `openDeleteDialog({ taskName, onConfirm })`
- `closeConfirmDialog()`
- `showToast(message, type)`
- Toast types: `success`, `info`, `warning`, `error`.

## Project Rules

- Do not modify `dist/` directly; regenerate with `npm run build` when appropriate.
- Do not edit `node_modules/`.
- Do not change `vite.config.js` base path unless deployment target changes.
- Keep all task persistence behind `src/storage.js`.
- Keep all route mutations behind `src/router.js`.
- Preserve hash routing unless the user explicitly asks to redesign routing.
- Preserve Spanish UI copy unless the user requests localization changes.
- Keep the app framework-free unless explicitly requested.
- Validate forms inline and keep storage normalization defensive.
- When adding task fields, update normalization, form/detail rendering, stats if relevant, README/docs if requested, and backward compatibility for old stored records.

## Things To Never Do

- Never store date keys as UTC-derived strings from `new Date("YYYY-MM-DD")`.
- Never write malformed or partially normalized task objects to localStorage.
- Never replace custom modals with browser `alert`, `confirm`, or `prompt`.
- Never introduce a backend, auth, database, framework, or heavy calendar library without explicit user direction.
- Never rely on generated `dist/` as the source of truth.
- Never use untrusted user text with `innerHTML`.
- Never remove focus management from modal or confirm dialog behavior.
- Never break browser back-button support for day/calendar navigation.
- Never silently change the localStorage key.

## Future Feature Implementation

- Start by identifying whether the feature is view logic, route logic, storage logic, or utility logic.
- Put reusable persistence behavior in `storage.js`; keep UI modules free of raw localStorage calls.
- Add route helpers in `router.js` before adding direct hash manipulation elsewhere.
- Add date operations to `utils.js` and use local date construction.
- Add new UI flows as DOM-returning render helpers or modal content builders.
- Reuse existing button classes, modal/toast/confirm components, stats helpers, and date utilities.
- Preserve the mutation flow: validate input, call storage function, show toast, close modal if relevant, rerender.
- Prefer small feature-local helper functions before creating new top-level modules.
- If introducing tests later, focus first on `utils.js`, `storage.js`, and `router.js` because they contain the most deterministic behavior.
