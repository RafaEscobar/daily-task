import { clampInteger, generateId, isValidDateKey } from './utils.js';

export const STORAGE_KEY = 'dailyTasksCalendar.tasks';

function nowIso() {
  return new Date().toISOString();
}

function normalizeTask(rawTask) {
  if (!rawTask || typeof rawTask !== 'object') return null;
  if (!isValidDateKey(rawTask.date)) return null;

  const name = typeof rawTask.name === 'string' ? rawTask.name.trim() : '';
  const description =
    typeof rawTask.description === 'string' ? rawTask.description.trim() : '';
  if (name.length < 2 || description.length < 3) return null;

  const completed = Boolean(rawTask.completed);
  const timestamp = nowIso();

  return {
    id: typeof rawTask.id === 'string' && rawTask.id ? rawTask.id : generateId(),
    date: rawTask.date,
    name: name.slice(0, 80),
    description: description.slice(0, 500),
    points: clampInteger(rawTask.points, 1, 10),
    completed,
    createdAt:
      typeof rawTask.createdAt === 'string' && !Number.isNaN(new Date(rawTask.createdAt).getTime())
        ? rawTask.createdAt
        : timestamp,
    updatedAt:
      typeof rawTask.updatedAt === 'string' && !Number.isNaN(new Date(rawTask.updatedAt).getTime())
        ? rawTask.updatedAt
        : timestamp,
    completedAt:
      completed && typeof rawTask.completedAt === 'string'
        ? rawTask.completedAt
        : null,
  };
}

export function normalizeTasks(rawTasks) {
  if (!Array.isArray(rawTasks)) return [];
  const seenIds = new Set();
  const normalized = [];

  rawTasks.forEach((rawTask) => {
    const task = normalizeTask(rawTask);
    if (!task || seenIds.has(task.id)) return;
    seenIds.add(task.id);
    normalized.push(task);
  });

  return normalized;
}

export function getTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('Las tareas guardadas no eran un arreglo. Se recupera con una lista vacia.');
      return [];
    }
    return normalizeTasks(parsed);
  } catch (error) {
    console.warn('No se pudieron leer las tareas guardadas. Se recupera con una lista vacia.', error);
    return [];
  }
}

export function saveTasks(tasks) {
  const normalized = normalizeTasks(tasks);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function getTasksByDate(date) {
  return getTasks().filter((task) => task.date === date);
}

export function createTask(taskData) {
  const timestamp = nowIso();
  const task = normalizeTask({
    ...taskData,
    id: generateId(),
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
  });

  if (!task) throw new Error('Datos de tarea invalidos');

  const tasks = getTasks();
  saveTasks([...tasks, task]);
  return task;
}

export function updateTask(taskId, updates) {
  let updatedTask = null;
  const tasks = getTasks().map((task) => {
    if (task.id !== taskId) return task;
    updatedTask = normalizeTask({
      ...task,
      ...updates,
      id: task.id,
      createdAt: task.createdAt,
      updatedAt: nowIso(),
    });
    return updatedTask ?? task;
  });
  saveTasks(tasks);
  return updatedTask;
}

export function deleteTask(taskId) {
  const tasks = getTasks();
  const nextTasks = tasks.filter((task) => task.id !== taskId);
  saveTasks(nextTasks);
  return nextTasks.length !== tasks.length;
}

export function toggleTaskStatus(taskId) {
  let changedTask = null;
  const timestamp = nowIso();
  const tasks = getTasks().map((task) => {
    if (task.id !== taskId) return task;
    const completed = !task.completed;
    changedTask = {
      ...task,
      completed,
      completedAt: completed ? timestamp : null,
      updatedAt: timestamp,
    };
    return changedTask;
  });
  saveTasks(tasks);
  return changedTask;
}

export function getTaskById(taskId) {
  return getTasks().find((task) => task.id === taskId) ?? null;
}

export function calculateStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);
  const completedPoints = tasks
    .filter((task) => task.completed)
    .reduce((sum, task) => sum + task.points, 0);
  const pendingPoints = totalPoints - completedPoints;

  return {
    total,
    pending,
    completed,
    totalPoints,
    pendingPoints,
    completedPoints,
    completionPercentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function getDateStats(date) {
  return calculateStats(getTasksByDate(date));
}

export function getMonthStats(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  return calculateStats(
    getTasks().filter((task) => {
      const [taskYear, taskMonth] = task.date.split('-').map(Number);
      return taskYear === year && taskMonth === month + 1;
    }),
  );
}
