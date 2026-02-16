# Home Hub v2 — Story Task List (for Jason review)

Date: 2026-02-16
Source of truth for story details: `docs/USER_STORIES.md`

Legend:
- **Impl** = implementation tasks
- **AC/QA** = acceptance/test tasks
- **Deps/Notes** = dependencies / decisions / notes

---

## Sprint 0 — Foundation

### F-1: Database Setup (Prisma + DB)
- **Status:** ✅ DONE
- Impl:
  - Add Prisma + initialize project (v5)
  - Define schema models: User, KanbanCard, ServerMetric, Settings, ApiCache
  - Add `src/lib/prisma.ts` singleton client
  - Add env var handling (`DATABASE_URL`)
  - Kanban API migrated to Prisma-backed storage
- AC/QA:
  - `prisma generate` works
  - `prisma db push` works
  - Build passes

### F-2: Toast Notification System
- **Status:** ✅ DONE
- Impl:
  - `ToastProvider` (context + queue)
  - `useToast()` hook
  - `ToastContainer` rendered globally (layout)
  - Toast types: success/error/warning/info
  - Auto-dismiss + manual dismiss; max 3 visible
  - Framer Motion enter/exit animations
- AC/QA:
  - A11y: `role="alert"`, `aria-live="polite"`

### F-3: PWA Configuration
- **Status:** ✅ DONE
- Impl:
  - Added `public/manifest.json`
  - Theme color in metadata
- Deps/Notes:
  - Icons need actual image assets (placeholders only)

---

## Sprint 1 — Dashboard Layout & Always-On Display

### 1-0: Dashboard Layout & Composition
- **Status:** ✅ DONE
- Impl:
  - Two-column grid layout (hero zone + right sidebar)
  - Clock component (updates every second)
  - ServerMiniGrid widget
  - Weather widget
  - AI Copilot widget (collapsible)
  - News ticker (bottom fixed)
  - Error boundaries via React
  - Framer Motion animations
- AC/QA:
  - Matches layout spec at 1920x1080

### 1-0.1: System Health Bar
- **Status:** ✅ DONE
- Impl:
  - `SystemHealthBar` component in header
  - Shows health dots per service
  - Tooltip on hover
- Deps/Notes:
  - Uses placeholder health data; real `/api/health` endpoint needed later

### 1-0.2: Night Mode (Auto-Dim)
- **Status:** ⏳ NOT STARTED
- Deps/Notes:
  - Could use CSS media query for now

---

## Sprint 2 — Server Metrics

### 2-1: Server Grid Display
- **Status:** ⏳ EXISTING (needs review)
- Current `/server` page exists with basic grid

### 2-2: Server Detail View
- **Status:** ⏳ NOT STARTED
- Deps/Notes:
  - Decision: store history ourselves vs Beszel historical API

### 2-3: Server Mini-Grid (Dashboard Widget)
- **Status:** ✅ DONE
- Added `ServerMiniGrid` widget for dashboard

---

## Sprint 3 — Kanban Board

### 3-1: Kanban Board UI
- **Status:** ⏳ EXISTING (needs review)
- Current `/kanban` exists with basic columns

### 3-2: Agent Assignment
- **Status:** ⏳ NOT STARTED

### 3-3: Card Creation Form
- **Status:** ⏳ NOT STARTED

---

## Sprint 4 — Personal Widgets

### 4-1: Weather Widget (Open-Meteo)
- **Status:** ✅ EXISTING
- Works via `/api/weather`

### 4-2: Apple Reminders Widget
- **Status:** ⏳ PLACEHOLDER
- Shows "integration not connected" state

### 4-3: Sports Scores Widget
- **Status:** ⏳ PLACEHOLDER
- Shows "configure your teams" state

### 4-4: News Ticker
- **Status:** ✅ DONE
- Added `NewsTicker` component (bottom fixed)
- Placeholder news items for now

---

## Sprint 5 — AI & Delight Features

### 5-1: AI Copilot Widget
- **Status:** ✅ DONE (with collapse)
- Collapsible widget with chat UI

### 5-2: Animated Background & Burn-In Prevention
- **Status:** ⏳ NOT STARTED

### 5-3: Page Transitions
- **Status:** ⏳ NOT STARTED

### 5-4: Keyboard Shortcut Navigation
- **Status:** ⏳ NOT STARTED

---

## What's done so far (2026-02-16 ~00:30)
- ✅ Prisma v5 + SQLite (local dev)
- ✅ Kanban API → Prisma
- ✅ Toast notification system
- ✅ PWA manifest
- ✅ Dashboard layout (two-column)
- ✅ Clock component
- ✅ System health bar
- ✅ Server mini-grid widget
- ✅ News ticker
- ✅ AI Copilot (collapsible)
- ✅ Header with nav
- ✅ Deployed to Coolify

## Next up (if continue)
1. Night mode (quick)
2. Server detail view with history
3. Sports/Reminders widgets integration
4. Agent assignment for Kanban
5. Page transitions
