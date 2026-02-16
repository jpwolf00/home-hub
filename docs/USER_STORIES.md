# Home Hub v2 - User Stories & Implementation Guide

## Format: Each story follows INVEST criteria
- **I**ndependent
- **N**egotiable
- **V**aluable
- **E**stimable
- **S**mall
- **T**estable

---

# Product Vision

Home Hub is a **personal home lab dashboard** designed to run on an **always-on wall-mounted display**. It is the command center for Jason's home infrastructure — showing server health, weather, sports, reminders, news, and an AI assistant at a glance.

### Design Principles
1. **Glanceable from across the room** — Key info (time, weather, server status) must be readable at 10 feet
2. **Dark-first aesthetic** — Glassmorphism on dark gradients; easy on the eyes in any lighting
3. **Alive, not static** — Subtle animations, live data, smooth transitions make it feel like a living display
4. **Resilient** — Individual widget failures never break the whole dashboard; graceful degradation everywhere
5. **Personal** — Greets Jason by name, shows his teams, his reminders, his servers

### Target Display
- Primary: 1920x1080 wall-mounted display (always-on, landscape)
- Secondary: Tablet/phone for quick checks
- The dashboard must look great at all sizes but is **optimized for 1080p landscape**

---

# Non-Functional Requirements

> These apply to every story unless explicitly overridden.

### Performance
- Pages must reach First Contentful Paint within 2 seconds on local network
- API routes must respond within 500ms (excluding upstream API latency)
- Cached API routes must respond within 100ms
- Animations must run at 60fps (no layout thrashing)

### Accessibility
- All interactive elements must be keyboard navigable
- Color-coded indicators (green/yellow/red) must also include a text or icon label for color-blind users
- Progress bars must have `aria-valuenow`, `aria-valuemin`, `aria-valuemax` attributes
- All images and icons must have `alt` text or `aria-label`
- Minimum contrast ratio of 4.5:1 for normal text

### Error Recovery
- Optimistic UI updates must roll back on API failure
- All API errors must surface a user-visible message (toast or inline)
- Network failures must not leave the UI in a broken state
- Widget errors must be isolated — one failing widget must not crash the dashboard

### Always-On Display
- No sleep/screensaver triggers from the app
- Content must auto-refresh without user interaction
- Subtle animations should prevent screen burn-in on OLED (gentle gradient shift)
- Night mode (10pm-6am): reduced brightness, hide non-essential widgets

### Design System

> **Critical**: All components must follow these patterns for visual consistency.

**Glassmorphism Cards**:
```css
.card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

**Color Palette**:
- Primary: Sky blue `#0ea5e9` (primary-500)
- Background gradient: `#0f172a` → `#1e293b` (slate-900 → slate-800)
- Success: `#22c55e` (green-500)
- Warning: `#eab308` (yellow-500)
- Danger: `#ef4444` (red-500)
- Text primary: `#f8fafc` (slate-50)
- Text secondary: `#94a3b8` (slate-400)

**Typography**: Inter font family. Headings bold, body regular.

**Animations**: Use Framer Motion (already installed). Widgets should fade in on load, cards should have subtle hover lift.

### Toast Notification System

All stories that reference error messages or success feedback should use a shared toast system:
- Position: top-right
- Auto-dismiss: 5 seconds for success, 10 seconds for errors
- Types: success (green), error (red), warning (yellow), info (blue)
- Must be implemented as a React context provider wrapping the app

### Standard Definition of Done (applies to all stories)
- [ ] Code reviewed
- [ ] No console errors or warnings
- [ ] Responsive (tested at 1920x1080 primary, 768px tablet, 375px mobile)
- [ ] Error states handled for all API calls
- [ ] Loading states present for all async operations
- [ ] Accessibility requirements met (keyboard nav, ARIA attributes, contrast)
- [ ] Framer Motion transitions on mount/unmount
- [ ] Deployed to Coolify staging
- [ ] Story-specific AC and DoD items checked

---

# SPRINT 0: Foundation

---

## Story F-1: Database Setup

> Note: Auth disabled for local home server playground. Add later if needed.

**As a** developer,
**I want** a PostgreSQL database with Prisma ORM,
**So that** I can persist data reliably across deployments.

### Technical Specs
```bash
npm install prisma @prisma/client
npx prisma init
```

### Schema (F-1.1: Prisma Schema)
```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  role      String   @default("admin")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model KanbanCard {
  id              String   @id @default(cuid())
  title           String
  description     String?
  column          String   // "planned", "in_progress", "completed", "on_hold"
  priority        String   @default("medium") // "low", "medium", "high"
  agentId         String?
  linkedSessionId String?
  tokensIn        Int      @default(0)
  tokensOut       Int      @default(0)
  lastPromptAt    DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([column])
  @@index([agentId])
}

model ServerMetric {
  id        String   @id @default(cuid())
  serverId  String
  cpu       Float
  memory    Float
  disk      Float
  createdAt DateTime @default(now())

  @@index([serverId, createdAt])
}

model Settings {
  id    String @id @default("default")
  key   String @unique
  value String
}

model ApiCache {
  id        String   @id @default(cuid())
  provider  String   // "weather", "sports", "news"
  data      Json
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@unique([provider])
}
```

> **Note**: Kanban column values are `"planned"`, `"in_progress"`, `"completed"`, `"on_hold"` — matching the existing codebase types.

### Acceptance Criteria (F-1 AC)
- [ ] `npx prisma db push` creates all tables
- [ ] Database URL configured via environment variable
- [ ] Connection tested from deployed container
- [ ] Migration scripts can run via `npx prisma migrate deploy`

### Definition of Done (F-1 DOD)
- [ ] All models from schema created
- [ ] Client can be generated via `npx prisma generate`
- [ ] Test query succeeds: `prisma.user.count()`
- [ ] Documentation updated with connection string format

### Test Plan (F-1)
1. Run `npx prisma db push` locally → tables created
2. Query `SELECT * FROM information_schema.tables` → 5 tables exist
3. Deploy to Coolify with DATABASE_URL → connects successfully
4. Run simple query via API → returns 200

---

## Story F-2: Toast Notification System

**As a** developer,
**I want** a global toast notification system,
**So that** all widgets can show success/error/warning messages consistently.

### Technical Specs
```tsx
// src/components/ui/ToastProvider.tsx
// React context + provider that manages a queue of toast notifications
// Wraps the app in layout.tsx

// src/components/ui/Toast.tsx
// Individual toast component with:
// - Icon per type (check, X, warning, info)
// - Auto-dismiss timer (5s success, 10s error)
// - Manual dismiss button
// - Framer Motion slide-in from right, fade-out
// - Stacks vertically (max 3 visible)
```

### Acceptance Criteria (F-2 AC)
- [ ] `useToast()` hook available from any component
- [ ] Four toast types: success, error, warning, info
- [ ] Auto-dismiss with configurable duration
- [ ] Manual dismiss via X button
- [ ] Max 3 toasts stacked, oldest dismissed when exceeded
- [ ] Animated entrance and exit

### Definition of Done (F-2 DOD)
- [ ] Provider wraps app in layout.tsx
- [ ] Hook works from any client component
- [ ] Does not interfere with other fixed-position elements (news ticker)
- [ ] Accessible (role="alert", aria-live="polite")

### Test Plan (F-2)
1. Call `toast.success('Saved')` → green toast appears top-right
2. Call `toast.error('Failed')` → red toast, stays 10s
3. Trigger 4 toasts rapidly → only 3 visible, oldest dismissed
4. Click X → toast dismissed immediately
5. **Automated**: Toast renders with correct role and aria-live attributes

---

## Story F-3: PWA Configuration

**As a** user,
**I want** Home Hub to run as a full-screen Progressive Web App,
**So that** it looks clean on my wall-mounted display with no browser chrome.

### Technical Specs
- Add `manifest.json` with `"display": "standalone"`, `"theme_color": "#0f172a"`
- Add meta tags for mobile-web-app-capable
- Add `<meta name="theme-color">` matching the dark background
- Add a 512x512 app icon (simple house icon on dark background)
- Configure Next.js to include manifest in `<head>`

### Acceptance Criteria (F-3 AC)
- [ ] "Add to Home Screen" / "Install App" prompt works in Chrome
- [ ] Installed app runs fullscreen with no address bar
- [ ] Theme color matches dark background
- [ ] App icon displays on home screen / taskbar
- [ ] Works offline for cached data (shows last-known data, not blank screen)

### Definition of Done (F-3 DOD)
- [ ] manifest.json served correctly
- [ ] Lighthouse PWA audit passes
- [ ] Works on Chrome (primary), Firefox, Safari

### Test Plan (F-3)
1. Open in Chrome → "Install" option available
2. Install → app opens fullscreen, no browser UI
3. Disconnect network → last-known data visible, error badges on stale widgets
4. **Automated**: manifest.json returns valid JSON with required fields

---

# SPRINT 1: Dashboard Layout & Always-On Display

---

## Story 1-0: Dashboard Layout & Composition

**As a** user,
**I want** a well-organized dashboard that shows all my key information at a glance,
**So that** I can see everything important from across the room.

### Layout Spec (1920x1080 primary)

```
┌─────────────────────────────────────────────────────┐
│  [Header: Home Hub logo + nav + system health bar]  │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   HERO ZONE          │   RIGHT SIDEBAR             │
│   ┌────────────┐     │   ┌────────────────────┐    │
│   │ Clock      │     │   │ Weather Widget     │    │
│   │ Date       │     │   │ Temp + 3-day       │    │
│   │ Greeting   │     │   └────────────────────┘    │
│   └────────────┘     │   ┌────────────────────┐    │
│   ┌────────────┐     │   │ Reminders Widget   │    │
│   │ Server     │     │   │ Work + Family      │    │
│   │ Status     │     │   └────────────────────┘    │
│   │ Mini-grid  │     │   ┌────────────────────┐    │
│   └────────────┘     │   │ Sports Widget      │    │
│   ┌────────────┐     │   │ Today's games      │    │
│   │ AI Copilot │     │   └────────────────────┘    │
│   │ (collapsed)│     │                              │
│   └────────────┘     │                              │
├──────────────────────┴──────────────────────────────┤
│  [News Ticker - scrolling headlines]                 │
└─────────────────────────────────────────────────────┘
```

### Responsive Breakpoints
- **1920x1080 (primary)**: Two-column layout as above
- **1280px**: Same layout, tighter spacing
- **768px (tablet)**: Single column, hero zone + widgets stacked
- **375px (mobile)**: Single column, compact widgets

### Technical Notes
- The dashboard is the `/` route, rendered by `src/components/Dashboard.tsx`
- Existing greeting logic uses time-based greeting ("Good morning/afternoon/evening, Jason")
- Clock updates every second
- All widgets load independently with their own error boundaries
- Use CSS Grid for the two-column layout: `grid-template-columns: 2fr 1fr`

### Acceptance Criteria (1-0 AC)
- [ ] Dashboard renders two-column layout on desktop (1920x1080)
- [ ] Hero zone shows: clock (large), date, greeting, server mini-grid, AI copilot
- [ ] Right sidebar shows: weather, reminders, sports (stacked vertically)
- [ ] News ticker fixed at bottom
- [ ] System health bar in header shows green/yellow/red dot per service
- [ ] Each widget loads independently (one slow widget doesn't block others)
- [ ] Widgets fade in with Framer Motion on load
- [ ] Single-column layout on tablet/mobile

### Definition of Done (1-0 DOD)
- [ ] Layout matches spec at 1920x1080
- [ ] All widgets render in correct positions
- [ ] Widget error boundaries prevent cascade failures
- [ ] Smooth transitions on mount
- [ ] Clock readable from 10 feet (minimum 3rem font)
- [ ] Tested at all 4 breakpoints

### Test Plan (1-0)
1. Load / at 1920x1080 → two-column layout, all widgets visible
2. Clock shows correct time, updates every second
3. Greeting shows "Good morning/afternoon/evening, Jason" based on time
4. Kill one API → that widget shows error, all others still work
5. Resize to 768px → single column layout
6. All widgets animate in on initial load
7. **Automated**: Dashboard component renders without errors
8. **Automated**: Each widget wrapped in error boundary

---

## Story 1-0.1: System Health Bar

**As a** user,
**I want** a compact status bar in the header showing all service health at a glance,
**So that** I can instantly see if anything is down without visiting the server page.

### Technical Specs
```tsx
// src/components/layout/SystemHealthBar.tsx
// Row of small dots/pills, one per monitored service:
// - Beszel (server metrics)
// - Coolify (deployment platform)
// - Ollama (AI)
// - Weather API
// - Sports API
// - Reminders webhook
//
// Each dot: green = healthy, yellow = degraded, red = down, gray = unknown
// Hover shows service name + last check time
// Auto-refreshes every 60 seconds via /api/health endpoint
```

### API Spec
```typescript
// GET /api/health
// Response:
{
  "services": [
    { "name": "Beszel", "status": "healthy", "latency": 45, "lastCheck": "2026-02-15T..." },
    { "name": "Coolify", "status": "healthy", "latency": 120, "lastCheck": "..." },
    { "name": "Ollama", "status": "degraded", "latency": 2500, "lastCheck": "..." },
    { "name": "Weather", "status": "down", "error": "timeout", "lastCheck": "..." }
  ]
}
```

### Acceptance Criteria (1-0.1 AC)
- [ ] Health bar visible in header, right-aligned
- [ ] One dot per service (6 services)
- [ ] Color reflects current status (green/yellow/red/gray)
- [ ] Hover tooltip shows service name, status, and latency
- [ ] Auto-refreshes every 60 seconds
- [ ] Clicking a dot navigates to relevant page (servers → /server, etc.)

### Definition of Done (1-0.1 DOD)
- [ ] All 6 services monitored
- [ ] Health checks are lightweight (HEAD requests or simple pings)
- [ ] Accessible (dots have aria-label with service name and status)
- [ ] Does not block page load (fetches after mount)

### Test Plan (1-0.1)
1. Load dashboard → health bar visible with 6 dots
2. All services running → all dots green
3. Kill Ollama → its dot turns red within 60 seconds
4. Hover over dot → tooltip shows "Ollama - Down"
5. Click Ollama dot → nothing (no dedicated page), click Beszel dot → /server
6. **Automated**: `GET /api/health` returns array of service statuses

---

## Story 1-0.2: Night Mode (Auto-Dim)

**As a** user,
**I want** the display to automatically dim and simplify at night,
**So that** it doesn't light up the room while I'm sleeping.

### Technical Specs
- Between 10:00 PM and 6:00 AM (configurable):
  - Reduce overall brightness via CSS `filter: brightness(0.4)`
  - Hide non-essential widgets (sports, news ticker, AI copilot)
  - Show only: clock (large), weather, and system health
  - Subtly shift background gradient hue to prevent OLED burn-in
- Transition smoothly (2-second CSS transition) when entering/exiting night mode
- Store schedule in `Settings` table (configurable via future settings page)

### Acceptance Criteria (1-0.2 AC)
- [ ] After 10 PM: display dims, only clock + weather + health visible
- [ ] At 6 AM: full dashboard restores with smooth transition
- [ ] Brightness reduction is noticeable but clock remains readable
- [ ] Background gradient shifts slowly to prevent burn-in
- [ ] Night mode schedule uses local timezone

### Definition of Done (1-0.2 DOD)
- [ ] Night mode activates/deactivates automatically
- [ ] Transition is smooth (no flash)
- [ ] Clock remains readable in night mode (test at arm's length)
- [ ] No console errors during mode transitions

### Test Plan (1-0.2)
1. Set system clock to 10:01 PM → dashboard dims within 1 minute
2. Set system clock to 5:59 AM → dashboard still in night mode
3. Set system clock to 6:01 AM → dashboard restores
4. During night mode: only clock, weather, health visible
5. Transition is smooth, no flicker
6. **Automated**: `isNightMode(hour)` returns correct boolean for boundary times

---

# SPRINT 2: Server Metrics

---

## Story 2-1: Server Grid Display

**As a** user,
**I want** to see all servers in a grid with their status,
**So that** I can quickly check if any servers have issues.

### Technical Specs
```tsx
// src/app/server/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ServerCard from '@/components/ServerCard'
import { Server } from '@/types/server'

export default function ServerGridPage() {
  const router = useRouter()
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchServers = async () => {
    try {
      const res = await fetch('/api/servers')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setServers(data.servers)
      setLastUpdated(new Date())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServers()
    const interval = setInterval(fetchServers, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (server: Server) => {
    if (server.cpu > 90 || server.memory > 90 || server.disk > 90) return 'red'
    if (server.cpu > 70 || server.memory > 70 || server.disk > 70) return 'yellow'
    return 'green'
  }

  if (loading) return <div className="skeleton-grid" />

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Server Metrics</h1>
        <button onClick={fetchServers} className="btn-secondary">
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 p-4 rounded mb-4" role="alert">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {servers.map(server => (
          <ServerCard
            key={server.id}
            server={server}
            status={getStatusColor(server)}
            onClick={() => router.push(`/server/${server.id}`)}
          />
        ))}
      </div>

      {lastUpdated && (
        <p className="text-sm text-gray-500 mt-4">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
```

### Server Card Component (2-1.1)
```tsx
// src/components/ServerCard.tsx
const STATUS_LABELS: Record<string, string> = {
  green: 'Healthy',
  yellow: 'Warning',
  red: 'Critical',
}

// Card shows: name, status dot + label, CPU/RAM/Disk progress bars, "View Details" link
// Progress bars use role="progressbar" with aria-valuenow/min/max
// Card is keyboard navigable (role="button", tabIndex, onKeyDown Enter)
```

### Acceptance Criteria (2-1 AC)
- [ ] Grid shows 4 server cards
- [ ] Each card shows CPU, RAM, Disk as progress bars
- [ ] Status indicator (green/yellow/red) based on thresholds, with text label
- [ ] Auto-refresh every 30 seconds
- [ ] Manual refresh button works
- [ ] Click card navigates to /server/[id]
- [ ] Loading skeleton shown while fetching
- [ ] Error message shown if fetch fails

### Definition of Done (2-1 DOD)
- [ ] All 4 servers from Beszel displayed
- [ ] Progress bars accurately reflect percentage with ARIA attributes
- [ ] Status indicators include text labels alongside color
- [ ] Refresh works both automatically and manually
- [ ] Navigation to detail page works
- [ ] Mobile responsive (1 column phone, 2 tablet, 4 desktop)

### Test Plan (2-1)
1. Load /server → 4 cards visible within 3 seconds
2. All cards show CPU/RAM/Disk bars
3. Status colors match thresholds (70%=yellow, 90%=red)
4. Wait 30s → numbers update automatically
5. Click refresh → immediate update
6. Click card → URL changes to /server/[id]
7. Resize window → responsive layout changes
8. **Automated**: API route `/api/servers` returns 200 with valid JSON schema
9. **Automated**: `getStatusColor` returns correct color for boundary values (0, 70, 71, 90, 91, 100)

---

## Story 2-2: Server Detail View

**As a** user,
**I want** to see detailed metrics for a single server,
**So that** I can diagnose issues.

### Technical Specs
- Route: `/server/[id]`
- Shows: server name, IP, status badge, uptime, CPU/Memory/Disk progress bars, load average, container count
- Back button returns to grid
- Auto-refresh every 30 seconds
- Error/404 state for invalid server ID

### Acceptance Criteria (2-2 AC)
- [ ] URL /server/[id] shows detail page
- [ ] Shows server name, IP, status, uptime
- [ ] Shows CPU, Memory, Disk with progress bars
- [ ] Shows Load Average (3 numbers)
- [ ] Shows container count
- [ ] Back button returns to grid
- [ ] 404/error state if server not found
- [ ] Auto-refresh every 30 seconds

### Definition of Done (2-2 DOD)
- [ ] Detail page renders for all 4 servers
- [ ] All metrics match Beszel source data
- [ ] Progress bars have ARIA attributes
- [ ] Error state renders for invalid server ID
- [ ] Auto-refresh interval cleans up on unmount
- [ ] Mobile responsive (single-column layout on small screens)

### Test Plan (2-2)
1. Visit /server/[valid-id] → detail page loads with all fields populated
2. All metrics displayed correctly with progress bars
3. Click back → returns to /server grid
4. Visit /server/invalid-id → error state shown
5. Wait 30s → data refreshes
6. **Automated**: API route `/api/servers/[id]` returns 200 for valid ID
7. **Automated**: API route `/api/servers/[id]` returns 404 for invalid ID

---

## Story 2-3: Server Mini-Grid (Dashboard Widget)

**As a** user,
**I want** a compact server status summary on the dashboard,
**So that** I can see server health without leaving the main screen.

### Technical Specs
```tsx
// src/components/widgets/ServerMiniGrid.tsx
// Compact 2x2 grid of server cards showing:
// - Server name
// - Status dot (green/yellow/red) with label
// - Single most-critical metric (highest of CPU/RAM/Disk) as a small progress bar
// - "All healthy" or "2 warnings" summary line below the grid
// Click any card → navigate to /server/[id]
// Click "View All" → navigate to /server
```

### Acceptance Criteria (2-3 AC)
- [ ] 2x2 compact grid on dashboard showing all 4 servers
- [ ] Each mini-card shows name, status, and highest-concern metric
- [ ] Summary line below: "All systems healthy" or "N warnings" or "N critical"
- [ ] Click card → /server/[id]
- [ ] "View All" link → /server
- [ ] Auto-refresh every 30 seconds (shared with dashboard refresh cycle)

### Definition of Done (2-3 DOD)
- [ ] Compact enough to fit dashboard hero zone
- [ ] Readable at 10 feet (server names and status dots)
- [ ] Consistent styling with other dashboard widgets

### Test Plan (2-3)
1. Load dashboard → mini-grid shows 4 servers in hero zone
2. All servers healthy → "All systems healthy" summary
3. One server at 85% CPU → yellow dot, "1 warning" summary
4. Click a server → navigates to detail page
5. Click "View All" → navigates to /server

---

# SPRINT 3: Kanban Board

---

## Story 3-1: Kanban Board UI

**As a** user,
**I want** a drag-and-drop kanban board,
**So that** I can track features through stages.

### Technical Specs
```bash
npm install @hello-pangea/dnd
```

### Column Configuration
> **Important**: Column IDs must match existing codebase types: `planned`, `in_progress`, `completed`, `on_hold`

```tsx
const COLUMNS = [
  { id: 'planned', title: 'Planned' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'completed', title: 'Completed' },
  { id: 'on_hold', title: 'On Hold' },
]
```

### Key Implementation Notes
- Optimistic drag-and-drop with rollback on API failure
- Save previous card state before updating; restore on catch
- Use toast notifications for error feedback

### Acceptance Criteria (3-1 AC)
- [ ] 4 columns displayed: Planned, In Progress, Completed, On Hold
- [ ] Cards can be dragged between columns
- [ ] Card position persists after page reload
- [ ] Cards show title, priority badge, and last updated date
- [ ] UI rolls back if column update API call fails
- [ ] Toast notification on failure

### Definition of Done (3-1 DOD)
- [ ] Drag-and-drop works across all 4 columns
- [ ] Optimistic update with rollback on failure implemented
- [ ] Cards persist to database via API
- [ ] Columns render correctly on tablet (2x2 grid) and mobile (stacked)
- [ ] Keyboard accessible (tab between cards, Enter/Space to pick up)

### Test Plan (3-1)
1. Load /kanban → 4 columns visible
2. Drag card from Planned to In Progress → card moves
3. Refresh page → card stays in new column
4. Simulate API failure → card snaps back to original column, toast shown
5. **Automated**: `PATCH /api/kanban/[id]` returns 200 and updates column
6. **Automated**: `GET /api/kanban` returns cards grouped by column

---

## Story 3-2: Agent Assignment

**As a** user,
**I want** to assign a feature to an agent,
**So that** I can track who is working on what.

### Technical Specs
- Click a card on the board → opens `CardDetailModal`
- Modal shows: title, description, priority, column, updated date
- Agent dropdown: Unassigned, Hal, Architect, Implementer
- Optimistic update with rollback on PATCH failure
- Agent badge visible on card in board view

### Acceptance Criteria (3-2 AC)
- [ ] Clicking a card on the board opens the detail modal
- [ ] Modal shows card title, description, priority, column, updated date
- [ ] Dropdown shows list of available agents (Hal, Architect, Implementer)
- [ ] Selecting an agent updates the card via API
- [ ] Agent badge shows on card in board view
- [ ] Assignment persists after page reload
- [ ] Error message shown if assignment fails
- [ ] UI rolls back to previous agent on failure

### Definition of Done (3-2 DOD)
- [ ] Modal opens/closes correctly (click outside, X button, Escape key)
- [ ] Agent select is accessible (labeled, keyboard navigable)
- [ ] Optimistic update with rollback implemented
- [ ] Agent badge visible on board cards
- [ ] Mobile responsive (modal is full-width on small screens)

### Test Plan (3-2)
1. Click a card on the board → modal opens with card details
2. Select "Hal" from agent dropdown → card updates, badge appears on board
3. Refresh page → agent assignment persists
4. Click outside modal → modal closes
5. Press Escape → modal closes
6. Simulate API failure → agent reverts, error message shown
7. **Automated**: `PATCH /api/kanban/[id]` with `agentId` returns 200
8. **Automated**: `GET /api/kanban` returns cards with `agentId` field populated

---

## Story 3-3: Card Creation Form

**As a** user,
**I want** to add new cards to the kanban board,
**So that** I can track new features and tasks.

### Technical Specs
- "Add Card" button at top of "Planned" column
- Inline form with: Title (required, max 200), Description (optional, max 2000), Priority dropdown
- POST to `/api/kanban`, card appears in Planned column immediately
- Form resets on success, shows error toast on failure

### Acceptance Criteria (3-3 AC)
- [ ] "Add Card" button visible in the Planned column
- [ ] Clicking "Add Card" shows inline form
- [ ] Form has required Title field (max 200 chars)
- [ ] Form has optional Description field (max 2000 chars)
- [ ] Form has Priority dropdown (Low, Medium, High; defaults to Medium)
- [ ] Submit creates card via `POST /api/kanban`
- [ ] New card appears in the "Planned" column immediately
- [ ] Cancel button hides the form
- [ ] Error toast shown if creation fails
- [ ] Submit button disabled while submitting or title is empty

### Definition of Done (3-3 DOD)
- [ ] Card creation persists to database
- [ ] Form inputs are labeled and accessible
- [ ] Form validates required fields client-side
- [ ] Form resets after successful submission
- [ ] Mobile responsive

### Test Plan (3-3)
1. Click "Add Card" → form appears in Planned column
2. Submit with empty title → form does not submit (button disabled)
3. Fill title and submit → card appears in board, form resets
4. Refresh page → new card persists
5. Click Cancel → form hides without creating card
6. Simulate API failure → error toast shown, form stays populated
7. **Automated**: `POST /api/kanban` with valid body returns 201 and card object
8. **Automated**: `POST /api/kanban` with empty title returns 400

---

# SPRINT 4: Personal Widgets

---

## Story 4-1: Weather Widget

**As a** user,
**I want** to see current weather and forecast,
**So that** I know if I need a jacket.

### API: Open-Meteo (Free, No Key Required)
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=40.8268
  &longitude=-74.4818
  &current=temperature_2m,weather_code,apparent_temperature
  &daily=weather_code,temperature_2m_max,temperature_2m_min
  &temperature_unit=fahrenheit
  &timezone=auto
```

> **Note**: Include `&temperature_unit=fahrenheit` — user is US-based.

### Implementation Notes
- Cache responses for 15 minutes (in-memory cache with TTL)
- Map all WMO weather codes (0-99) to human-readable conditions
- Widget shows: current temp (large), condition icon + text, feels-like, 3-day forecast row
- Condition should have both an icon/emoji AND text label (accessibility)

### Acceptance Criteria (4-1 AC)
- [ ] Shows current temperature in Fahrenheit (large, glanceable)
- [ ] Shows weather condition with icon and text label
- [ ] Shows "feels like" temperature
- [ ] Shows 3-day forecast with high/low per day
- [ ] Uses Open-Meteo API (no API key needed)
- [ ] Caches responses for 15 minutes
- [ ] Shows error state if API is unreachable

### Definition of Done (4-1 DOD)
- [ ] Widget renders on dashboard right sidebar
- [ ] All WMO weather codes mapped (codes 0-99)
- [ ] Cache prevents redundant API calls within TTL
- [ ] Error state shown if upstream API fails (502 handling)
- [ ] Temperature readable from 10 feet (large font)
- [ ] Accessible (text labels, not just icons for conditions)

### Test Plan (4-1)
1. Load dashboard → weather widget shows current temp and condition
2. "Feels like" temperature is displayed
3. 3-day forecast shows dates, highs, and lows
4. Reload within 15 minutes → no new API call (check network tab)
5. Disconnect network → error state shown
6. **Automated**: `GET /api/weather` returns 200 with `temp`, `feelsLike`, `condition`, `forecast` fields
7. **Automated**: `mapWeatherCode` returns correct string for each WMO code
8. **Automated**: Cache returns stale data within TTL, fresh data after TTL

---

## Story 4-2: Apple Reminders Widget

**As a** user,
**I want** to see my Apple Reminders on the dashboard,
**So that** I don't forget tasks.

### Setup Required
Jason must create a Shortcut that:
1. Gets reminders from Apple Reminders app
2. Outputs as JSON: `{"lists": {"Work": [...], "Family": [...]}}`
3. Has a webhook URL we can call

### Development Stub
> Until the Shortcut is ready, use mock data so development is not blocked.
> When `APPLE_REMINDERS_WEBHOOK` env var is not set, return mock data.
> Mock data should include Work (3 items) and Family (2 items) lists.

### API Contract
```
GET /api/reminders
Response: {
  "lists": {
    "Work": [{"id": "1", "title": "Review PR", "completed": false}],
    "Family": [{"id": "2", "title": "Buy milk", "completed": false}]
  }
}
```

### Widget Design
- Shows two sections: "Work" and "Family" with list names as headers
- Each item is a checkbox + title
- Completed items shown with strikethrough, at bottom of list
- Compact design: max 5 items per list visible, "N more" if truncated
- Refresh every 5 minutes

### Acceptance Criteria (4-2 AC)
- [ ] Widget shows Work list
- [ ] Widget shows Family list
- [ ] Shows task titles with completed/uncompleted state
- [ ] Clicking task toggles completed status (calls webhook)
- [ ] Shows error message if webhook is unreachable
- [ ] Works with mock data when `APPLE_REMINDERS_WEBHOOK` is not set
- [ ] Max 5 items visible per list, "N more" link if truncated

### Definition of Done (4-2 DOD)
- [ ] Widget renders with mock data in development
- [ ] Widget renders with live data when webhook is configured
- [ ] Toggle completion calls webhook and updates UI
- [ ] Error state handles timeout (5s) and non-200 responses
- [ ] Accessible (checkboxes are labeled, keyboard togglable)
- [ ] Readable from 10 feet (task titles, not tiny text)

### Test Plan (4-2)
1. Load dashboard without `APPLE_REMINDERS_WEBHOOK` set → mock data displayed
2. Work and Family lists both render with task titles
3. Click a task → toggled visually
4. Set invalid webhook URL → error message shown
5. Set valid webhook URL → live data displayed
6. **Automated**: `GET /api/reminders` returns 200 with `lists` object (mock mode)
7. **Automated**: `GET /api/reminders` returns 502 when webhook is unreachable

---

## Story 4-3: Sports Scores Widget

**As a** user,
**I want** to see scores for my teams,
**So that** I don't miss games.

### API: football-data.org (Free Tier: 10 calls/min)
```
GET https://api.football-data.org/v4/competitions/{id}/matches
Header: X-Auth-Token: YOUR_API_KEY
```

### Teams to Track
| Team | Competition ID | Notes |
|------|---------------|-------|
| Chelsea | PL (Premier League) | Primary team |
| PSG | FL1 (Ligue 1) | |
| Wrexham | ELC (League One) | |
| US Men's National Team | WC (World Cup) | International windows |
| US Women's National Team | WC (World Cup) | International windows |

### Widget Design
- Compact card per team with today's match or "No game today"
- Live games: pulsing dot + live score + minute
- Upcoming: "vs [opponent]" + kickoff time
- Completed: final score with winner highlighted
- Chelsea shown first (primary team), others below

### Acceptance Criteria (4-3 AC)
- [ ] Shows today's games for all 5 tracked teams (Chelsea, PSG, Wrexham, USMNT, USWNT)
- [ ] Shows live scores with pulsing indicator for in-progress games
- [ ] Shows "vs" with kickoff time for upcoming games
- [ ] Shows final score for completed games
- [ ] Caches responses for 15 minutes
- [ ] Shows "No games today" per team when no matches scheduled
- [ ] Shows error state if API is unreachable or key is missing

### Definition of Done (4-3 DOD)
- [ ] All 5 teams fetched from correct competition endpoints
- [ ] Cache prevents exceeding API rate limit (10 calls/min)
- [ ] Scores update on refresh
- [ ] Error state if `FOOTBALL_DATA_API_KEY` is not set
- [ ] Accessible (scores readable by screen reader, not just color-coded)
- [ ] Chelsea always listed first

### Test Plan (4-3)
1. Load dashboard → sports widget shows sections for all 5 teams
2. Team with a game today shows score or upcoming time
3. Team with no game today shows "No games today"
4. Wait 15 minutes → cache expires, fresh data on next load
5. Remove API key → error message shown
6. **Automated**: `GET /api/sports` returns 200 with array of team match objects
7. **Automated**: `GET /api/sports` returns 502 when API key is missing
8. **Automated**: Cache returns stale data within 15-minute TTL

---

## Story 4-4: News Ticker

**As a** user,
**I want** to see headlines scrolling at the bottom of the display,
**So that** I stay informed passively.

### Sources (RSS)
- Tech: `https://hnrss.org/frontpage`
- AI: `https://hnrss.org/newest?q=artificial%20intelligence`
- Security: `https://hnrss.org/newest?q=security`

### Widget Design
- Fixed bar at bottom of viewport (above any page padding)
- Continuous right-to-left scroll animation via CSS (`@keyframes marquee`)
- Headlines prefixed with colored source tag: `[Tech]`, `[AI]`, `[Security]`
- Pauses on hover (desktop)
- Hidden during night mode
- Bottom padding on dashboard content so ticker doesn't overlap widgets

### Acceptance Criteria (4-4 AC)
- [ ] Ticker scrolls right-to-left at bottom of page
- [ ] Pauses on hover
- [ ] Max 10 headlines total across all sources
- [ ] Each headline prefixed with source tag (Tech, AI, Security)
- [ ] Source tags color-coded (Tech=blue, AI=purple, Security=orange)
- [ ] Refreshes every 30 minutes
- [ ] Click headline opens article in new tab
- [ ] Ticker hidden if no headlines loaded
- [ ] Ticker hidden during night mode

### Definition of Done (4-4 DOD)
- [ ] Headlines fetched from all 3 RSS sources
- [ ] Marquee animation smooth and continuous at 60fps
- [ ] Pause on hover works on desktop
- [ ] Links open in new tab with `rel="noopener noreferrer"`
- [ ] Accessible (`aria-label`, links have descriptive text)
- [ ] Dashboard content has bottom padding so ticker doesn't overlap

### Test Plan (4-4)
1. Load dashboard → ticker visible at bottom with headlines
2. Hover over ticker → animation pauses
3. Move mouse away → animation resumes
4. Click a headline → opens in new tab
5. Headlines show colored source tag prefix
6. Count headlines → max 10
7. Wait 30 minutes → headlines refresh
8. **Automated**: `GET /api/news` returns 200 with `headlines` array
9. **Automated**: Each headline has `id`, `title`, `url`, `source` fields

---

# SPRINT 5: AI & Delight Features

---

## Story 5-1: AI Copilot Widget

**As a** user,
**I want** a chat interface to my local Ollama AI on the dashboard,
**So that** I can quickly ask questions or get help without switching apps.

### Technical Specs
- Uses existing Ollama instance at `OLLAMA_BASE_URL` with `OLLAMA_MODEL`
- Chat interface: message input at bottom, conversation history scrolling up
- Collapsible: shows last message preview when collapsed, full chat when expanded
- On dashboard: starts collapsed to save space, click to expand
- Conversation persists in memory during session (clears on page reload)
- System prompt: "You are Hal, a helpful AI assistant for Jason's home lab. Be concise and practical."

### Widget Design (Collapsed)
```
┌──────────────────────────────────┐
│ Hal - AI Copilot            [^]  │
│ "Sure, here's how to restart..." │
└──────────────────────────────────┘
```

### Widget Design (Expanded)
```
┌──────────────────────────────────┐
│ Hal - AI Copilot            [v]  │
├──────────────────────────────────┤
│ You: How do I restart Coolify?   │
│                                  │
│ Hal: Sure, SSH into the server   │
│ and run `docker restart coolify` │
│                                  │
├──────────────────────────────────┤
│ [Type a message...        ] [>]  │
└──────────────────────────────────┘
```

### Acceptance Criteria (5-1 AC)
- [ ] Chat widget on dashboard in hero zone
- [ ] Starts collapsed showing last AI response preview
- [ ] Click to expand to full chat view
- [ ] Send message → streams AI response
- [ ] Shows typing indicator while AI is responding
- [ ] Conversation history scrolls, latest message visible
- [ ] Input field clears after sending
- [ ] Error toast if Ollama is unreachable
- [ ] Hidden during night mode

### Definition of Done (5-1 DOD)
- [ ] Connects to Ollama at configured URL
- [ ] Streaming response (not waiting for full completion)
- [ ] Graceful fallback if Ollama is down
- [ ] Input accessible (label, keyboard submit with Enter)
- [ ] Collapse/expand animation smooth

### Test Plan (5-1)
1. Load dashboard → copilot widget visible (collapsed)
2. Click to expand → full chat view
3. Type message and submit → AI responds with streaming text
4. Typing indicator visible during response
5. Click collapse → shows last response preview
6. Kill Ollama → error toast, input disabled with "AI unavailable" message
7. **Automated**: `POST /api/ai/chat` with message returns streaming response
8. **Automated**: `POST /api/ai/chat` returns 502 when Ollama is unreachable

---

## Story 5-2: Animated Background & Burn-In Prevention

**As a** user,
**I want** a subtly animated background,
**So that** the display feels alive and prevents OLED burn-in.

### Technical Specs
- Slow-moving gradient animation using CSS (`@keyframes gradient-shift`)
- Cycle through subtle hue variations of the dark slate palette
- Full animation cycle: 5 minutes (imperceptibly slow)
- Uses `background-size: 400% 400%` with `background-position` animation
- Barely noticeable during normal use, but prevents static pixels
- Reduced motion: respect `prefers-reduced-motion` media query (static gradient)

### Acceptance Criteria (5-2 AC)
- [ ] Background gradient slowly shifts colors (not noticeable unless watching for it)
- [ ] Full animation cycle takes ~5 minutes
- [ ] Does not impact performance (CSS-only, no JS)
- [ ] Respects `prefers-reduced-motion` (static for users who prefer no animation)
- [ ] Works with all widgets overlaid (glassmorphism still looks good)

### Definition of Done (5-2 DOD)
- [ ] CSS animation in globals.css
- [ ] No JavaScript involved in animation
- [ ] FPS unaffected (verify with Chrome DevTools performance tab)
- [ ] Glassmorphism cards still look correct over animated background

### Test Plan (5-2)
1. Load dashboard → background is dark gradient (looks normal)
2. Watch for 30 seconds → slight color shift noticeable
3. Wait 5 minutes → gradient has cycled visibly
4. Set `prefers-reduced-motion: reduce` → gradient is static
5. Check DevTools performance → no layout thrashing, steady 60fps

---

## Story 5-3: Page Transitions

**As a** user,
**I want** smooth transitions when navigating between pages,
**So that** the app feels polished and professional.

### Technical Specs
- Use Framer Motion `AnimatePresence` in layout
- Page enter: fade in + subtle slide up (200ms, ease-out)
- Page exit: fade out (150ms)
- Widget mount: staggered fade-in (each widget 50ms delay after previous)

### Acceptance Criteria (5-3 AC)
- [ ] Navigating between Dashboard/Servers/Kanban has smooth transition
- [ ] No flash of unstyled content during transitions
- [ ] Widgets on dashboard stagger their entrance
- [ ] Respects `prefers-reduced-motion` (instant switch, no animation)

### Definition of Done (5-3 DOD)
- [ ] AnimatePresence wrapping page content
- [ ] Transitions feel snappy, not slow (total <400ms)
- [ ] No layout shift during transitions
- [ ] Works with Next.js App Router

### Test Plan (5-3)
1. Click Dashboard → Servers → smooth fade transition
2. Click back → smooth fade back
3. Load dashboard fresh → widgets stagger in
4. Set reduced motion preference → instant page switch
5. **Manual**: Transitions feel fast and polished, not sluggish

---

## Story 5-4: Keyboard Shortcut Navigation

**As a** user,
**I want** keyboard shortcuts to navigate the dashboard,
**So that** I can quickly switch views without a mouse.

### Shortcuts
| Key | Action |
|-----|--------|
| `1` or `d` | Go to Dashboard |
| `2` or `s` | Go to Servers |
| `3` or `k` | Go to Kanban |
| `r` | Refresh current page data |
| `n` | Toggle night mode |
| `?` | Show shortcut help overlay |

### Technical Notes
- Only active when no input/textarea is focused
- Show brief toast "Refreshing..." when `r` is pressed
- Help overlay: semi-transparent modal listing all shortcuts

### Acceptance Criteria (5-4 AC)
- [ ] Pressing `1` navigates to Dashboard
- [ ] Pressing `2` navigates to Servers
- [ ] Pressing `3` navigates to Kanban
- [ ] Pressing `r` refreshes all widgets/data on current page
- [ ] Pressing `n` toggles night mode
- [ ] Pressing `?` shows help overlay
- [ ] Shortcuts disabled when typing in an input field
- [ ] Help overlay dismissable with Escape or `?`

### Definition of Done (5-4 DOD)
- [ ] Global keyboard listener in layout
- [ ] Does not interfere with browser shortcuts
- [ ] Does not fire when focus is on input/textarea/select
- [ ] Help overlay accessible and dismissable

### Test Plan (5-4)
1. Press `1` → navigates to Dashboard
2. Press `2` → navigates to Servers
3. Press `r` → data refreshes, toast shown
4. Press `?` → help overlay appears
5. Press Escape → help overlay closes
6. Focus on search input, press `1` → nothing happens (shortcut disabled)
7. Press `n` → night mode toggles

---

# Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/homehub

# External APIs (leave empty if not using)
FOOTBALL_DATA_API_KEY=
BOOKSTACK_URL=http://192.168.85.178
BOOKSTACK_API_KEY=
APPLE_REMINDERS_WEBHOOK=

# Ollama
OLLAMA_BASE_URL=http://192.168.85.50:11434
OLLAMA_MODEL=qwen3:14b

# Night Mode (24h format, local timezone)
NIGHT_MODE_START=22
NIGHT_MODE_END=6
```

---

# Definition of Done (Full Project)

- [ ] All AC checked per story
- [ ] All DOD checked per story
- [ ] All automated tests pass
- [ ] No console errors or warnings
- [ ] Looks great at 1920x1080 (primary always-on display)
- [ ] Responsive at 768px and 375px
- [ ] Accessibility audit passes (keyboard nav, ARIA, contrast)
- [ ] Error states for all API failures
- [ ] Loading states for all async operations
- [ ] Framer Motion transitions throughout
- [ ] Night mode works automatically
- [ ] PWA installable
- [ ] Deployed to Coolify
- [ ] Documentation updated

---

# Sprint Summary

| Sprint | Focus | Stories |
|--------|-------|---------|
| 0 | Foundation | F-1 Database, F-2 Toasts, F-3 PWA |
| 1 | Dashboard & Display | 1-0 Layout, 1-0.1 Health Bar, 1-0.2 Night Mode |
| 2 | Server Metrics | 2-1 Grid, 2-2 Detail, 2-3 Mini-Grid Widget |
| 3 | Kanban Board | 3-1 Board UI, 3-2 Agent Assignment, 3-3 Card Creation |
| 4 | Personal Widgets | 4-1 Weather, 4-2 Reminders, 4-3 Sports, 4-4 News |
| 5 | AI & Delight | 5-1 AI Copilot, 5-2 Background, 5-3 Transitions, 5-4 Shortcuts |
