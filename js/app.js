/* ===========================================================
   app.js — App init & event wiring
   =========================================================== */

let tasks = [];

const filters = {
  search: '',
  priority: 'all',
  nav: 'all',   // all | today | pending | completed
  sort: 'created',
};

(function init() {
  initTheme();
  loadTasks();
  UI.renderGreetingAndDate();
  applyFiltersAndRender();
  bindTaskActions();
  bindModalEvents();
  bindFilterEvents();
  bindKeyboardShortcuts();
  Animations.enableDragAndDrop(UI.el.taskList, canReorder, handleReorder);

  if (!Storage.isAvailable()) {
    UI.showToast('Storage is unavailable in this browser — changes won\'t be saved.', 'error', 6000);
  }
})();

/** Load tasks from Storage; seed demo data on a brand-new install only. */
function loadTasks() {
  tasks = Storage.getTasks();

  if (tasks.length === 0 && Storage.read(Storage.KEYS.SEEDED, false) === false) {
    Storage.addTask({ title: 'Plan the week ahead', priority: 'high', dueDate: toISODate(new Date()), category: 'Planning' });
    Storage.addTask({ title: 'Reply to outstanding emails', priority: 'medium', category: 'Admin', notes: 'Check the support inbox first.' });
    const seeded = Storage.addTask({ title: 'Set up this workspace', priority: 'low', category: 'Getting Started' });
    Storage.toggleTaskComplete(seeded.id);

    Storage.write(Storage.KEYS.SEEDED, true);
    tasks = Storage.getTasks();
  }
}

function refresh() {
  tasks = Storage.getTasks();
  applyFiltersAndRender();
}

// ---------- Search / Filter / Sort ----------

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getVisibleTasks() {
  let result = [...tasks];

  // Sidebar nav view
  if (filters.nav === 'pending') {
    result = result.filter((t) => !t.completed);
  } else if (filters.nav === 'completed') {
    result = result.filter((t) => t.completed);
  } else if (filters.nav === 'today') {
    const todayISO = toISODate(new Date());
    // "Today" surfaces anything due today, plus anything overdue and still pending —
    // matching the convention used by TickTick/Todoist rather than an exact-date match only.
    result = result.filter((t) => t.dueDate === todayISO || (t.dueDate && t.dueDate < todayISO && !t.completed));
  }

  // Priority dropdown
  if (filters.priority !== 'all') {
    result = result.filter((t) => t.priority === filters.priority);
  }

  // Search box (title, notes, category)
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      t.notes.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }

  return sortTasks(result, filters.sort);
}

function sortTasks(list, sortBy) {
  const arr = [...list];

  if (sortBy === 'due') {
    arr.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  } else if (sortBy === 'priority') {
    const rank = { high: 0, medium: 1, low: 2 };
    arr.sort((a, b) => rank[a.priority] - rank[b.priority]);
  } else if (sortBy === 'alpha') {
    arr.sort((a, b) => a.title.localeCompare(b.title));
  }
  // 'created' keeps Storage's newest-first order as-is

  return arr;
}

function applyFiltersAndRender() {
  const visible = getVisibleTasks();
  UI.setEmptyState(tasks.length === 0 ? 'no-tasks' : 'no-results');
  UI.renderTasks(visible);
  UI.renderStats(tasks); // dashboard always reflects ALL tasks, not the filtered view
  updateDragLockState();
}

// ---------- Drag & drop reordering ----------

/** Manual reordering only makes sense on the default, unfiltered "created" view. */
function canReorder() {
  return (
    filters.nav === 'all' &&
    filters.priority === 'all' &&
    filters.sort === 'created' &&
    !filters.search
  );
}

function updateDragLockState() {
  UI.el.taskList.classList.toggle('is-locked', !canReorder());
}

function handleReorder(orderedIds) {
  Storage.reorderTasks(orderedIds);
  tasks = Storage.getTasks();
  UI.renderStats(tasks); // DOM order is already correct from the live drag; just sync stats + internal state
}

function setActiveNav(filterValue) {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    const isActive = btn.dataset.filter === filterValue;
    btn.classList.toggle('is-active', isActive);
    if (isActive) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });
}

function bindFilterEvents() {
  let searchDebounce;

  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      filters.search = e.target.value.trim();
      applyFiltersAndRender();
    }, 150);
  });

  document.getElementById('filter-priority').addEventListener('change', (e) => {
    filters.priority = e.target.value;
    applyFiltersAndRender();
  });

  document.getElementById('sort-tasks').addEventListener('change', (e) => {
    filters.sort = e.target.value;
    applyFiltersAndRender();
  });

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      filters.nav = btn.dataset.filter;
      setActiveNav(filters.nav);
      applyFiltersAndRender();
    });
  });
}

// ---------- Theme ----------

function initTheme() {
  const saved = Storage.getTheme();

  if (saved) {
    UI.applyTheme(saved);
  } else {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    UI.applyTheme(prefersLight ? 'light' : 'dark');
  }

  UI.el.themeToggle.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  const current = UI.el.body.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  UI.applyTheme(next);
  Storage.setTheme(next);
}

// ---------- Task actions (toggle / edit / delete) ----------

function bindTaskActions() {
  UI.el.taskList.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) return;

    const card = e.target.closest('.task-card');
    const id = card?.dataset.id;
    if (!id) return;

    const action = actionBtn.dataset.action;
    if (action === 'toggle') handleToggle(id);
    if (action === 'edit') handleEdit(id);
    if (action === 'delete') handleDeleteRequest(id);
  });
}

function handleToggle(id) {
  const task = tasks.find((t) => t.id === id);
  const wasCompleted = task?.completed;

  Storage.toggleTaskComplete(id);
  refresh();
  UI.showToast(wasCompleted ? 'Marked as pending' : 'Task completed 🎉', wasCompleted ? 'info' : 'success');

  const allCompleted = tasks.length > 0 && tasks.every((t) => t.completed);
  if (allCompleted && typeof Animations !== 'undefined' && Animations.confetti) {
    Animations.confetti();
  }
}

function handleEdit(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) UI.openTaskModal(task);
}

function handleDeleteRequest(id) {
  UI.openConfirm(() => {
    Storage.deleteTask(id);
    refresh();
    UI.showToast('Task deleted', 'error');
  });
}

// ---------- Modal: Add / Edit form ----------

function bindModalEvents() {
  UI.el.addTaskBtn.addEventListener('click', () => UI.openTaskModal());
  UI.el.emptyStateAddBtn.addEventListener('click', () => UI.openTaskModal());

  UI.el.modalCloseBtn.addEventListener('click', UI.closeTaskModal);
  UI.el.modalCancelBtn.addEventListener('click', UI.closeTaskModal);
  UI.el.taskModalOverlay.addEventListener('click', (e) => {
    if (e.target === UI.el.taskModalOverlay) UI.closeTaskModal();
  });

  UI.el.taskForm.addEventListener('submit', handleFormSubmit);

  UI.el.confirmCancelBtn.addEventListener('click', UI.closeConfirm);
  UI.el.confirmDeleteBtn.addEventListener('click', UI.runConfirm);
  UI.el.confirmOverlay.addEventListener('click', (e) => {
    if (e.target === UI.el.confirmOverlay) UI.closeConfirm();
  });
}

function handleFormSubmit(e) {
  e.preventDefault();

  const data = UI.readTaskForm();
  if (!data.title) {
    UI.flashFieldError(UI.el.fieldTitle);
    UI.showToast('Please enter a task title', 'error');
    return;
  }

  const editingId = UI.el.taskForm.dataset.editingId;

  if (editingId) {
    Storage.updateTask(editingId, data);
    UI.showToast('Task updated', 'success');
  } else {
    Storage.addTask(data);
    UI.showToast('Task added', 'success');
  }

  refresh();
  UI.closeTaskModal();
}

// ---------- Keyboard shortcuts & accessibility ----------

function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function isAnyModalOpen() {
  return !UI.el.taskModalOverlay.hidden || !UI.el.confirmOverlay.hidden;
}

function bindKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // While a modal is open: Escape closes it, Tab cycles focus within it.
    if (isAnyModalOpen()) {
      if (e.key === 'Escape') {
        if (!UI.el.taskModalOverlay.hidden) UI.closeTaskModal();
        if (!UI.el.confirmOverlay.hidden) UI.closeConfirm();
      } else if (e.key === 'Tab') {
        trapFocus(e);
      }
      return;
    }

    if (isTypingTarget(e.target)) return;

    if (e.key === '/') {
      e.preventDefault();
      document.getElementById('search-input').focus();
    } else if (e.key.toLowerCase() === 'n') {
      e.preventDefault();
      UI.openTaskModal();
    }
  });
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableEls(container) {
  return [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter((el) => el.offsetParent !== null);
}

/** Keep Tab/Shift+Tab cycling inside the currently open modal. */
function trapFocus(e) {
  const overlay = !UI.el.taskModalOverlay.hidden ? UI.el.taskModalOverlay : UI.el.confirmOverlay;
  const modal = overlay.querySelector('.modal');
  if (!modal) return;

  const focusables = getFocusableEls(modal);
  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
