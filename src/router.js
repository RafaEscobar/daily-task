import { formatDateKey, isValidDateKey, parseDateKey } from './utils.js';

export function getRoute() {
  const hash = window.location.hash || '#/';
  const dayMatch = /^#\/day\/(\d{4}-\d{2}-\d{2})$/.exec(hash);

  if (dayMatch && isValidDateKey(dayMatch[1])) {
    return { name: 'day', date: dayMatch[1] };
  }

  return { name: 'calendar' };
}

export function navigateToCalendar() {
  window.location.hash = '#/';
}

export function navigateToDay(dateKey) {
  if (!isValidDateKey(dateKey)) return;
  window.location.hash = `#/day/${dateKey}`;
}

export function monthFromRouteOrCurrent(route) {
  if (route.name === 'day') {
    const date = parseDateKey(route.date);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

export function todayRouteKey() {
  return formatDateKey(new Date());
}
