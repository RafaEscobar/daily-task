# Project Conventions

## Purpose

- This document defines conventions future AI agents must follow when generating or editing code.
- It consolidates naming, structure, formatting, error handling, performance, and organization rules.
- Existing source patterns take precedence over generic preferences.

## Core Principles

- Keep the app framework-free and browser-only.
- Prefer small ES modules and direct DOM construction.
- Keep persisted task data behind `src/storage.js`.
- Keep hash routing behind `src/router.js`.
- Keep UI copy in Spanish.
- Keep generated code consistent with the current Tailwind utility style.
- Do not modify generated `dist/` files as source.

## Naming Conventions

### Files And Folders

- Use lowercase file names.
- Use kebab-case for multiword files:
  - `confirm-dialog.js`
  - `architecture.md`
- Use simple singular folder names unless the folder contains a collection:
  - `src/components`
  - `docs/agents`

### Functions

- Renderers: `renderXView`, `renderXSection`, `renderXCard`, `renderXGrid`.
- Modal/dialog openers: `openXModal`, `openXDialog`, `openX`.
- Closers: `closeX`.
- Event handlers: `handleX`.
- Navigation helpers: `navigateToX`.
- Storage CRUD: `getX`, `createX`, `updateX`, `deleteX`.
- Stats helpers: `calculateX`, `getXStats`.
- Boolean validators: `isX`.
- Formatters: `formatX`.
- Parsers: `parseX`.

### Variables

- Use descriptive camelCase.
- Use `dateKey` for `YYYY-MM-DD` strings.
- Use `monthDate` for `Date` objects representing a month.
- Use `taskId` for task ID strings.
- Use `tasks`, `pendingTasks`, and `completedTasks` for task arrays.
- Use `container`, `section`, `header`, `actions`, `content`, and `wrapper` for DOM nodes.
- Use `stats` for objects returned by `calculateStats`.

## Folder Conventions

- `src/`
  - Application source only.
  - Keep top-level feature modules flat while the app is small.

- `src/components/`
  - Reusable DOM UI primitives only.
  - Existing primitives: modal, confirm dialog, toast.

- `docs/agents/`
  - Agent-facing architecture and convention documentation.
  - Keep files focused by topic.

- `.github/workflows/`
  - CI/deployment workflows.

- `dist/`
  - Generated build output.
  - Do not edit manually.

- `node_modules/`
  - Installed dependencies.
  - Do not edit.

## File Conventions

- One module should have one clear responsibility.
- Export only functions/constants needed by other modules.
- Keep feature-local helpers private when only one file uses them.
- Place imports at the top.
- Put public exports near related private helpers when that improves readability; no central export barrel exists.
- Do not introduce index barrel files unless module count and reuse justify it.
- Keep docs in Markdown with concise, agent-oriented headings and bullets.

## Import Conventions

- Use ES module syntax.
- Use relative imports inside `src/`:
  - `./utils.js`
  - `../utils.js`
- Include `.js` extensions in local JavaScript imports.
- Import named exports directly.
- Avoid default exports in app source unless there is a strong reason.
- Do not add path aliases for the current project size.
- Do not create circular dependencies.

Current dependency direction:

```text
main.js
  -> views/router

views
  -> router/storage/utils/components

components
  -> utils

storage/router
  -> utils

utils
  -> no app modules
```

## Formatting Conventions

- Use 2-space indentation.
- Use semicolons.
- Use single quotes for JavaScript strings.
- Use trailing commas in multiline object/function calls when already present.
- Keep line length practical; wrap long class strings only when readability improves.
- Prefer early returns for invalid input and no-op branches.
- Use object destructuring for grouped parameters where existing APIs do:
  - `renderCalendarView({ state, onMonthChange })`
  - `openModal({ title, content, actions, maxWidth })`
- Keep Markdown concise, structured, and direct.

## Comment Conventions

- Existing code has almost no comments.
- Prefer self-explanatory names and small helpers over comments.
- Add comments only for non-obvious behavior, invariants, or browser quirks.
- Good comment targets:
  - local date parsing invariants.
  - focus trap edge cases.
  - storage migration decisions.
- Avoid comments that merely restate the code.

## Function Conventions

- Keep functions small and purpose-specific.
- Render functions return DOM nodes.
- Render functions should not return HTML strings.
- Event listeners should be attached near element creation.
- Mutating task flows should follow:

```text
validate input
  -> call storage function
  -> show toast if user-visible
  -> close modal/dialog if relevant
  -> rerender()
```

- Keep pure transformations pure:
  - sorting helpers return copied arrays.
  - stats helpers should not mutate input.
- Keep storage normalization defensive and centralized.
- Add new route helpers before calling `window.location.hash` from views.

## DOM And UI Conventions

- Build DOM with `createElement()` from `src/utils.js`.
- Use `createElement({ text })` for user-provided content.
- Use `innerHTML` only for trusted static inline SVG icons.
- Use semantic buttons for interactive actions.
- Add `type="button"` to buttons that are not submit buttons.
- Preserve accessibility attributes:
  - labels for inputs.
  - `aria-label` for icon/ambiguous controls.
  - `aria-pressed` for toggle-like controls.
  - `role="dialog"` and `aria-modal="true"` for dialogs.
- Reuse:
  - `openModal`
  - `openDeleteDialog`
  - `showToast`
  - shared button classes from `src/styles.css`.

## Error Handling Conventions

- Invalid route input should no-op or fall back to calendar route.
- Corrupt storage should recover safely with `[]` and `console.warn`.
- Invalid persisted records should be ignored by normalization.
- Missing task lookups should no-op in UI flows.
- Invalid create data may throw from `storage.js`; UI should validate before calling it.
- User-facing mutation feedback should use `showToast`.
- Do not use browser `alert`, `confirm`, or `prompt`.
- Keep user-visible messages in Spanish.

## Date And Time Conventions

- Task dates are local `YYYY-MM-DD` date keys.
- Use `formatDateKey`, `parseDateKey`, and `isValidDateKey`.
- Do not parse date keys with `new Date("YYYY-MM-DD")`.
- Use ISO strings for event timestamps:
  - `createdAt`
  - `updatedAt`
  - `completedAt`
- Use `Intl.DateTimeFormat('es-MX')` through existing utility helpers for display.
- Calendar weeks start on Monday.

## Storage Conventions

- Only `src/storage.js` should touch `localStorage`.
- Stable key: `dailyTasksCalendar.tasks`.
- Always normalize before writing.
- Always read through storage helpers.
- Add task fields by extending normalization first.
- Preserve backward compatibility with old stored task records.
- Do not introduce in-memory caching unless performance measurements justify it.

## Routing Conventions

- Routing is hash-based.
- Current routes:
  - `#/`
  - `#/day/YYYY-MM-DD`
- `router.js` owns route parsing and hash construction.
- `main.js` owns route-to-view rendering.
- Add `navigateToX()` helpers for new routes.
- Validate dynamic route parameters.
- Unknown routes should remain safe and recover to calendar behavior.

## Styling Conventions

- Use Tailwind utility classes inline for feature-local styling.
- Use shared classes from `src/styles.css` for common controls:
  - `primary-button`
  - `secondary-button`
  - `danger-button`
  - `icon-button`
  - `focus-ring`
  - `calendar-cell`
- Keep slate neutral surfaces, indigo primary actions, green completed state, amber pending/warning state, and red danger/error state.
- Use responsive mobile-first classes.
- Keep focus rings visible.
- Do not introduce a new theme, gradient-heavy design, or decorative UI system.

## Performance Conventions

- Current data size is expected to be small and local.
- Full view rerender with `replaceChildren` is acceptable.
- Avoid premature caching or state libraries.
- Sorting helpers should copy arrays before sorting.
- Avoid repeated expensive DOM queries outside local render/component scope.
- Keep event listeners attached to newly created elements during render.
- Do not add heavy dependencies for simple local behavior.
- If performance becomes a concern, measure first and preserve existing storage and rendering contracts.

## Code Organization Rules

- Put route concerns in `router.js`.
- Put persistence, normalization, CRUD, and stats in `storage.js`.
- Put shared date/DOM/format/focus helpers in `utils.js`.
- Put calendar month UI in `calendar.js`.
- Put day task UI and task interaction flows in `tasks.js`.
- Put reusable overlays/notifications in `src/components/`.
- Keep feature-specific private helpers in the feature module until reused.
- Update agent docs when architecture or conventions change.

## Always Follow When Generating New Code

- Match the existing vanilla JS style.
- Use named ES exports.
- Use local date-key utilities.
- Use `createElement` and text-safe DOM insertion.
- Keep Spanish UI copy.
- Validate user input before storage mutations.
- Normalize persisted data through `storage.js`.
- Use router helpers for navigation.
- Reuse existing modal, confirm dialog, toast, and button classes.
- Trigger rerender after successful task mutations.
- Preserve accessibility and focus management.
- Keep edits scoped to the requested feature.

## Never Do

- Never edit `dist/` or `node_modules/` directly.
- Never bypass `storage.js` for task persistence.
- Never bypass `router.js` for route hash construction.
- Never use `innerHTML` for user or stored task content.
- Never introduce a framework, backend, database, auth, or heavy state library without explicit direction.
- Never break browser back/forward navigation.
- Never silently change `STORAGE_KEY`.
- Never remove modal focus trapping or visible focus styles.
