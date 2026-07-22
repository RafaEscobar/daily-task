import { createElement, getFocusableElements } from '../utils.js';

let activeDialog = null;

export function closeConfirmDialog() {
  if (!activeDialog) return;
  const { root, previousFocus, keyHandler } = activeDialog;
  document.removeEventListener('keydown', keyHandler);
  document.body.classList.remove('modal-open');
  root.innerHTML = '';
  activeDialog = null;
  previousFocus?.focus?.();
}

export function openDeleteDialog({ taskName, onConfirm }) {
  closeConfirmDialog();

  const root = document.querySelector('#confirm-root');
  const previousFocus = document.activeElement;
  const backdrop = createElement('div', {
    className: 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4',
  });
  const panel = createElement('section', {
    className: 'w-full max-w-md rounded-xl bg-white p-5 shadow-xl',
    attrs: {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'confirm-title',
    },
  });

  const title = createElement('h2', {
    className: 'text-lg font-semibold text-slate-950',
    text: 'Eliminar esta tarea?',
    attrs: { id: 'confirm-title' },
  });
  const name = createElement('p', {
    className: 'mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900',
    text: taskName,
  });
  const copy = createElement('p', {
    className: 'mt-3 text-sm leading-6 text-slate-600',
    text: 'Esta accion no se puede deshacer. La tarea se quitara de este dia y de los totales del calendario.',
  });
  const actions = createElement('div', {
    className: 'mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end',
  });
  const cancel = createElement('button', {
    className: 'secondary-button',
    text: 'Cancelar',
    attrs: { type: 'button' },
  });
  const remove = createElement('button', {
    className: 'danger-button',
    text: 'Eliminar',
    attrs: { type: 'button' },
  });

  cancel.addEventListener('click', closeConfirmDialog);
  remove.addEventListener('click', () => {
    onConfirm();
    closeConfirmDialog();
  });

  actions.append(cancel, remove);
  panel.append(title, name, copy, actions);
  backdrop.append(panel);
  root.replaceChildren(backdrop);
  document.body.classList.add('modal-open');

  const keyHandler = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeConfirmDialog();
    }
    if (event.key !== 'Tab') return;
    const focusable = getFocusableElements(panel);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  backdrop.addEventListener('mousedown', (event) => {
    if (event.target === backdrop) closeConfirmDialog();
  });
  document.addEventListener('keydown', keyHandler);
  activeDialog = { root, previousFocus, keyHandler };
  window.setTimeout(() => remove.focus(), 0);
}
