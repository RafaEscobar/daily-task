import { navigateToDay } from './router.js';
import { getDateStats, getMonthStats } from './storage.js';
import {
  WEEKDAY_LABELS,
  createElement,
  formatDateKey,
  formatMonthYear,
  getDaysInMonth,
  getMondayBasedWeekdayIndex,
  getNextMonth,
  getPreviousMonth,
  isSameDateKey,
  isToday,
  parseDateKey,
} from './utils.js';

function createIcon(path, className = 'h-4 w-4') {
  const span = createElement('span');
  span.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" class="${className}"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${path}"/></svg>`;
  return span.firstElementChild;
}

function getStatusMeta(stats) {
  if (stats.total === 0) {
    return { label: 'Sin tareas', dot: 'bg-slate-300', card: 'border-slate-200 hover:border-indigo-200' };
  }
  if (stats.completed === stats.total) {
    return { label: 'Todo completado', dot: 'bg-green-500', card: 'border-green-200 bg-green-50/40 hover:border-green-300' };
  }
  if (stats.completed > 0) {
    return { label: 'Estado mixto', dot: 'bg-indigo-500', card: 'border-indigo-200 bg-indigo-50/40 hover:border-indigo-300' };
  }
  return { label: 'Tareas pendientes', dot: 'bg-amber-500', card: 'border-amber-200 bg-amber-50/40 hover:border-amber-300' };
}

function renderMonthSummary(monthDate) {
  const stats = getMonthStats(monthDate);
  const wrapper = createElement('div', {
    className:
      'grid gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:grid-cols-4 sm:px-6',
  });
  [
    ['Tareas', stats.total],
    ['Pendientes', stats.pending],
    ['Completadas', stats.completed],
    ['Puntos', stats.totalPoints],
  ].forEach(([label, value]) => {
    const item = createElement('div', {
      className: 'rounded-lg border border-slate-200 bg-slate-50 px-3 py-2',
    });
    item.append(
      createElement('p', { className: 'text-xs font-medium uppercase tracking-wide text-slate-500', text: label }),
      createElement('p', { className: 'mt-1 text-xl font-semibold text-slate-950', text: String(value) }),
    );
    wrapper.append(item);
  });
  return wrapper;
}

function renderCalendarCell(dateKey, selectedDate) {
  const stats = getDateStats(dateKey);
  const meta = getStatusMeta(stats);
  const date = parseDateKey(dateKey);
  const current = isToday(dateKey);
  const selected = isSameDateKey(dateKey, selectedDate);

  const button = createElement('button', {
    className: `calendar-cell group flex w-full flex-col items-start rounded-xl border bg-white p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:p-3 ${meta.card} ${selected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`,
    attrs: {
      type: 'button',
      'aria-label': `${dateKey}, ${meta.label}, ${stats.total} ${stats.total === 1 ? 'tarea' : 'tareas'}`,
    },
  });
  button.addEventListener('click', () => navigateToDay(dateKey));

  const top = createElement('div', { className: 'flex w-full items-center justify-between gap-2' });
  const dayNumber = createElement('span', {
    className: current
      ? 'inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-indigo-600 px-2 text-sm font-bold text-white'
      : 'inline-flex h-8 min-w-8 items-center justify-center rounded-full text-sm font-bold text-slate-900',
    text: String(date.getDate()),
  });
  const dot = createElement('span', {
    className: `h-2.5 w-2.5 rounded-full ${meta.dot}`,
    attrs: { title: meta.label },
  });
  top.append(dayNumber, dot);

  const details = createElement('div', { className: 'mt-auto hidden w-full pt-3 text-xs leading-5 text-slate-600 sm:block' });
  details.append(
    createElement('p', { className: 'font-semibold text-slate-800', text: `${stats.total} ${stats.total === 1 ? 'tarea' : 'tareas'}` }),
    createElement('p', { text: `${stats.pending} pendientes` }),
    createElement('p', { text: `${stats.completed} completadas` }),
    createElement('p', { className: 'font-medium text-slate-700', text: `${stats.totalPoints} pts` }),
  );

  const mobile = createElement('div', { className: 'mt-auto flex w-full items-center justify-between pt-2 text-[11px] font-medium text-slate-600 sm:hidden' });
  mobile.append(
    createElement('span', { text: `${stats.total} t` }),
    createElement('span', { text: `${stats.totalPoints} p` }),
  );

  button.append(top, details, mobile);
  return button;
}

function renderCalendarGrid(monthDate, selectedDate) {
  const wrapper = createElement('div', { className: 'p-3 sm:p-5' });
  const grid = createElement('div', { className: 'grid grid-cols-7 gap-1.5 sm:gap-3' });

  WEEKDAY_LABELS.forEach((label) => {
    grid.append(
      createElement('div', {
        className: 'px-1 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500',
        text: label,
      }),
    );
  });

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const leadingEmptyCells = getMondayBasedWeekdayIndex(firstDay);
  const daysInMonth = getDaysInMonth(year, month);
  const trailingEmptyCells = (7 - ((leadingEmptyCells + daysInMonth) % 7)) % 7;

  for (let index = 0; index < leadingEmptyCells; index += 1) {
    grid.append(createElement('div', { className: 'calendar-cell rounded-xl border border-dashed border-slate-200 bg-slate-100/70' }));
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    grid.append(renderCalendarCell(formatDateKey(new Date(year, month, day)), selectedDate));
  }

  for (let index = 0; index < trailingEmptyCells; index += 1) {
    grid.append(createElement('div', { className: 'calendar-cell rounded-xl border border-dashed border-slate-200 bg-slate-100/70' }));
  }

  wrapper.append(grid);
  return wrapper;
}

export function renderCalendarView({ state, onMonthChange }) {
  const container = createElement('div', { className: 'mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8' });
  const surface = createElement('section', { className: 'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm' });

  const header = createElement('div', {
    className:
      'flex flex-col gap-4 border-b border-slate-200 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between',
  });
  const titleGroup = createElement('div');
  titleGroup.append(
    createElement('p', { className: 'text-sm font-medium text-indigo-700', text: 'Calendario de Tareas Diarias' }),
    createElement('h1', { className: 'mt-1 text-2xl font-bold text-slate-950 sm:text-3xl', text: formatMonthYear(state.currentMonth) }),
  );

  const controls = createElement('div', { className: 'flex flex-wrap items-center gap-2' });
  const prev = createElement('button', { className: 'secondary-button', attrs: { type: 'button', 'aria-label': 'Mes anterior' } });
  prev.append(createIcon('m15 18-6-6 6-6'), document.createTextNode('Anterior'));
  const today = createElement('button', { className: 'secondary-button', text: 'Hoy', attrs: { type: 'button' } });
  const next = createElement('button', { className: 'secondary-button', attrs: { type: 'button', 'aria-label': 'Mes siguiente' } });
  next.append(document.createTextNode('Siguiente'), createIcon('m9 18 6-6-6-6'));

  prev.addEventListener('click', () => onMonthChange(getPreviousMonth(state.currentMonth)));
  next.addEventListener('click', () => onMonthChange(getNextMonth(state.currentMonth)));
  today.addEventListener('click', () => {
    const todayDate = new Date();
    onMonthChange(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
  });

  controls.append(prev, today, next);
  header.append(titleGroup, controls);
  surface.append(header, renderMonthSummary(state.currentMonth), renderCalendarGrid(state.currentMonth, state.selectedDate));
  container.append(surface);
  return container;
}
