# Anti-Patterns And Regression Risks

## Purpose

- Helps future AI agents avoid regressions.
- Lists project assumptions, dangerous refactors, and mistakes to avoid.
- Use this before changing architecture, routing, storage, styling, or shared components.

## Things That Should Never Be Changed Casually

- Do not change the localStorage key `dailyTasksCalendar.tasks`.
- Do not change task date format from local `YYYY-MM-DD`.
- Do not change timestamp fields away from ISO strings without migration.
- Do not remove hash routing or browser back/forward support.
- Do not change GitHub Pages base path `/daily-task/` without confirming deployment path.
- Do not remove root containers from `index.html`:
  - `#app`
  - `#toast-root`
  - `#modal-root`
  - `#confirm-root`
- Do not remove modal focus trapping, Escape close, backdrop close, or focus restoration.
- Do not replace custom dialogs with native `alert`, `confirm`, or `prompt`.
- Do not make generated `dist/` files the source of truth.

## Existing Assumptions

- The app is browser-only.
- There is no backend, database, auth, or server runtime.
- The app uses vanilla JavaScript ES modules.
- The UI language is Spanish.
- Dates are local date keys, not UTC date strings.
- Task data is small enough for synchronous localStorage reads.
- Full view rerenders are acceptable.
- Stats are derived from tasks and not persisted.
- `storage.js` owns persistence and normalization.
- `router.js` owns hash parsing and hash construction.
- `main.js` owns route-to-view rendering.
- Components are DOM helper modules, not framework components.
- Tailwind utilities and a small set of shared CSS classes define styling.

## Dangerous Refactors

### Framework Migration

Avoid introducing React, Vue, Svelte, Solid, or another UI framework unless explicitly requested.

Risk:

- Rewrites the core rendering model.
- Makes existing component docs and helpers obsolete.
- Adds dependency and build complexity that the app does not need.

### State Library Introduction

Avoid Redux, Zustand, MobX, signals, context-style stores, or global event buses.

Risk:

- Duplicates localStorage as source of truth.
- Creates stale state risks.
- Makes the current rerender callback pattern harder to reason about.

### Routing Redesign

Avoid replacing hash routing with History API routing or a router library.

Risk:

- Breaks GitHub Pages static hosting assumptions.
- Breaks browser back/forward behavior if not handled carefully.
- Requires deployment/server fallback changes.

### Storage Backend Replacement

Avoid replacing localStorage with IndexedDB, remote sync, or a database without an explicit architecture change.

Risk:

- Existing callers assume synchronous storage.
- Rerender flows are not async-aware.
- Data migration can lose user tasks.

### Component System Rewrite

Avoid replacing `modal.js`, `confirm-dialog.js`, and `toast.js` with parallel primitives.

Risk:

- Loses accessibility behavior.
- Creates inconsistent styling and event handling.
- Duplicates overlay roots and z-index behavior.

### Over-Abstraction

Avoid extracting tiny helpers into generic libraries before there is repeated need.

Risk:

- Makes simple DOM builders harder to read.
- Creates indirection in a small app.
- Hides feature behavior away from the feature module.

## Code Duplication To Avoid

- Date-key parsing/formatting.
  - Use `formatDateKey`, `parseDateKey`, `isValidDateKey`.

- localStorage reads/writes.
  - Use `storage.js`.

- Route hash construction.
  - Use `router.js` navigation helpers.

- Modal creation.
  - Use `openModal`.

- Delete confirmation.
  - Use `openDeleteDialog`.

- Toast notifications.
  - Use `showToast`.

- Button styling.
  - Use `primary-button`, `secondary-button`, `danger-button`, `icon-button`.

- Focus trap logic.
  - Reuse `getFocusableElements` and existing overlay patterns.

- Task stats calculations.
  - Use `calculateStats`, `getDateStats`, `getMonthStats`.

## Styling Mistakes To Avoid

- Do not introduce a separate visual theme.
- Do not add gradient-heavy or decorative marketing-style layouts.
- Do not use colors outside current semantics:
  - indigo: primary/info/selected.
  - green: completed/success.
  - amber: pending/warning.
  - red: destructive/error.
  - slate: neutral surfaces/text/borders.
- Do not remove visible focus rings.
- Do not create new button styles when shared classes fit.
- Do not use red for non-destructive actions.
- Do not use green for pending/neutral actions.
- Do not make calendar cells height depend entirely on content.
- Do not add large shadows or decorative animations to normal cards.
- Do not put normal page content into modal/toast/confirm roots.
- Do not edit generated `dist/assets/*.css`.

## Routing Mistakes To Avoid

- Do not write `window.location.hash` directly in view modules.
- Do not add route regexes outside `router.js`.
- Do not accept invalid dynamic route parameters.
- Do not throw on unknown hashes; fall back safely.
- Do not parse route dates with `new Date("YYYY-MM-DD")`.
- Do not add new routes without updating `main.js` route-to-view rendering.
- Do not make month navigation unexpectedly change routes unless requested.
- Do not break current routes:
  - `#/`
  - `#/day/YYYY-MM-DD`

## Storage Mistakes To Avoid

- Do not access `localStorage` outside `storage.js`.
- Do not write raw task objects without `saveTasks`.
- Do not bypass `normalizeTasks`.
- Do not persist derived stats.
- Do not silently change `STORAGE_KEY`.
- Do not reject all stored data because one task record is invalid.
- Do not drop valid old task records when adding optional fields.
- Do not make storage async without updating all callers.
- Do not cache task arrays without invalidating after every mutation.
- Do not parse task dates with UTC-sensitive constructors.
- Do not assume `localStorage.setItem` cannot fail if adding larger data features.

## DOM And Security Mistakes To Avoid

- Do not insert user-provided task names or descriptions with `innerHTML`.
- Do not build views as HTML strings.
- Do not omit `type="button"` on non-submit buttons inside or near forms.
- Do not remove ARIA labels from ambiguous buttons.
- Do not remove `aria-pressed` from point selector buttons if preserving that UI.
- Do not mount overlays inside `#app`.
- Do not leave global keydown listeners attached after closing overlays.

## Validation Mistakes To Avoid

- Do not trust UI validation as the only data safety layer.
- Do not remove storage normalization.
- Do not let task names shorter than 2 characters persist.
- Do not let descriptions shorter than 3 characters persist.
- Do not let points persist outside 1-10.
- Do not change form validation limits without updating storage normalization.
- Do not show validation messages in a different language unless localizing the full app.

## Performance Mistakes To Avoid

- Do not add heavy dependencies for simple DOM, date, or state behavior.
- Do not introduce expensive repeated global DOM queries.
- Do not mutate arrays in sorting helpers when a copied array is expected.
- Do not store every small UI state in localStorage.
- Do not optimize away full rerenders by adding complex incremental patching without measurement.
- Do not add caching that can disagree with localStorage.

## Build And Deployment Mistakes To Avoid

- Do not remove `"type": "module"` casually.
- Do not change `vite.config.js` `base` without deployment review.
- Do not bypass `npm ci` in GitHub Actions unless package management changes.
- Do not add server-only code to a static GitHub Pages app.
- Do not add secrets to client-exposed Vite environment variables.
- Do not edit `dist/` manually for production fixes.

## Safe Change Checklist

- Does the change preserve `storage.js` as the persistence boundary?
- Does the change preserve `router.js` as the navigation boundary?
- Does the change use local date-key helpers?
- Does the change keep user text out of `innerHTML`?
- Does the change reuse existing modal/confirm/toast/button primitives?
- Does the change keep Spanish copy?
- Does the change rerender after task mutations?
- Does the change avoid generated files?
- Does the change update docs when architecture or conventions change?
