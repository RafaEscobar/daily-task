import { createElement, getFocusableElements } from '../utils.js';

let activeModal = null;

export function closeModal() {
  if (!activeModal) return;
  const { root, previousFocus, keyHandler } = activeModal;
  document.removeEventListener('keydown', keyHandler);
  document.body.classList.remove('modal-open');
  root.innerHTML = '';
  activeModal = null;
  if (previousFocus && typeof previousFocus.focus === 'function') {
    previousFocus.focus();
  }
}

export function openModal({ title, content, actions, labelledById = 'modal-title', maxWidth = 'max-w-xl' }) {
  closeModal();

  const root = document.querySelector('#modal-root');
  const previousFocus = document.activeElement;

  const backdrop = createElement('div', {
    className: 'fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4',
    attrs: { 'data-modal-backdrop': 'true' },
  });

  const panel = createElement('section', {
    className: `max-h-[92vh] w-full ${maxWidth} overflow-y-auto rounded-xl bg-white shadow-xl`,
    attrs: {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': labelledById,
    },
  });

  const header = createElement('div', {
    className: 'flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4',
  });
  const heading = createElement('h2', {
    className: 'text-lg font-semibold text-slate-950',
    text: title,
    attrs: { id: labelledById },
  });
  const closeButton = createElement('button', {
    className: 'icon-button !min-h-10 !min-w-10 !shadow-none',
    attrs: { type: 'button', 'aria-label': 'Cerrar dialogo' },
  });
  closeButton.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true" class="h-5 w-5"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6 6 18M6 6l12 12"/></svg>';
  closeButton.addEventListener('click', closeModal);
  header.append(heading, closeButton);

  const body = createElement('div', { className: 'px-5 py-5' });
  body.append(content);

  panel.append(header, body);
  if (actions) {
    const footer = createElement('div', {
      className: 'flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end',
    });
    footer.append(actions);
    panel.append(footer);
  }

  backdrop.append(panel);
  root.replaceChildren(backdrop);
  document.body.classList.add('modal-open');

  const keyHandler = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = getFocusableElements(panel);
    if (!focusable.length) return;
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
    if (event.target === backdrop) closeModal();
  });

  document.addEventListener('keydown', keyHandler);
  activeModal = { root, previousFocus, keyHandler };
  window.setTimeout(() => {
    const focusable = getFocusableElements(panel);
    (focusable[0] ?? panel).focus();
  }, 0);
}
