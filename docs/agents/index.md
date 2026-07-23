# AI Documentation Index

## Purpose

- Central entry point for project AI documentation.
- Future agents should start here before implementing features.
- Use this file to decide which detailed guide to read next.

## Required First Reads

For any non-trivial code change, read these first:

- `AGENTS.md` at the repository root for project-wide rules and invariants.
- `docs/agents/index.md` for documentation routing.
- `docs/agents/anti-patterns.md` to avoid known regression risks.
- `docs/agents/conventions.md` for code-generation rules.
- `docs/agents/patterns.md` for preferred implementation patterns.

## Document Map

### `architecture.md`

Use for:

- Understanding the whole runtime architecture.
- Changing data flow, rendering flow, event flow, startup, or module communication.
- Adding major features that touch multiple modules.

Covers:

- Data flow.
- Rendering flow.
- Event flow.
- Routing flow.
- Component communication.
- Storage lifecycle.
- Startup and initialization sequence.
- Module interaction graph.

### `src.md`

Use for:

- Understanding every source file without reading all source first.
- Locating the right module for a change.
- Checking public functions, dependencies, and extension points.

Covers:

- Responsibility of every `src/` file.
- Public functions.
- Dependencies and used-by relationships.
- Extension points and implementation details.

### `components.md`

Use for:

- Adding or reusing modals, confirm dialogs, or toast notifications.
- Building forms, detail overlays, confirmations, or mutation feedback.
- Avoiding duplicated UI primitives.

Covers:

- `modal.js`.
- `confirm-dialog.js`.
- `toast.js`.
- Inputs, outputs, events, styling, reusability, and limitations.

### `router.md`

Use for:

- Adding routes or pages.
- Changing navigation behavior.
- Working with date route parameters.
- Preserving browser back/forward support.

Covers:

- Current hash routes.
- Route registration.
- Navigation flow.
- Dynamic route parameters.
- Navigation conventions.
- How to add future pages.

### `storage.md`

Use for:

- Changing task persistence.
- Adding task fields.
- Adding import/export, migration, stats, or query behavior.
- Debugging localStorage behavior.

Covers:

- Storage key and format.
- Task field contract.
- Read/write and CRUD flows.
- Serialization.
- Cache strategy.
- Future extension guidelines.

### `tasks.md`

Use for:

- Changing the day task view.
- Adding task CRUD actions.
- Changing validation, sorting, filters, or future search.
- Adding task fields to UI forms/cards/details.

Covers:

- Task data model usage.
- CRUD flow.
- Validation.
- Current search/filter state.
- Sorting.
- Extension guidelines.

### `utils.md`

Use for:

- Working with date keys, formatting, calendar math, DOM creation, IDs, or focus helpers.
- Avoiding duplicate utility logic.
- Adding shared helpers.

Covers:

- Utility categories.
- Existing helpers.
- Reuse guidelines.
- Utility anti-patterns.

### `styles.md`

Use for:

- Changing UI styling.
- Adding new panels, buttons, cards, forms, status states, or responsive layouts.
- Keeping Tailwind classes consistent.

Covers:

- Design language.
- Color palette.
- Typography.
- Spacing.
- Borders and shadows.
- Animations.
- Responsive rules.
- CSS naming conventions.

### `html.md`

Use for:

- Changing `index.html`.
- Adding root containers.
- Changing app entry points.
- Understanding where app, toast, modal, and confirm UI mounts.

Covers:

- DOM structure.
- Root containers.
- Global body layout.
- Entry points.
- Scripts.

### `build.md`

Use for:

- Changing `package.json`.
- Changing Vite config.
- Adding dependencies.
- Changing build, dev server, preview, or deployment behavior.
- Updating GitHub Pages assumptions.

Covers:

- Build process.
- Dev server.
- Scripts.
- Dependencies.
- Production GitHub Pages workflow.

### `conventions.md`

Use for:

- Generating any new code.
- Naming files/functions/variables.
- Organizing imports and modules.
- Matching formatting, comments, error handling, and performance expectations.

Covers:

- Naming conventions.
- Folder/file/import conventions.
- Formatting and comment conventions.
- Function conventions.
- Error handling.
- Performance.
- Code organization rules.
- Always-follow rules.

### `patterns.md`

Use for:

- Implementing features in the existing style.
- Choosing between local state, route state, storage helpers, render helpers, modals, and toasts.
- Avoiding unnecessary abstractions.

Covers:

- Repeated coding patterns.
- UI patterns.
- Event patterns.
- State patterns.
- Rendering patterns.
- Storage patterns.
- Error patterns.

### `anti-patterns.md`

Use for:

- Reviewing risk before refactors.
- Checking what not to change.
- Avoiding regressions in routing, storage, styling, validation, DOM safety, and deployment.

Covers:

- Things that should never change casually.
- Existing assumptions.
- Dangerous refactors.
- Duplication to avoid.
- Styling, routing, storage, DOM, validation, performance, and build mistakes.

## Consult Before Implementing

### New Page Or Route

Read:

- `architecture.md`
- `router.md`
- `src.md`
- `conventions.md`
- `anti-patterns.md`

Main rules:

- Add parsing and navigation helpers in `router.js`.
- Add route-to-view rendering in `main.js`.
- Do not construct hashes directly in views.

### New Task Field

Read:

- `storage.md`
- `tasks.md`
- `utils.md` if date/formatting is involved.
- `styles.md` if visible UI changes are needed.
- `anti-patterns.md`

Main rules:

- Extend storage normalization first.
- Keep backward compatibility with old stored records.
- Update form validation and detail/card rendering when visible.

### New Task Action

Read:

- `tasks.md`
- `storage.md`
- `components.md`
- `patterns.md`
- `anti-patterns.md`

Main rules:

- Put data mutation in `storage.js`.
- Use existing modal/confirm/toast components.
- Call `rerender()` after successful mutation.

### Search, Filters, Or Sorting

Read:

- `tasks.md`
- `storage.md`
- `patterns.md`
- `conventions.md`

Main rules:

- Keep temporary UI state local unless route-backed behavior is requested.
- Apply filters before sorting.
- Keep sorting helpers pure and non-mutating.

### Storage Or Migration Change

Read:

- `storage.md`
- `architecture.md`
- `anti-patterns.md`
- `tasks.md` if UI-visible.

Main rules:

- Preserve `dailyTasksCalendar.tasks` unless explicitly migrating.
- Normalize on read and write.
- Never drop valid old tasks because optional new fields are missing.

### UI Component Or Overlay

Read:

- `components.md`
- `styles.md`
- `patterns.md`
- `anti-patterns.md`

Main rules:

- Reuse `openModal`, `openDeleteDialog`, and `showToast`.
- Preserve focus trapping and accessibility behavior.
- Do not add native browser dialogs.

### Styling Change

Read:

- `styles.md`
- `components.md` if controls/overlays are involved.
- `conventions.md`
- `anti-patterns.md`

Main rules:

- Reuse shared button classes.
- Keep slate/indigo/green/amber/red semantic palette.
- Keep responsive, accessible, light productivity UI.

### Date Or Calendar Logic

Read:

- `utils.md`
- `router.md` if route dates are involved.
- `storage.md` if task dates are persisted.
- `calendar.js` section in `src.md`.

Main rules:

- Use local date-key helpers.
- Never parse `YYYY-MM-DD` with `new Date("YYYY-MM-DD")`.
- Preserve Monday-first calendar behavior.

### Build Or Deployment Change

Read:

- `build.md`
- `html.md` if entry points change.
- `anti-patterns.md`

Main rules:

- Preserve `/daily-task/` base unless deployment path changes.
- Keep Vite as the build tool.
- Do not edit `dist/` as source.

## Fast Lookup

| Task | Read First |
| --- | --- |
| Understand whole app | `architecture.md`, `src.md` |
| Add a route/page | `router.md`, `architecture.md` |
| Change task CRUD | `tasks.md`, `storage.md` |
| Change persisted data | `storage.md`, `anti-patterns.md` |
| Add modal/notification | `components.md` |
| Change styles | `styles.md` |
| Change HTML roots/entry | `html.md` |
| Change build/deploy | `build.md` |
| Add utility/helper | `utils.md`, `conventions.md` |
| Avoid regressions | `anti-patterns.md`, `patterns.md` |

## Documentation Maintenance

- Update this index when adding, renaming, or removing files in `docs/agents`.
- Update topic documents when code architecture or conventions change.
- Keep docs concise and optimized for AI agents.
- Do not let docs describe behavior that no longer exists in source.
