# Styles Guide

## Purpose

- Documents the styling system for future AI agents.
- Source stylesheet: `src/styles.css`.
- Most styling is Tailwind utility classes placed directly in JavaScript render functions.
- Shared reusable classes live in `src/styles.css`.

## Styling Stack

- Tailwind CSS v4 imported with `@import "tailwindcss";`.
- Vite Tailwind integration is configured in `vite.config.js`.
- No separate design system package.
- No CSS modules.
- No Sass/Less.
- No component framework.

## Design Language

- Practical productivity UI for daily task planning.
- Light, quiet, card-based task-management interface.
- Visual hierarchy comes from:
  - white surfaces on slate page background.
  - subtle borders.
  - small shadows.
  - compact typography.
  - restrained color accents for status and actions.
- UI copy is Spanish.
- Avoid decorative backgrounds, gradients, illustrations, and marketing-page composition.
- Prefer dense but readable controls and task data.

## Color Palette

### Base Neutrals

- Page background: `bg-slate-50`.
- Primary text: `text-slate-900` / `text-slate-950`.
- Secondary text: `text-slate-600` / `text-slate-700`.
- Muted labels: `text-slate-500`.
- Borders: `border-slate-200`.
- Form borders: `border-slate-300`.
- Muted surfaces: `bg-slate-50`, `bg-slate-100/70`.
- Main surfaces: `bg-white`.

### Primary Accent

- Primary action: `bg-indigo-600`, `hover:bg-indigo-700`, `text-white`.
- Focus ring: `focus:ring-indigo-500`.
- Selected/ring state: `ring-indigo-500`.
- Subtle primary surfaces: `bg-indigo-50`, `bg-indigo-50/40`.
- Primary text accent: `text-indigo-700`, `text-indigo-900`.
- Primary border accents: `border-indigo-200`, `border-indigo-600`.

### Status Colors

- Completed/success:
  - `bg-green-50`, `bg-green-50/40`, `bg-green-100`
  - `text-green-700`, `text-green-900`
  - `border-green-200`, `hover:border-green-300`
  - dot: `bg-green-500`

- Pending/warning:
  - `bg-amber-50`, `bg-amber-50/40`, `bg-amber-100`
  - `text-amber-800`, `text-amber-900`
  - `border-amber-200`, `hover:border-amber-300`
  - dot: `bg-amber-500`

- Danger/error:
  - `bg-red-50`, `bg-red-600`, `hover:bg-red-700`
  - `text-red-600`, `text-red-700`, `text-red-900`
  - `border-red-100`, `border-red-400`
  - danger focus ring: `focus:ring-red-500`

### Palette Rules

- Keep slate as the dominant neutral.
- Use indigo only for primary action, selected state, and mixed/info state.
- Use green only for completed/success state.
- Use amber only for pending/warning state.
- Use red only for destructive/error state.
- Do not introduce a new major hue without a clear semantic role.

## Typography

### Global Font

Defined in `:root`:

```css
font-family:
  Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
  sans-serif;
```

- `button`, `input`, and `textarea` inherit font.
- Body uses `antialiased` from `index.html`.

### Type Scale

- Page/view titles:
  - `text-2xl font-bold`
  - `sm:text-3xl` on larger screens.

- Section titles:
  - `text-lg font-semibold`.

- Card/task titles:
  - `text-base font-semibold`.

- Body/help text:
  - `text-sm leading-6`.

- Metadata and badges:
  - `text-xs`.

- Mobile compact calendar metadata:
  - `text-[11px]`.

### Typography Rules

- Use `font-semibold` for labels, section titles, and actionable emphasis.
- Use `font-bold` sparingly for primary titles and point/day badges.
- Use `uppercase tracking-wide` for small metric labels only.
- Do not scale text with viewport units.
- Keep letter spacing default except existing `tracking-wide` label style.

## Spacing

### Page Containers

- Calendar page container:
  - `mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8`

- Day page container:
  - `mx-auto max-w-6xl px-3 py-4 sm:px-6 lg:px-8`

### Surfaces

- Headers/cards typically use:
  - `p-4 sm:p-6`
  - `px-4 py-5 sm:px-6`
  - `p-4 sm:p-5`

- Modal spacing:
  - Header: `px-5 py-4`
  - Body: `px-5 py-5`
  - Footer: `px-5 py-4`

### Gaps

- Compact gaps:
  - `gap-2`, `gap-3`

- Section/view gaps:
  - `gap-4`, `gap-5`

- Calendar grid:
  - `gap-1.5 sm:gap-3`

### Control Sizing

- Main buttons:
  - `min-h-11`
  - `px-4 py-2`
  - `gap-2`

- Compact task card buttons:
  - override with `!min-h-10 !px-3`

- Icon buttons:
  - `min-h-11 min-w-11`
  - modal close overrides: `!min-h-10 !min-w-10`

## Borders

- Default surface border: `border border-slate-200`.
- Form border: `border border-slate-300`.
- Error form border: `border-red-400`.
- Empty/dashed states:
  - `border-dashed border-slate-200`
  - `border-dashed border-indigo-200`
- Status borders:
  - completed: `border-green-200`
  - mixed/info: `border-indigo-200`
  - pending: `border-amber-200`
  - danger metadata: `border-red-100`

### Border Radius

- Main surfaces/cards/modals currently use `rounded-xl`.
- Smaller controls and metadata boxes use `rounded-lg`.
- Pills use `rounded-full`.
- Toast close button uses `rounded-md`.

Do not introduce highly rounded card surfaces beyond existing radius choices.

## Shadows

- Default cards and buttons: `shadow-sm`.
- Calendar cell hover: `hover:shadow-md`.
- Modals/dialogs: `shadow-xl`.
- Avoid large decorative shadows outside overlays.

## Animations And Transitions

- Shared buttons use `transition`.
- Calendar cells use:
  - `transition`
  - `hover:-translate-y-0.5`
  - `hover:shadow-md`

- Toast removal uses:
  - `opacity-0`
  - `translate-y-1`
  - `setTimeout(..., 160)`

- Toast auto-dismiss duration:
  - 4200 ms.

### Animation Rules

- Keep animation subtle and functional.
- Prefer hover/focus transitions over decorative motion.
- Do not add large page transitions or animated backgrounds.
- Preserve reduced visual complexity.

## Responsive Rules

### Breakpoints In Use

- `sm`
  - Wider page padding.
  - Larger titles.
  - Wider form point grid.
  - Calendar desktop details visible.
  - Modal footer row layout.

- `lg`
  - Header row layouts.
  - Two-column day task sections.
  - Wider page padding.

### CSS Media Query

`src/styles.css` defines:

```css
.calendar-cell {
  min-height: 8.25rem;
}

@media (max-width: 640px) {
  .calendar-cell {
    min-height: 5.4rem;
  }
}
```

### Responsive Conventions

- Mobile first.
- Use compact calendar content on mobile and richer detail at `sm`.
- Stack controls on mobile; use rows at `sm` or `lg`.
- Ensure button text does not overflow.
- Keep hit targets near `min-h-11` unless a compact task-card action intentionally uses `min-h-10`.

## Shared Class Names

### `.focus-ring`

- Shared focus ring utility.
- Current definition:
  - no outline
  - `focus:ring-2`
  - `focus:ring-indigo-500`
  - `focus:ring-offset-2`

### `.icon-button`

- Square icon control.
- White background, slate border/text, small shadow.
- Hover changes background/text.
- Indigo focus ring.

### `.primary-button`

- Primary action button.
- Indigo filled background.
- White text.
- Supports disabled styles.
- Use for create/save/main positive actions.

### `.secondary-button`

- Secondary action button.
- White background.
- Slate border/text.
- Use for navigation, cancel, edit, details, restore, neutral actions.

### `.danger-button`

- Destructive filled button.
- Red background and red focus ring.
- Use for confirmed destructive actions in dialogs/modals.

### `.calendar-cell`

- Defines stable minimum height for calendar cells.
- Used on active date cells and empty placeholder cells.

## Naming Conventions

- Shared CSS classes use lowercase kebab-case:
  - `primary-button`
  - `secondary-button`
  - `danger-button`
  - `icon-button`
  - `focus-ring`
  - `calendar-cell`

- Prefer Tailwind utility classes inline for one-off layout/styling.
- Add named classes only when reused across modules or needed for stable dimensions/state.
- Do not create component-specific class names unless utility classes become meaningfully duplicated.
- Keep class names semantic by role, not color implementation.

## Future Styling Guidelines

- Reuse existing shared button classes before composing new button styles.
- Keep new panels on white or slate-50 surfaces with slate-200 borders.
- Use status colors semantically and consistently.
- Keep forms aligned with existing rounded-lg border inputs and indigo focus rings.
- Use `createElement` class strings in JS for feature-local layout.
- Add CSS to `src/styles.css` only for:
  - shared primitives,
  - global behavior,
  - stable fixed dimensions,
  - responsive rules not practical inline.

## Anti-Patterns

- Do not introduce a second palette or theme.
- Do not add gradients, decorative blobs, or marketing-style hero layouts.
- Do not replace Tailwind utilities with unrelated CSS architecture.
- Do not create new button styles when existing shared classes fit.
- Do not remove visible focus rings.
- Do not use red for non-destructive actions.
- Do not use green for pending/neutral actions.
- Do not make calendar cells auto-size based on content.
- Do not edit generated `dist/` CSS directly.
