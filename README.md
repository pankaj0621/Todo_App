# Flow — A Premium Todo & Task Dashboard

A production-grade task management app built with **zero frameworks** — just clean HTML5, modern CSS3, and vanilla JavaScript (ES6+). Designed to feel like a real SaaS product (Notion × TickTick × Todoist), not a beginner tutorial project.

> Built as a portfolio centerpiece to demonstrate UI/UX craft, accessible front-end engineering, and clean vanilla-JS architecture without relying on a framework to do the heavy lifting.

---

## ✨ Highlights

- **No frameworks, no build step.** Open `index.html` and it runs. No npm install, no bundler, no dependencies beyond Google Fonts.
- **Fully offline-capable.** All data persists in `localStorage` — refresh, close the tab, come back tomorrow, your tasks are still there.
- **Dark / Light mode** with system-preference detection and persistence.
- **Responsive across every breakpoint** — desktop sidebar, tablet icon-rail, mobile bottom tab bar.
- **Accessible by default** — keyboard shortcuts, focus traps, skip link, semantic ARIA roles, `prefers-reduced-motion` support.

---

## 🚀 Getting Started

No installation required.

```bash
# Option 1 — just open it
open index.html

# Option 2 — serve it locally (recommended, avoids any file:// quirks)
npx serve .
# or
python3 -m http.server 5500
```

Then visit `http://localhost:5500` (or wherever your local server points).

---

## 🧩 Features

### Dashboard
- Time-aware greeting (morning / afternoon / evening)
- Live, locale-formatted date
- Circular progress ring showing completion %
- Total / Pending / Completed stat chips, always reflecting your full task list

### Task Management
- Add, edit, delete (with confirmation), complete, and undo
- Priority levels — High / Medium / Low — each with its own accent color
- Due dates with automatic overdue highlighting
- Free-text category tags
- Optional notes per task
- Live search across title, notes, and category
- Filter by priority
- Sort by newest, due date, priority, or alphabetically
- Sidebar views: All Tasks, Today, Pending, Completed

### Productivity
- Native HTML5 drag-and-drop reordering (auto-disabled while a filter/search/sort is active, since manual order only makes sense on the default view)
- Confetti celebration when every task is completed (skipped automatically for `prefers-reduced-motion` users)
- Auto-save to `localStorage` on every change — no save button needed
- Delete confirmation dialog to prevent accidental data loss

### Experience
- Toast notifications (success / error / info) for every action
- Keyboard shortcuts:
  | Key | Action |
  |-----|--------|
  | `N` | Open "Add Task" |
  | `/` | Focus the search bar |
  | `Esc` | Close any open modal |
  | `Tab` / `Shift+Tab` | Cycles within an open modal (focus trap) |
- Smooth, intentional motion — hover lifts, spring-eased modals, animated progress ring
- Beautiful, context-aware empty states ("Nothing here yet" vs. "No matching tasks")

---

## 🛠 Tech Stack

| Layer | Choice |
|---|---|
| Structure | Semantic HTML5 |
| Styling | CSS3 (custom properties / design tokens, no preprocessor) |
| Logic | Vanilla JavaScript (ES6+, no frameworks) |
| Persistence | `localStorage` |
| Fonts | [Fraunces](https://fonts.google.com/specimen/Fraunces) (display), [Inter](https://fonts.google.com/specimen/Inter) (UI), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (data/dates) |

No React, no Vue, no Bootstrap, no Tailwind, no jQuery, no build tooling.

---

## 📁 Project Structure

```
todo-app/
├── index.html              # App shell + all markup
├── css/
│   ├── style.css           # Design tokens, base styles, components, layout
│   └── responsive.css      # Tablet & mobile breakpoints
├── js/
│   ├── storage.js          # localStorage persistence + task CRUD
│   ├── animations.js       # Drag-and-drop reordering + confetti
│   ├── ui.js                # DOM rendering, modals, toasts
│   └── app.js                # Event wiring, filters, app init
├── assets/
│   ├── images/              # (reserved — app currently uses no raster images)
│   └── icons/                  # (reserved — app currently uses inline Unicode/SVG only)
└── README.md
```

**Architecture notes:**
- Each JS file exposes a single namespaced object (`Storage`, `UI`, `Animations`) via an IIFE, avoiding global namespace pollution while staying framework-free.
- `app.js` is the only file that holds application *state* (`tasks`, `filters`) and orchestrates the other modules — `ui.js` only renders what it's told to, `storage.js` only persists what it's asked to.
- No build step means no bundler config to maintain — what you see in the repo is exactly what ships.

---

## 🎨 Design System

| Token | Light | Dark |
|---|---|---|
| Background | `#FAF9F6` | `#0F0F15` |
| Surface | `#FFFFFF` | `#181822` |
| Brand (Indigo) | `#6C5CE7` | same |
| High priority (Coral) | `#FF7A59` | same |
| Medium priority (Amber) | `#F5B83D` | same |
| Low priority / success (Mint) | `#2DD4BF` | same |

Spacing, radii, shadows, and motion curves are all defined as CSS custom properties in `:root` for single-source-of-truth theming.

---

## ♿ Accessibility

- Skip-to-content link for keyboard users
- Visible focus rings (`:focus-visible`) throughout
- Modal focus trapping + focus restoration on close
- `aria-live="polite"` toast announcements
- Semantic `role="checkbox"` + `aria-checked` on the task-complete control
- `aria-current="page"` on the active sidebar view
- Respects `prefers-reduced-motion` (disables/shortens animation, skips confetti)
- All interactive icon-only buttons have `aria-label`s

---

## 📱 Browser Support

Built on widely-supported, standard web platform APIs (CSS custom properties, native HTML5 Drag & Drop, Canvas 2D, `localStorage`) that work in any current evergreen browser — Chrome, Firefox, Safari, and Edge. As with any client delivery, run your own cross-browser QA pass before shipping to production. Drag-and-drop reordering relies on the HTML5 DnD API, which has limited support on touch devices by design — action buttons remain fully usable as a fallback on mobile.

---

## 🔭 Possible Future Improvements

A few directions a real client engagement would likely explore next:

- **Backend sync** — swap the `Storage` module's localStorage calls for a REST/Supabase backend to support multi-device sync, while keeping the same function signatures (`getTasks`, `addTask`, etc.) so the rest of the app doesn't change.
- **PWA support** — a service worker + manifest would make this installable and truly offline-resilient (it's already localStorage-only, so this is a small leap).
- **Recurring tasks & reminders** — daily/weekly recurrence rules, plus browser Notification API integration.
- **Undo snackbar for delete** — replace the confirm dialog with a "Task deleted — Undo" toast for a faster, less interruptive flow.
- **Export/Import** — JSON or CSV export for backup, and import for migrating from another tool.
- **Subtasks / checklists** — nested items within a single task card.
- **Multi-user boards** — shared task lists with collaborators, which is where a backend becomes necessary.

---

## 📄 License

This project is free to use as a personal portfolio piece or starting point. Attribution appreciated but not required.

---

**Built with care, one section at a time.**
