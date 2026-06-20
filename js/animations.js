/* ===========================================================
   animations.js — Drag & drop reordering + confetti celebration
   Exposes a single global `Animations` object.
   =========================================================== */

const Animations = (() => {
  let draggedEl = null;

  /**
   * Wire native HTML5 drag-and-drop reordering onto a list container.
   * @param {HTMLElement} listEl - the <ul> containing .task-card items
   * @param {() => boolean} canReorder - returns false to block dragging (e.g. while filtered/sorted/searched)
   * @param {(orderedIds: string[]) => void} onReorder - called with the new id order after a drop
   */
  function enableDragAndDrop(listEl, canReorder, onReorder) {
    listEl.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.task-card');
      if (!card || !canReorder()) {
        e.preventDefault();
        return;
      }
      // Don't let a click-drag on an interactive control (checkbox, edit, delete)
      // get hijacked into a card-reorder gesture.
      if (e.target.closest('button')) {
        e.preventDefault();
        return;
      }
      draggedEl = card;
      requestAnimationFrame(() => card.classList.add('is-dragging'));
      e.dataTransfer.effectAllowed = 'move';
    });

    listEl.addEventListener('dragend', () => {
      draggedEl?.classList.remove('is-dragging');
      draggedEl = null;
    });

    listEl.addEventListener('dragover', (e) => {
      if (!draggedEl) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const afterEl = getDragAfterElement(listEl, e.clientY);
      if (afterEl == null) {
        listEl.appendChild(draggedEl);
      } else {
        listEl.insertBefore(draggedEl, afterEl);
      }
    });

    listEl.addEventListener('drop', (e) => {
      if (!draggedEl) return;
      e.preventDefault();
      const orderedIds = [...listEl.querySelectorAll('.task-card')].map((el) => el.dataset.id);
      onReorder(orderedIds);
    });
  }

  /** Find the card the dragged item should be placed before, based on cursor Y position. */
  function getDragAfterElement(container, y) {
    const candidates = [...container.querySelectorAll('.task-card:not(.is-dragging)')];

    return candidates.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
        }
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY, element: null }
    ).element;
  }

  // ---------- Confetti ----------

  const CONFETTI_COLORS = ['#6C5CE7', '#FF7A59', '#F5B83D', '#2DD4BF', '#9C8FFF'];
  let confettiCanvas = null;
  let confettiCtx = null;
  let confettiRunning = false;

  function getConfettiCanvas() {
    if (!confettiCanvas) {
      confettiCanvas = document.getElementById('confetti-canvas');
      confettiCtx = confettiCanvas.getContext('2d');
      resizeConfettiCanvas();
      window.addEventListener('resize', resizeConfettiCanvas);
    }
    return confettiCanvas;
  }

  function resizeConfettiCanvas() {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  function createConfettiPiece(canvas) {
    return {
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.3,
      size: 6 + Math.random() * 6,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      speedY: 2.5 + Math.random() * 3,
      speedX: (Math.random() - 0.5) * 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    };
  }

  function drawConfettiPiece(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;
    if (p.shape === 'rect') {
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Fire a celebratory confetti burst across the screen. */
  function confetti(durationMs = 2400) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || confettiRunning) return;

    const canvas = getConfettiCanvas();
    const ctx = confettiCtx;
    const pieces = Array.from({ length: 140 }, () => createConfettiPiece(canvas));

    confettiRunning = true;
    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pieces.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        drawConfettiPiece(ctx, p);
      });

      if (elapsed < durationMs) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettiRunning = false;
      }
    }

    requestAnimationFrame(frame);
  }

  return {
    enableDragAndDrop,
    confetti,
  };
})();
