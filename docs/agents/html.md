# HTML Shell Guide

## Purpose

- Documents `index.html` for future AI agents.
- `index.html` is the static shell for the browser-only single-page app.
- It defines root containers used by JavaScript modules and loads the app entry script.

## DOM Structure

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="..." />
    <title>Calendario de Tareas Diarias</title>
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased">
    <div id="app"></div>
    <div id="toast-root" ...></div>
    <div id="modal-root"></div>
    <div id="confirm-root"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

## Document Metadata

- Language: `es`.
- Charset: `UTF-8`.
- Viewport: `width=device-width, initial-scale=1.0`.
- Description: Spanish app summary for a localStorage task calendar.
- Title: `Calendario de Tareas Diarias`.

Keep metadata Spanish unless the application is intentionally localized.

## Global Layout

- The `body` has global visual classes:
  - `bg-slate-50`
  - `text-slate-900`
  - `antialiased`

- `src/styles.css` adds:
  - global light color scheme.
  - global font stack.
  - inherited fonts for buttons/inputs/textareas.
  - `body.modal-open { overflow: hidden; }`.

- The body contains no static application UI beyond root containers.
- All visible app views are created by JavaScript.

## Root Containers

### `#app`

- Main application mount point.
- Used by `src/main.js`.
- `main.js` resolves it with:

```js
document.querySelector('#app')
```

- Calendar and day views are rendered into this root with `replaceChildren(...)`.
- Route changes replace this root's content.
- Do not mount modals, confirm dialogs, or toasts inside `#app`; they have separate roots.

### `#toast-root`

- Toast notification mount point.
- Used by `src/components/toast.js`.
- `toast.js` resolves it with:

```js
document.querySelector('#toast-root')
```

- Has fixed positioning and stack layout directly in HTML:
  - `fixed`
  - `right-3 top-3`
  - `z-50`
  - `flex flex-col gap-3`
  - `w-[calc(100%-1.5rem)] max-w-sm`
  - `sm:right-5 sm:top-5`

- Accessibility attributes:
  - `aria-live="polite"`
  - `aria-atomic="true"`

- Toast nodes are appended into this root and auto-removed.

### `#modal-root`

- Generic modal mount point.
- Used by `src/components/modal.js`.
- `modal.js` resolves it with:

```js
document.querySelector('#modal-root')
```

- Generic modals render fixed overlays here.
- Current modal overlay uses `z-40`.
- Content is cleared on `closeModal()`.

### `#confirm-root`

- Confirmation dialog mount point.
- Used by `src/components/confirm-dialog.js`.
- `confirm-dialog.js` resolves it with:

```js
document.querySelector('#confirm-root')
```

- Delete confirmation overlays render here.
- Current confirm overlay uses `z-50`, above generic modals.
- Content is cleared on `closeConfirmDialog()`.

## Entry Points

### JavaScript Entry

```html
<script type="module" src="/src/main.js"></script>
```

- Main app entry: `src/main.js`.
- Loaded as an ES module.
- Vite resolves and bundles this during development/build.
- `main.js` imports `src/styles.css`, which imports Tailwind CSS.

### CSS Entry

- There is no `<link>` stylesheet in `index.html`.
- CSS enters through:

```js
import './styles.css';
```

inside `src/main.js`.

## Scripts

- Only one script tag exists.
- Script type is `module`.
- Source is `/src/main.js`.
- No inline scripts.
- No third-party scripts.
- No analytics scripts.
- No import maps.

## Runtime Container Ownership

```text
#app
  -> src/main.js
  -> renderCalendarView() or renderDayView()

#toast-root
  -> src/components/toast.js
  -> showToast()

#modal-root
  -> src/components/modal.js
  -> openModal() / closeModal()

#confirm-root
  -> src/components/confirm-dialog.js
  -> openDeleteDialog() / closeConfirmDialog()
```

## Extension Guidelines

- Add new persistent root containers only when a UI system needs to live outside `#app`.
- Prefer reusing existing roots for:
  - normal views: `#app`.
  - transient notifications: `#toast-root`.
  - generic overlays: `#modal-root`.
  - destructive confirmations: `#confirm-root`.
- If adding a new root, document its owning module and z-index relationship.
- Keep the script entry as `/src/main.js` unless changing the app bootstrap architecture.
- Do not add static page content to `index.html` for normal app views; render views from JavaScript.
- Preserve `lang="es"` and Spanish metadata unless localization is requested.

## Things To Avoid

- Do not remove any root container without updating its owning module.
- Do not mount app views into toast/modal/confirm roots.
- Do not mount overlays inside `#app`.
- Do not add duplicate script entry points.
- Do not add inline scripts for app behavior.
- Do not edit generated `dist/index.html` as source.
