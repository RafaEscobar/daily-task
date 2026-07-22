import { createElement } from '../utils.js';

const TOAST_STYLES = {
  success: 'border-green-200 bg-green-50 text-green-900',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
};

export function showToast(message, type = 'info') {
  const root = document.querySelector('#toast-root');
  if (!root) return;

  const toast = createElement('div', {
    className: `flex items-start justify-between gap-3 rounded-xl border p-4 shadow-sm transition ${TOAST_STYLES[type] ?? TOAST_STYLES.info}`,
    attrs: { role: 'status' },
  });

  const text = createElement('p', {
    className: 'text-sm font-medium leading-5',
    text: message,
  });

  const button = createElement('button', {
    className: 'rounded-md p-1 text-current opacity-70 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current',
    attrs: { type: 'button', 'aria-label': 'Descartar notificacion' },
  });
  button.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6 6 18M6 6l12 12"/></svg>';

  const remove = () => {
    toast.classList.add('opacity-0', 'translate-y-1');
    window.setTimeout(() => toast.remove(), 160);
  };

  button.addEventListener('click', remove);
  toast.append(text, button);
  root.append(toast);
  window.setTimeout(remove, 4200);
}
