/* ===========================================================
   storage.js — localStorage persistence layer
   Exposes a single global `Storage` object used by app.js.
   =========================================================== */

const Storage = (() => {
  const KEYS = {
    THEME: 'flow:theme',
    TASKS: 'flow:tasks',
    SEEDED: 'flow:seeded',
  };

  const VALID_PRIORITIES = ['high', 'medium', 'low'];

  /** Safe JSON read; returns fallback on missing/corrupt data. */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      console.warn(`Storage: failed to read "${key}"`, err);
      return fallback;
    }
  }

  /** Safe JSON write. */
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`Storage: failed to write "${key}"`, err);
      return false;
    }
  }

  // ---------- Theme ----------
  function getTheme() {
    return read(KEYS.THEME, null); // null = no preference saved yet
  }

  function setTheme(theme) {
    write(KEYS.THEME, theme);
  }

  // ---------- Tasks: CRUD ----------

  /** Generate a reasonably unique id without external deps. */
  function generateId() {
    return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Coerce a raw stored record into a safe, complete task shape.
   * Returns null if the record is unsalvageable (no id or no title) so it
   * can be dropped instead of rendering "undefined" in the UI.
   */
  function normalizeTask(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (typeof raw.id !== 'string' || !raw.id) return null;
    if (typeof raw.title !== 'string' || !raw.title.trim()) return null;

    return {
      id: raw.id,
      title: raw.title,
      priority: VALID_PRIORITIES.includes(raw.priority) ? raw.priority : 'medium',
      dueDate: typeof raw.dueDate === 'string' ? raw.dueDate : '',
      category: typeof raw.category === 'string' ? raw.category : '',
      notes: typeof raw.notes === 'string' ? raw.notes : '',
      completed: Boolean(raw.completed),
      createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
      completedAt: typeof raw.completedAt === 'number' ? raw.completedAt : null,
    };
  }

  /** Return all tasks, silently dropping any corrupted/unsalvageable entries. */
  function getTasks() {
    const raw = read(KEYS.TASKS, []);
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeTask).filter(Boolean);
  }

  /** Persist the full tasks array. */
  function saveTasks(tasks) {
    write(KEYS.TASKS, tasks);
  }

  /**
   * Create a task from form-shaped input and persist it.
   * @returns {object} the newly created task
   */
  function addTask({ title, priority = 'medium', dueDate = '', category = '', notes = '' }) {
    const tasks = getTasks();

    const task = {
      id: generateId(),
      title: title.trim(),
      priority,
      dueDate,
      category: category.trim(),
      notes: notes.trim(),
      completed: false,
      createdAt: Date.now(),
      completedAt: null,
    };

    tasks.unshift(task); // newest first
    saveTasks(tasks);
    return task;
  }

  /**
   * Patch an existing task by id and persist.
   * @returns {object|null} the updated task, or null if not found
   */
  function updateTask(id, patch) {
    const tasks = getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    tasks[index] = { ...tasks[index], ...patch };
    saveTasks(tasks);
    return tasks[index];
  }

  /** Remove a task by id. Returns true if a task was removed. */
  function deleteTask(id) {
    const tasks = getTasks();
    const next = tasks.filter((t) => t.id !== id);
    const removed = next.length !== tasks.length;
    if (removed) saveTasks(next);
    return removed;
  }

  /** Flip a task's completed state, stamping/clearing completedAt. */
  function toggleTaskComplete(id) {
    const tasks = getTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;

    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;
    saveTasks(tasks);
    return task;
  }

  /** Persist a full reordering of tasks (used by drag & drop). */
  function reorderTasks(orderedIds) {
    const tasks = getTasks();
    const byId = new Map(tasks.map((t) => [t.id, t]));
    const reordered = orderedIds.map((id) => byId.get(id)).filter(Boolean);
    saveTasks(reordered);
    return reordered;
  }

  /** Detect whether localStorage actually works (e.g. blocked in private browsing). */
  function isAvailable() {
    try {
      const testKey = '__flow_storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  return {
    KEYS,
    read,
    write,
    isAvailable,
    getTheme,
    setTheme,
    getTasks,
    saveTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    reorderTasks,
  };
})();
