/* ===========================================================
   ui.js — DOM rendering & UI helpers
   Exposes a single global `UI` object used by app.js.
   =========================================================== */

const UI = (() => {
  const el = {
    body: document.body,
    themeToggle: document.querySelector('.theme-toggle'),
    themeIcon: document.querySelector('.theme-toggle__icon'),
    themeLabel: document.querySelector('.theme-toggle__label'),

    taskList: document.getElementById('task-list'),
    emptyState: document.getElementById('empty-state'),
    emptyStateTitle: document.querySelector('.empty-state__title'),
    emptyStateText: document.querySelector('.empty-state__text'),

    // Dashboard
    greetingText: document.getElementById('greeting-text'),
    currentDate: document.getElementById('current-date'),
    statTotal: document.getElementById('stat-total'),
    statPending: document.getElementById('stat-pending'),
    statCompleted: document.getElementById('stat-completed'),
    progressValue: document.getElementById('progress-value'),
    progressRingFill: document.getElementById('progress-ring-fill'),

    // Task modal
    taskModalOverlay: document.getElementById('task-modal-overlay'),
    taskForm: document.getElementById('task-form'),
    modalTitle: document.getElementById('modal-title'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    fieldTitle: document.getElementById('task-title'),
    fieldPriority: document.getElementById('task-priority'),
    fieldDue: document.getElementById('task-due'),
    fieldCategory: document.getElementById('task-category'),
    fieldNotes: document.getElementById('task-notes'),
    addTaskBtn: document.getElementById('add-task-btn'),
    emptyStateAddBtn: document.getElementById('empty-state-add-btn'),

    // Confirm modal
    confirmOverlay: document.getElementById('confirm-overlay'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    confirmCancelBtn: document.getElementById('confirm-cancel-btn'),

    toastContainer: document.getElementById('toast-container'),
  };

  const RING_CIRCUMFERENCE = 2 * Math.PI * 52; // matches r=52 in SVG

  /** Apply a theme ('dark' | 'light') to the document + update toggle UI. */
  function applyTheme(theme) {
    el.body.setAttribute('data-theme', theme);

    const isDark = theme === 'dark';
    el.themeIcon.textContent = isDark ? '☾' : '☀';
    el.themeLabel.textContent = isDark ? 'Dark Mode' : 'Light Mode';
    el.themeToggle.setAttribute(
      'aria-label',
      isDark ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }

  // ---------- Dashboard header ----------

  function renderGreetingAndDate() {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    el.greetingText.textContent = `${greeting} 👋`;
    el.currentDate.textContent = now.toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric',
    });
  }

  function renderStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    el.statTotal.textContent = total;
    el.statPending.textContent = pending;
    el.statCompleted.textContent = completed;
    el.progressValue.textContent = `${percent}%`;

    const offset = RING_CIRCUMFERENCE * (1 - percent / 100);
    el.progressRingFill.style.strokeDashoffset = offset;
  }

  // ---------- Task rendering ----------

  const PRIORITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };

  function formatDueDate(isoDate) {
    if (!isoDate) return '';
    const due = new Date(`${isoDate}T00:00:00`);
    return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function isOverdue(isoDate, completed) {
    if (!isoDate || completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${isoDate}T00:00:00`) < today;
  }

  function createTaskCard(task) {
    const li = document.createElement('li');
    li.className = `task-card${task.completed ? ' is-completed' : ''}`;
    li.dataset.id = task.id;
    li.dataset.priority = task.priority;
    li.draggable = true;

    const overdue = isOverdue(task.dueDate, task.completed);

    li.innerHTML = `
      <span class="task-card__drag-handle" aria-hidden="true">⠿</span>
      <button class="task-card__check" data-action="toggle" role="checkbox" aria-checked="${task.completed}" aria-label="Mark task as ${task.completed ? 'pending' : 'complete'}">
        <span class="task-card__check-icon">✓</span>
      </button>
      <div class="task-card__body">
        <p class="task-card__title">${escapeHTML(task.title)}</p>
        ${task.notes ? `<p class="task-card__notes">${escapeHTML(task.notes)}</p>` : ''}
        <div class="task-card__meta">
          <span class="task-badge task-badge--priority-${task.priority}">● ${PRIORITY_LABEL[task.priority]}</span>
          ${task.dueDate ? `<span class="task-badge task-badge--due${overdue ? ' is-overdue' : ''}">${overdue ? '⚠ ' : '🗓 '}${formatDueDate(task.dueDate)}</span>` : ''}
          ${task.category ? `<span class="task-badge">${escapeHTML(task.category)}</span>` : ''}
        </div>
      </div>
      <div class="task-card__actions">
        <button class="task-card__action-btn" data-action="edit" aria-label="Edit task">✎</button>
        <button class="task-card__action-btn task-card__action-btn--delete" data-action="delete" aria-label="Delete task">🗑</button>
      </div>
    `;

    return li;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  const EMPTY_STATE_COPY = {
    'no-tasks': {
      title: 'Nothing here yet',
      text: 'Add your first task and start building momentum.',
    },
    'no-results': {
      title: 'No matching tasks',
      text: 'Try a different search term or filter.',
    },
  };

  /** Swap empty-state copy depending on why the list is empty. */
  function setEmptyState(mode) {
    const copy = EMPTY_STATE_COPY[mode] || EMPTY_STATE_COPY['no-tasks'];
    el.emptyStateTitle.textContent = copy.title;
    el.emptyStateText.textContent = copy.text;
  }

  function renderTasks(tasks) {
    el.taskList.innerHTML = '';

    if (!tasks.length) {
      el.taskList.hidden = true;
      el.emptyState.hidden = false;
      return;
    }

    el.taskList.hidden = false;
    el.emptyState.hidden = true;

    const fragment = document.createDocumentFragment();
    tasks.forEach((task) => fragment.appendChild(createTaskCard(task)));
    el.taskList.appendChild(fragment);
  }

  // ---------- Task modal (Add / Edit) ----------

  let lastFocusedEl = null;

  function openTaskModal(task = null) {
    lastFocusedEl = document.activeElement;
    el.taskForm.dataset.editingId = task ? task.id : '';
    el.modalTitle.textContent = task ? 'Edit Task' : 'Add Task';

    el.fieldTitle.value = task?.title ?? '';
    el.fieldPriority.value = task?.priority ?? 'medium';
    el.fieldDue.value = task?.dueDate ?? '';
    el.fieldCategory.value = task?.category ?? '';
    el.fieldNotes.value = task?.notes ?? '';

    el.taskModalOverlay.hidden = false;
    requestAnimationFrame(() => el.fieldTitle.focus());
  }

  function closeTaskModal() {
    el.taskModalOverlay.hidden = true;
    el.taskForm.reset();
    el.taskForm.dataset.editingId = '';
    lastFocusedEl?.focus();
  }

  function readTaskForm() {
    return {
      title: el.fieldTitle.value.trim(),
      priority: el.fieldPriority.value,
      dueDate: el.fieldDue.value,
      category: el.fieldCategory.value.trim(),
      notes: el.fieldNotes.value.trim(),
    };
  }

  // ---------- Confirm modal (Delete) ----------

  let confirmCallback = null;
  let confirmLastFocusedEl = null;

  function openConfirm(onConfirm) {
    confirmCallback = onConfirm;
    confirmLastFocusedEl = document.activeElement;
    el.confirmOverlay.hidden = false;
    // Focus the safe action by default so an accidental Enter press doesn't delete data.
    requestAnimationFrame(() => el.confirmCancelBtn.focus());
  }

  function closeConfirm() {
    el.confirmOverlay.hidden = true;
    confirmCallback = null;
    confirmLastFocusedEl?.focus();
  }

  function runConfirm() {
    if (typeof confirmCallback === 'function') confirmCallback();
    closeConfirm();
  }

  // ---------- Toasts ----------

  const TOAST_ICON = { success: '✓', error: '✕', info: 'ℹ' };

  function showToast(message, type = 'success', duration = 3200) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${TOAST_ICON[type] || TOAST_ICON.info}</span>
      <span class="toast__message">${escapeHTML(message)}</span>
      <button class="toast__close" aria-label="Dismiss notification">✕</button>
    `;

    el.toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    const remove = () => {
      toast.classList.remove('is-visible');
      toast.classList.add('is-leaving');
      setTimeout(() => toast.remove(), 250);
    };

    const timer = setTimeout(remove, duration);
    toast.querySelector('.toast__close').addEventListener('click', () => {
      clearTimeout(timer);
      remove();
    });
  }

  /** Briefly highlight an invalid form field. */
  function flashFieldError(fieldEl) {
    fieldEl.classList.add('input-shake');
    fieldEl.focus();
    setTimeout(() => fieldEl.classList.remove('input-shake'), 350);
  }

  return {
    el,
    applyTheme,
    renderGreetingAndDate,
    renderStats,
    renderTasks,
    setEmptyState,
    formatDueDate,
    isOverdue,
    openTaskModal,
    closeTaskModal,
    readTaskForm,
    openConfirm,
    closeConfirm,
    runConfirm,
    showToast,
    flashFieldError,
  };
})();
