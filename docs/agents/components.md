# Component Guide

## Purpose

- This document helps future AI agents reuse `src/components/*` instead of recreating UI primitives.
- Components are framework-free ES modules that create and manage DOM directly.
- All components depend on fixed root elements defined in `index.html`.

## Component Inventory

- `src/components/modal.js`: generic accessible modal.
- `src/components/confirm-dialog.js`: delete confirmation dialog.
- `src/components/toast.js`: temporary status notifications.

## Reuse Rules

- Use `openModal()` for forms, details, and any non-destructive overlay content.
- Use `openDeleteDialog()` for task deletion confirmation.
- Use `showToast()` for user-visible mutation feedback.
- Do not use native `alert`, `confirm`, or `prompt`.
- Do not create another modal, confirmation, or toast system unless the user explicitly asks for a redesign.
- Pass already-created DOM nodes into components; do not pass HTML strings for user content.

## `modal.js`

### Purpose

- Provides the generic modal overlay used by task create/edit and task detail flows.
- Handles dialog semantics, focus trapping, Escape close, backdrop close, scroll locking, and focus restoration.
- Designed for reusable content and action buttons supplied by callers.

### Public API

- `openModal({ title, content, actions, labelledById = 'modal-title', maxWidth = 'max-w-xl' })`
- `closeModal()`

### Inputs

- `title`
  - String displayed in the modal header.
  - Used as the accessible dialog label.

- `content`
  - DOM node appended into the modal body.
  - Build this with `createElement()` or normal DOM APIs before calling `openModal`.

- `actions`
  - Optional DOM node or `DocumentFragment` appended into the modal footer.
  - Usually contains secondary and primary buttons.
  - If omitted, no footer is rendered.

- `labelledById`
  - Optional ID for the title element.
  - Defaults to `modal-title`.
  - Override only if multiple dialog label IDs become necessary.

- `maxWidth`
  - Optional Tailwind max-width class.
  - Defaults to `max-w-xl`.
  - Existing task forms/details pass `max-w-2xl`.

### Outputs

- Renders a modal overlay into `#modal-root`.
- Adds `body.modal-open` while open.
- Clears `#modal-root` when closed.
- Restores focus to the previously focused element when closed.
- Does not return a value.

### Events

- Close button click calls `closeModal()`.
- Backdrop `mousedown` closes when the event target is the backdrop itself.
- `Escape` key closes the modal.
- `Tab` and `Shift+Tab` are trapped within focusable children.
- After opening, focus moves to the first focusable element or the panel fallback.

### Styling Approach

- Uses Tailwind utility classes directly in JavaScript.
- Uses shared `.icon-button` from `src/styles.css` for the close button.
- Panel defaults to rounded white surface with shadow and `max-h-[92vh]` scrolling.
- Footer is responsive: stacked reverse order on mobile, right-aligned row on larger screens.
- `maxWidth` lets callers choose modal width without creating variants.

### Reusability

- Best for:
  - Forms.
  - Detail views.
  - Read-only metadata panels.
  - Non-destructive workflows with custom footer buttons.
- To reuse:
  1. Build `content` as a DOM node.
  2. Build optional footer buttons as a `DocumentFragment`.
  3. Wire button listeners before calling `openModal`.
  4. Use `closeModal()` from cancel/complete actions.

### Limitations

- Only one generic modal can be active at a time; opening a new modal closes the previous one.
- Requires `#modal-root` to exist.
- Does not manage form submission; callers own form behavior.
- Does not catch errors from caller event handlers.
- Does not provide configurable animation timing.
- Uses `innerHTML` only for the trusted close icon SVG; user content must not be passed as HTML.

## `confirm-dialog.js`

### Purpose

- Provides the specialized delete confirmation overlay.
- Confirms destructive task deletion with task name, explanatory text, cancel button, and delete button.
- Runs above generic modals using a higher z-index root/overlay.

### Public API

- `openDeleteDialog({ taskName, onConfirm })`
- `closeConfirmDialog()`

### Inputs

- `taskName`
  - String displayed in the confirmation body.
  - Inserted as text, not HTML.

- `onConfirm`
  - Callback invoked when the user clicks `Eliminar`.
  - Caller owns the actual deletion, modal closing, toast, and rerender behavior.

### Outputs

- Renders a confirmation dialog into `#confirm-root`.
- Adds `body.modal-open` while open.
- Clears `#confirm-root` when closed.
- Restores previous focus when closed.
- Calls `onConfirm()` on destructive confirmation.
- Does not return a value.

### Events

- Cancel button click closes the dialog.
- Delete button click calls `onConfirm()` and then closes the confirm dialog.
- Backdrop `mousedown` closes when the event target is the backdrop itself.
- `Escape` key closes the dialog.
- `Tab` and `Shift+Tab` are trapped within focusable controls.
- Initial focus moves to the delete button.

### Styling Approach

- Uses Tailwind utility classes directly in JavaScript.
- Uses shared `.secondary-button` and `.danger-button` from `src/styles.css`.
- Uses red accent styling for task name and destructive action.
- Fixed max width: `max-w-md`.
- Overlay z-index is `z-50`, above generic modal overlay `z-40`.

### Reusability

- Best for current task deletion flow.
- Reuse it whenever deleting a task by passing the task name and an `onConfirm` callback.
- If another destructive task-specific action is added, prefer extending this component before creating a new confirmation primitive.
- If a non-delete confirmation is required, generalize the API carefully while preserving existing delete behavior.

### Limitations

- Currently hard-coded for Spanish delete copy.
- Not a general-purpose confirmation dialog yet.
- Requires `#confirm-root` to exist.
- Only one confirm dialog can be active at a time.
- Does not handle async `onConfirm` failures.
- Because it also toggles `body.modal-open`, review behavior carefully if future nested overlay flows change.

## `toast.js`

### Purpose

- Provides lightweight temporary notifications for user-visible feedback.
- Used after create, update, delete, complete, and restore actions.

### Public API

- `showToast(message, type = 'info')`

### Inputs

- `message`
  - String displayed in the toast.
  - Inserted as text, not HTML.

- `type`
  - Optional visual style key.
  - Supported values:
    - `success`
    - `info`
    - `warning`
    - `error`
  - Unknown values fall back to `info`.

### Outputs

- Appends a toast node to `#toast-root`.
- Auto-removes the toast after 4200 ms.
- Allows manual dismissal through a close button.
- No-ops if `#toast-root` is missing.
- Does not return a value.

### Events

- Close button click starts removal.
- Auto-dismiss timer starts when toast is created.
- Removal adds opacity/translate classes, then removes the element after 160 ms.

### Styling Approach

- Uses a private `TOAST_STYLES` map for type-specific Tailwind classes.
- Toasts are rounded bordered panels with compact text and shadow.
- Close button inherits current color and uses focus ring classes.
- The root positioning and stack layout are defined in `index.html` on `#toast-root`.

### Reusability

- Best for short, non-blocking feedback.
- Use after successful or notable task mutations.
- Use `success` for create/update/complete.
- Use `info` for neutral state changes such as restoring to pending.
- Use `warning` for deletion.
- Use `error` only when a user-facing failure is actually surfaced.

### Limitations

- No persistence across route changes or reloads.
- No action buttons besides dismiss.
- No queue limit or deduplication.
- No configurable duration.
- No ARIA live configuration beyond root markup in `index.html` and toast `role="status"`.
- Not appropriate for confirmation, forms, or detailed error recovery.

## Common Patterns For Future Agents

### Form Modal Pattern

```text
build form DOM
build cancel/save buttons
cancel -> closeModal()
submit -> validate -> mutate storage -> showToast -> closeModal -> rerender
openModal({ title, content: form, actions, maxWidth })
```

### Detail Modal Pattern

```text
read entity from storage
if missing: return
build detail DOM
build close/edit/action buttons
openModal({ title, content, actions })
```

### Delete Pattern

```text
openDeleteDialog({
  taskName,
  onConfirm: () => {
    delete from storage
    closeModal if a parent modal is open
    showToast(..., 'warning')
    rerender()
  }
})
```

### Feedback Pattern

```text
showToast('Mensaje breve.', 'success' | 'info' | 'warning' | 'error')
```

## Do Not Recreate

- Do not create ad hoc overlay divs in feature modules.
- Do not add inline confirmation UI when `openDeleteDialog()` fits.
- Do not add one-off notification banners for task mutations.
- Do not bypass focus trapping for modal-like content.
- Do not insert user-provided modal, dialog, or toast content with `innerHTML`.
