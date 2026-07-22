import { closeModal, openModal } from './components/modal.js';
import { openDeleteDialog } from './components/confirm-dialog.js';
import { showToast } from './components/toast.js';
import {
  calculateStats,
  createTask,
  deleteTask,
  getTaskById,
  getTasksByDate,
  toggleTaskStatus,
  updateTask,
} from './storage.js';
import { navigateToCalendar } from './router.js';
import { createElement, formatHumanDate, formatTime, formatTimestamp } from './utils.js';

let rerender = () => {};

export function setTaskRerender(callback) {
  rerender = callback;
}

function icon(path, className = 'h-4 w-4') {
  const span = createElement('span');
  span.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" class="${className}"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${path}"/></svg>`;
  return span.firstElementChild;
}

function sortPending(tasks) {
  return [...tasks].sort((first, second) => {
    if (second.points !== first.points) return second.points - first.points;
    return new Date(first.createdAt) - new Date(second.createdAt);
  });
}

function sortCompleted(tasks) {
  return [...tasks].sort((first, second) => {
    const firstCompleted = new Date(first.completedAt ?? first.updatedAt).getTime();
    const secondCompleted = new Date(second.completedAt ?? second.updatedAt).getTime();
    if (secondCompleted !== firstCompleted) return secondCompleted - firstCompleted;
    return new Date(second.updatedAt) - new Date(first.updatedAt);
  });
}

function validateTaskForm(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'El nombre de la tarea es obligatorio.';
  else if (values.name.trim().length < 2) errors.name = 'Usa al menos 2 caracteres.';
  else if (values.name.trim().length > 80) errors.name = 'Usa 80 caracteres o menos.';

  if (!values.description.trim()) errors.description = 'La descripcion es obligatoria.';
  else if (values.description.trim().length < 3) errors.description = 'Usa al menos 3 caracteres.';
  else if (values.description.trim().length > 500) errors.description = 'Usa 500 caracteres o menos.';

  const points = Number(values.points);
  if (!Number.isInteger(points)) errors.points = 'Los puntos deben ser un numero entero.';
  else if (points < 1 || points > 10) errors.points = 'Elige puntos del 1 al 10.';

  return errors;
}

function buildTaskForm({ date, task = null }) {
  const form = createElement('form', { className: 'space-y-5', attrs: { novalidate: 'true' } });
  const nameId = 'task-name';
  const descriptionId = 'task-description';
  const pointsId = 'task-points';

  const nameField = createElement('div');
  const nameInput = createElement('input', {
    className: 'mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500',
    attrs: { id: nameId, name: 'name', type: 'text', maxlength: '80', value: task?.name ?? '' },
  });
  const nameError = createElement('p', { className: 'mt-1 hidden text-sm text-red-600', attrs: { id: 'task-name-error' } });
  nameField.append(
    createElement('label', { className: 'text-sm font-semibold text-slate-800', text: 'Nombre de la tarea', attrs: { for: nameId } }),
    nameInput,
    nameError,
  );

  const descriptionField = createElement('div');
  const descriptionInput = createElement('textarea', {
    className: 'mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500',
    attrs: { id: descriptionId, name: 'description', maxlength: '500' },
    text: task?.description ?? '',
  });
  const descriptionError = createElement('p', { className: 'mt-1 hidden text-sm text-red-600', attrs: { id: 'task-description-error' } });
  descriptionField.append(
    createElement('label', { className: 'text-sm font-semibold text-slate-800', text: 'Descripcion', attrs: { for: descriptionId } }),
    descriptionInput,
    descriptionError,
  );

  const pointsField = createElement('fieldset');
  const selectedPoints = createElement('p', {
    className: 'mt-2 text-sm font-medium text-slate-600',
    text: `${task?.points ?? 5} puntos seleccionados`,
  });
  const pointsGrid = createElement('div', { className: 'mt-2 grid grid-cols-5 gap-2 sm:grid-cols-10' });
  const pointsValue = { current: String(task?.points ?? 5) };
  for (let value = 1; value <= 10; value += 1) {
    const pointButton = createElement('button', {
      className: `min-h-11 rounded-lg border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${String(value) === pointsValue.current ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'}`,
      text: String(value),
      attrs: { type: 'button', 'aria-pressed': String(String(value) === pointsValue.current) },
    });
    pointButton.addEventListener('click', () => {
      pointsValue.current = String(value);
      pointsGrid.querySelectorAll('button').forEach((button) => {
        const selected = button.textContent === pointsValue.current;
        button.setAttribute('aria-pressed', String(selected));
        button.className = `min-h-11 rounded-lg border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'}`;
      });
      selectedPoints.textContent = `${value} ${value === 1 ? 'punto seleccionado' : 'puntos seleccionados'}`;
      pointsError.classList.add('hidden');
    });
    pointsGrid.append(pointButton);
  }
  const pointsError = createElement('p', { className: 'mt-1 hidden text-sm text-red-600', attrs: { id: 'task-points-error' } });
  pointsField.append(
    createElement('legend', { className: 'text-sm font-semibold text-slate-800', text: 'Puntos' }),
    selectedPoints,
    pointsGrid,
    pointsError,
  );

  const applyErrors = (errors) => {
    [
      [nameInput, nameError, errors.name],
      [descriptionInput, descriptionError, errors.description],
      [null, pointsError, errors.points],
    ].forEach(([input, errorElement, message]) => {
      errorElement.textContent = message ?? '';
      errorElement.classList.toggle('hidden', !message);
      if (input) input.classList.toggle('border-red-400', Boolean(message));
    });
  };

  [nameInput, descriptionInput].forEach((input) => {
    input.addEventListener('input', () => {
      const values = {
        name: nameInput.value,
        description: descriptionInput.value,
        points: pointsValue.current,
      };
      applyErrors(validateTaskForm(values));
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = {
      date,
      name: nameInput.value.trim(),
      description: descriptionInput.value.trim(),
      points: Number(pointsValue.current),
    };
    const errors = validateTaskForm(values);
    applyErrors(errors);
    if (Object.keys(errors).length) return;

    if (task) {
      updateTask(task.id, values);
      showToast('Tarea actualizada.', 'success');
    } else {
      createTask(values);
      showToast('Tarea creada.', 'success');
    }
    closeModal();
    rerender();
  });

  form.append(nameField, descriptionField, pointsField);
  return form;
}

export function openTaskFormModal(date, task = null) {
  const form = buildTaskForm({ date, task });
  const cancel = createElement('button', { className: 'secondary-button', text: 'Cancelar', attrs: { type: 'button' } });
  const save = createElement('button', {
    className: 'primary-button',
    text: task ? 'Guardar cambios' : 'Guardar tarea',
    attrs: { type: 'submit', form: 'task-form' },
  });
  form.id = 'task-form';
  cancel.addEventListener('click', closeModal);
  const actions = document.createDocumentFragment();
  actions.append(cancel, save);
  openModal({
    title: task ? 'Editar tarea' : 'Nueva tarea',
    content: form,
    actions,
    maxWidth: 'max-w-2xl',
  });
}

function handleDelete(task) {
  openDeleteDialog({
    taskName: task.name,
    onConfirm: () => {
      deleteTask(task.id);
      closeModal();
      showToast('Tarea eliminada.', 'warning');
      rerender();
    },
  });
}

function handleToggle(task) {
  const changed = toggleTaskStatus(task.id);
  if (!changed) return;
  showToast(changed.completed ? 'Tarea completada.' : 'Tarea movida a pendientes.', changed.completed ? 'success' : 'info');
  closeModal();
  rerender();
}

function metaRow(label, value) {
  const row = createElement('div', { className: 'rounded-lg border border-slate-200 bg-slate-50 p-3' });
  row.append(
    createElement('p', { className: 'text-xs font-medium uppercase tracking-wide text-slate-500', text: label }),
    createElement('p', { className: 'mt-1 text-sm font-semibold text-slate-900', text: value }),
  );
  return row;
}

export function openTaskDetailModal(taskId) {
  const task = getTaskById(taskId);
  if (!task) return;
  const content = createElement('div', { className: 'space-y-5' });
  content.append(
    createElement('p', { className: 'whitespace-pre-wrap text-sm leading-6 text-slate-700', text: task.description }),
  );
  const grid = createElement('div', { className: 'grid gap-3 sm:grid-cols-2' });
  grid.append(
    metaRow('Fecha', formatHumanDate(task.date)),
    metaRow('Puntos', `${task.points}`),
    metaRow('Estado', task.completed ? 'Completada' : 'Pendiente'),
    metaRow('Creada', formatTimestamp(task.createdAt)),
    metaRow('Actualizada', formatTimestamp(task.updatedAt)),
  );
  if (task.completedAt) grid.append(metaRow('Completada', formatTimestamp(task.completedAt)));
  content.append(grid);

  const actions = document.createDocumentFragment();
  const close = createElement('button', { className: 'secondary-button', text: 'Cerrar', attrs: { type: 'button' } });
  const edit = createElement('button', { className: 'secondary-button', text: 'Editar', attrs: { type: 'button' } });
  const toggle = createElement('button', {
    className: 'secondary-button',
    text: task.completed ? 'Marcar pendiente' : 'Completar',
    attrs: { type: 'button' },
  });
  const remove = createElement('button', { className: 'danger-button', text: 'Eliminar', attrs: { type: 'button' } });
  close.addEventListener('click', closeModal);
  edit.addEventListener('click', () => openTaskFormModal(task.date, task));
  toggle.addEventListener('click', () => handleToggle(task));
  remove.addEventListener('click', () => handleDelete(task));
  actions.append(close, edit, toggle, remove);

  openModal({ title: task.name, content, actions, maxWidth: 'max-w-2xl' });
}

function renderTaskCard(task) {
  const card = createElement('article', {
    className: `rounded-xl border bg-white p-4 shadow-sm ${task.completed ? 'border-green-200 opacity-85' : 'border-slate-200'}`,
  });
  const top = createElement('div', { className: 'flex items-start justify-between gap-3' });
  const titleGroup = createElement('div', { className: 'min-w-0' });
  titleGroup.append(
    createElement('h3', {
      className: `break-words text-base font-semibold text-slate-950 ${task.completed ? 'line-through decoration-slate-400' : ''}`,
      text: task.name,
    }),
    createElement('p', { className: 'mt-1 line-clamp-2 text-sm leading-6 text-slate-600', text: task.description }),
  );
  const points = createElement('span', {
    className: 'shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700',
    text: `${task.points} pts`,
  });
  top.append(titleGroup, points);

  const meta = createElement('div', { className: 'mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500' });
  const status = createElement('span', {
    className: `rounded-full px-2 py-1 font-semibold ${task.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`,
    text: task.completed ? 'Completada' : 'Pendiente',
  });
  meta.append(status, createElement('span', { text: `Creada ${formatTime(task.createdAt)}` }));
  if (task.completedAt) meta.append(createElement('span', { text: `Completada ${formatTime(task.completedAt)}` }));

  const actions = createElement('div', { className: 'mt-4 flex flex-wrap gap-2' });
  const detail = createElement('button', { className: 'secondary-button !min-h-10 !px-3', attrs: { type: 'button' } });
  detail.append(icon('M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6'), document.createTextNode('Detalles'));
  const edit = createElement('button', { className: 'secondary-button !min-h-10 !px-3', attrs: { type: 'button' } });
  edit.append(icon('M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.375 2.625a1 1 0 0 1 3 3L12 15l-4 1 1-4Z'), document.createTextNode('Editar'));
  const toggle = createElement('button', { className: 'secondary-button !min-h-10 !px-3', attrs: { type: 'button' } });
  toggle.append(
    icon(task.completed ? 'm3 7 5 5-5 5M21 7l-5 5 5 5' : 'M20 6 9 17l-5-5'),
    document.createTextNode(task.completed ? 'Pendiente' : 'Completar'),
  );
  const remove = createElement('button', { className: 'secondary-button !min-h-10 !px-3 !text-red-700 hover:!bg-red-50', attrs: { type: 'button' } });
  remove.append(icon('M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m5 5v6m4-6v6'), document.createTextNode('Eliminar'));

  detail.addEventListener('click', () => openTaskDetailModal(task.id));
  edit.addEventListener('click', () => openTaskFormModal(task.date, task));
  toggle.addEventListener('click', () => handleToggle(task));
  remove.addEventListener('click', () => handleDelete(task));
  actions.append(detail, edit, toggle, remove);
  card.append(top, meta, actions);
  return card;
}

function renderTaskSection(title, tasks, emptyText) {
  const section = createElement('section', { className: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5' });
  section.append(createElement('h2', { className: 'text-lg font-semibold text-slate-950', text: `${title} (${tasks.length})` }));
  const list = createElement('div', { className: 'mt-4 grid gap-3' });
  if (!tasks.length) {
    list.append(createElement('p', { className: 'rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500', text: emptyText }));
  } else {
    tasks.forEach((task) => list.append(renderTaskCard(task)));
  }
  section.append(list);
  return section;
}

export function renderDayView(date) {
  const tasks = getTasksByDate(date);
  const stats = calculateStats(tasks);
  const pendingTasks = sortPending(tasks.filter((task) => !task.completed));
  const completedTasks = sortCompleted(tasks.filter((task) => task.completed));

  const container = createElement('div', { className: 'mx-auto max-w-6xl px-3 py-4 sm:px-6 lg:px-8' });
  const header = createElement('header', {
    className: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6',
  });
  const headerTop = createElement('div', { className: 'flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between' });
  const left = createElement('div');
  const back = createElement('button', { className: 'secondary-button mb-4', attrs: { type: 'button' } });
  back.append(icon('m15 18-6-6 6-6'), document.createTextNode('Volver'));
  back.addEventListener('click', navigateToCalendar);
  left.append(
    back,
    createElement('h1', { className: 'text-2xl font-bold text-slate-950 sm:text-3xl', text: formatHumanDate(date) }),
    createElement('p', {
      className: 'mt-2 text-sm font-medium text-slate-600',
      text: `${stats.pending} pendientes · ${stats.completed} completadas · ${stats.totalPoints} puntos totales`,
    }),
  );
  const add = createElement('button', { className: 'primary-button', attrs: { type: 'button' } });
  add.append(icon('M5 12h14M12 5v14'), document.createTextNode('Nueva tarea'));
  add.addEventListener('click', () => openTaskFormModal(date));
  headerTop.append(left, add);
  header.append(headerTop);

  container.append(header);

  if (tasks.length === 0) {
    const empty = createElement('section', { className: 'mt-5 rounded-xl border border-dashed border-indigo-200 bg-indigo-50 p-8 text-center' });
    empty.append(
      createElement('h2', { className: 'text-xl font-semibold text-slate-950', text: 'No hay tareas programadas para este dia.' }),
      createElement('p', { className: 'mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600', text: 'Crea la primera tarea para comenzar a registrar trabajo, puntos y progreso de finalizacion en esta fecha.' }),
    );
    const emptyButton = createElement('button', { className: 'primary-button mt-5', text: 'Crear primera tarea', attrs: { type: 'button' } });
    emptyButton.addEventListener('click', () => openTaskFormModal(date));
    empty.append(emptyButton);
    container.append(empty);
  }

  const sections = createElement('div', { className: 'mt-5 grid gap-5 lg:grid-cols-2' });
  sections.append(
    renderTaskSection('Tareas pendientes', pendingTasks, 'No hay tareas pendientes para este dia.'),
    renderTaskSection('Tareas completadas', completedTasks, 'Aun no hay tareas completadas.'),
  );
  container.append(sections);
  return container;
}
