import './styles.css';
import { renderCalendarView } from './calendar.js';
import { getRoute, monthFromRouteOrCurrent } from './router.js';
import { setTaskRerender, renderDayView } from './tasks.js';

const appRoot = document.querySelector('#app');

const state = {
  currentMonth: monthFromRouteOrCurrent(getRoute()),
  selectedDate: null,
  activeModal: null,
};

function renderApp() {
  const route = getRoute();
  if (route.name === 'day') {
    state.selectedDate = route.date;
    state.currentMonth = monthFromRouteOrCurrent(route);
    appRoot.replaceChildren(renderDayView(route.date));
    return;
  }

  appRoot.replaceChildren(
    renderCalendarView({
      state,
      onMonthChange(nextMonth) {
        state.currentMonth = nextMonth;
        renderApp();
      },
    }),
  );
}

setTaskRerender(renderApp);

window.addEventListener('hashchange', renderApp);

if (!window.location.hash) {
  window.location.replace('#/');
} else {
  renderApp();
}
