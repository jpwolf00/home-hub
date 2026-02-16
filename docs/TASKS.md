# Home Hub v2 - Detailed Feature Specifications

## PRIORITY 0: Authentication (MUST FIX BEFORE ANYTHING ELSE)

### Feature: Basic HTTP Authentication

**Description:** Add simple password protection to prevent unauthorized access

**Acceptance Criteria:**
- [ ] Dashboard requires password on first load
- [ ] Password stored as hash (bcrypt)
- [ ] Session persists for 24 hours
- [ ] Login page shows "Home Hub" branding
- [ ] Incorrect password shows error message

**Definition of Done:**
- [ ] Auth middleware blocks all routes except /login
- [ ] POST /api/auth/login returns 200 + sets cookie
- [ ] POST /api/auth/logout clears cookie
- [ ] GET /api/auth/me returns user info or 401

**Test Plan:**
1. Visit any / route → redirect to /login
2. Enter wrong password → show error
3. Enter correct password → redirect to dashboard
4. Refresh page → stays logged in
5. Click logout → redirect to /login

---

## SPRINT 1: Foundation & Server Metrics

### Feature 1.1: Database Setup

**Description:** Add PostgreSQL database via Prisma for persistence

**Acceptance Criteria:**
- [ ] Prisma schema defined for: users, server_metrics, kanban_cards, settings
- [ ] Database connects via environment variable DATABASE_URL
- [ ] migrations can be run via `npx prisma migrate deploy`
- [ ] Database deployed in Coolify alongside app

**Technical Spec:**
```prisma
// schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // hashed
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
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

model KanbanCard {
  id          String   @id @default(cuid())
  title       String
  description String?
  column      String   // "new", "planning", "in-progress", "complete"
  priority    String   @default("medium")
  agentId     String?
  linkedSessionId String?
  tokensIn    Int      @default(0)
  tokensOut   Int      @default(0)
  lastPrompt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Settings {
  id    String @id @default("default")
  key   String @unique
  value String
}
```

**Test Plan:**
1. Run `npx prisma db push` → tables created
2. Query each table → successful
3. Deploy to Coolify → connects successfully

---

### Feature 1.2: Server Metrics Grid View

**Description:** Display all servers in a responsive grid with real-time stats

**Acceptance Criteria:**
- [ ] Grid displays 4 servers: Unraid, Openclaw, Ollama, Coolify
- [ ] Each card shows: name, status (green/yellow/red), CPU %, RAM %, Disk %
- [ ] Auto-refresh every 30 seconds
- [ ] Manual refresh button works
- [ ] Click server card → navigates to /server/[id]
- [ ] Mobile: 2 columns on tablet, 1 column on phone

**UI Spec:**
```
┌─────────────────────────────────────────────────┐
│  SERVER METRICS                    [🔄 Refresh] │
├────────┬────────┬────────┬──────────────────────┤
│ UNRAID │OPENCLAW│OLLAMA │ COOLIFY             │
│   🟢   │   🟢   │  🟢   │   🟢               │
│ CPU 8% │  CPU 2%│ CPU 1%│ CPU 5%             │
│ ████░░ │ ██░░░░ │ █░░░░░ │ █████░░           │
│ RAM 67%│ RAM 30%│ RAM 32%│ RAM 33%           │
│ ██████ ███░░░░ ███░░░░ ███░░░░             │
│ Disk 76%│Disk 12%│Disk 34%│ Disk 20%          │
│ ██████ ██░░░░░ ████░░░ ███░░░░             │
│ [View] │ [View] │ [View] │ [View]            │
└────────┴────────┴────────┴──────────────────────┘
```

**API Endpoint:** `GET /api/servers` (already implemented)

**Test Plan:**
1. Load /server → all 4 cards visible
2. Wait 30s → numbers update
3. Click refresh → numbers update immediately
4. Click "View" → /server/unraid page loads
5. Resize to mobile → 1 column layout
6. Disconnect network → "Unable to fetch" error shown

---

### Feature 1.3: Server Detail View

**Description:** Detailed view for single server with metrics

**Acceptance Criteria:**
- [ ] URL: /server/[serverId]
- [ ] Shows server name, IP, status, uptime
- [ ] Shows CPU, Memory, Disk with progress bars
- [ ] Shows Load Average (3 numbers)
- [ ] Shows Container count (if applicable)
- [ ] "Back to Overview" button works
- [ ] Auto-refresh every 30 seconds
- [ ] Error state if server unreachable

**UI Spec:**
```
┌─────────────────────────────────────────────────┐
│  ← Back         UNRAID                        │
├─────────────────────────────────────────────────┤
│  Status: 🟢 Online                             │
│  IP: 192.168.85.199                           │
│  Uptime: 5 days, 3 hours                      │
├─────────────────────────────────────────────────┤
│  CPU          ████████░░  78%                │
│  Memory       ██████████  100%  (14.2 GB)       │
│  Disk         ██████░░░░  67%  (8.2 TB)        │
├─────────────────────────────────────────────────┤
│  Load Average:  4.58  3.79  3.61             │
│  Containers:   24 running                      │
└─────────────────────────────────────────────────┘
```

**Test Plan:**
1. Navigate to /server/unraid → detail page loads
2. Verify all metrics displayed
3. Click back → returns to grid
4. Wait 30s → auto-refresh
5. Server goes offline → status shows red, "Offline"

---

## SPRINT 2: Kanban Feature Tracking

### Feature 2.1: Kanban Board UI

**Description:** Drag-and-drop kanban for feature tracking

**Acceptance Criteria:**
- [ ] 4 columns: New, Planning, In Progress, Complete
- [ ] Cards can be dragged between columns
- [ ] Add new card button in each column
- [ ] Card shows: title, priority badge, updated timestamp
- [ ] Click card → opens detail modal
- [ ] Persists to database on move/add/edit

**UI Spec:**
```
┌─────────────────────────────────────────────────────────────┐
│  KANBAN                               [+ Add Feature]       │
├──────────────┬──────────────┬───────────────┬──────────────┤
│    NEW       │   PLANNING   │ IN PROGRESS   │   COMPLETE   │
├──────────────┼──────────────┼───────────────┼──────────────┤
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │
│ │ Add API  │ │ │Add auth  │ │ │Server    │ │ │Setup     │ │
│ │endpoint  │ │ │middleware│ │ │metrics   │ │ │Beszel   │ │
│ │ 🔴 High  │ │ │ 🟡 Med   │ │ │ 🟢 Low   │ │ │ ✅ Done  │ │
│ │ Updated  │ │ │ Updated  │ │ │ Agent: Hal│ │ │ Updated  │ │
│ │ 2h ago  │ │ │ 1d ago  │ │ │ Tokens:5k│ │ │ 3d ago  │ │
│ └──────────┘ │ └──────────┘ │ └──────────┘ │ └──────────┘ │
├──────────────┼──────────────┼───────────────┼──────────────┤
│ [+ Add]     │ [+ Add]      │ [+ Add]      │ [+ Add]     │
└──────────────┴──────────────┴───────────────┴──────────────┘
```

**API Endpoints:**
- `GET /api/kanban` - list all cards
- `POST /api/kanban` - create card
- `PATCH /api/kanban/[id]` - update card (move, edit)
- `DELETE /api/kanban/[id]` - delete card

**Test Plan:**
1. Load /kanban → 4 columns visible
2. Click "+ Add" → modal opens
3. Enter title "Test Feature", select priority → card appears in "New"
4. Drag card to "In Progress" → persists after refresh
5. Click card → detail modal opens
6. Delete card → removed from board

---

### Feature 2.2: Agent Status Tracking

**Description:** Show agent assignment and activity on kanban cards

**Acceptance Criteria:**
- [ ] Card can be assigned to an agent (dropdown: Hal, architect, implementer, etc.)
- [ ] Card shows "agent" badge with agent name
- [ ] If card in "In Progress" > 5 min without update → yellow "stalled" indicator
- [ ] If card in "In Progress" > 10 min without update → red "blocked" indicator
- [ ] "Last activity" shows relative time ("5 minutes ago")

**Stall Detection Logic:**
```typescript
function getCardStatus(card: KanbanCard): 'active' | 'stalled' | 'blocked' {
  if (card.column !== 'in-progress') return 'active';
  const minsSinceUpdate = (Date.now() - card.updatedAt) / 60000;
  if (minsSinceUpdate > 10) return 'blocked';
  if (minsSinceUpdate > 5) return 'stalled';
  return 'active';
}
```

**Test Plan:**
1. Create card, assign to "Hal" → badge shows "Hal"
2. Move card to "In Progress"
3. Wait 6 min → shows yellow "stalled"
4. Wait 5 more min → shows red "blocked"
5. Add comment/update → resets timer

---

### Feature 2.3: Session Integration (Future)

**Description:** Link kanban cards to OpenClaw sessions (deferred)

**Note:** This requires verifying sessions_list API capabilities. For now, manual agent assignment is sufficient.

**Deferred Acceptance Criteria:**
- [ ] Can link card to active OpenClaw session
- [ ] Shows token count from session
- [ ] Shows last prompt time from session

---

## SPRINT 3: Personal Widgets

### Feature 3.1: Weather Widget

**Description:** Show current weather and forecast

**Acceptance Criteria:**
- [ ] Shows current temperature (Morris Plains, NJ)
- [ ] Shows weather condition (sunny, cloudy, etc.) with icon
- [ ] Shows "feels like" temperature
- [ ] Shows 3-day forecast (high/low temps)
- [ ] Shows weather alert if active (NOAA)
- [ ] Uses Open-Meteo API (free, no key required)
- [ ] Caches data for 15 minutes

**API:** `https://api.open-meteo.com/v1/forecast?latitude=40.8268&longitude=-74.4818&current=temperature_2m,weather_code,apparent_temperature&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`

**UI Spec:**
```
┌────────────────────────────┐
│  WEATHER          ☀️ Sunny │
│                            │
│     72° F                  │
│  Feels like 68°            │
│                            │
│  TODAY     TOMORROW   DAY3 │
│   ☀️       🌤️        🌧️   │
│  72/55    68/50     65/48  │
└────────────────────────────┘
```

**Test Plan:**
1. Load dashboard → weather widget shows
2. Verify temp matches local weather
3. Wait 15 min → data refreshes
4. Go offline → shows cached data or error

---

### Feature 3.2: Apple Reminders (Read-Only)

**Description:** Display tasks from Apple Reminders

**Acceptance Criteria:**
- [ ] Shows two lists: "Work" and "Family"
- [ ] Lists fetched via Shortcuts webhook URL
- [ ] Shows incomplete tasks only (max 10 per list)
- [ ] Click task → marks complete (calls webhook)
- [ ] Error state if webhook unreachable
- [ ] Caches for 5 minutes

**Note:** Requires Jason to set up Shortcuts webhook that returns JSON:
```json
{
  "lists": {
    "Work": [{"id": "1", "title": "Review PR", "completed": false}],
    "Family": [{"id": "2", "title": "Buy milk", "completed": false}]
  }
}
```

**Test Plan:**
1. Configure webhook URL in env
2. Load dashboard → tasks appear in Work/Family
3. Click task → shows completed
4. Webhook fails → shows error message
5. Mark complete in Apple Reminders → syncs on next refresh

---

### Feature 3.3: Sports Scores Widget

**Description:** Show upcoming/past scores for tracked teams

**Teams to Track:**
| Team | League | API Source |
|------|--------|------------|
| Chelsea | Premier League | football-data.org |
| PSG | Ligue 1 | football-data.org |
| Wrexham | League One | football-data.org |
| US Men's National Team | FIFA | football-data.org |
| US Women's National Team | FIFA | football-data.org |

**Acceptance Criteria:**
- [ ] Shows today's games for tracked teams
- [ ] Shows score (or "vs" if upcoming with time)
- [ ] Shows team logos/colors
- [ ] Tappable → opens league/app page
- [ ] Caches for 15 minutes
- [ ] Shows "No games today" if empty
- [ ] API key configurable in env

**Test Plan:**
1. Set FOOTBALL_DATA_API_KEY in env
2. Load dashboard → widget shows games
3. Chelsea playing → shows score or "Today 3:00 PM"
4. No games → shows "No games today"
5. Bad API key → shows error

---

### Feature 3.4: News Ticker

**Description:** Horizontal scrolling news ticker

**Acceptance Criteria:**
- [ ] Ticker scrolls right-to-left at bottom of screen
- [ ] Shows headlines from RSS feeds
- [ ] Sources: Tech (Hacker News), Security, AI
- [ ] Pauses on hover
- [ ] Click headline → opens in new tab
- [ ] Max 10 items, refreshes every 30 min

**Sources:**
- Tech: https://hnrss.org/frontpage
- AI: https://hnrss.org/newest?q=artificial%20intelligence
- Security: https://hnrss.org/newest?q=security

**Test Plan:**
1. Load dashboard → ticker visible at bottom
2. Headlines scroll automatically
3. Hover → scrolling stops
4. Click headline → opens Hacker News
5. No internet → shows cached or empty

---

## SPRINT 4: Integrations

### Feature 4.1: BookStack Document Widget

**Description:** Quick access to document repository

**Configuration:**
- URL: http://192.168.85.178
- API Key: configured in environment

**Acceptance Criteria:**
- [ ] Search box searches BookStack docs
- [ ] Shows top 5 recent documents
- [ ] Click result → opens in new tab
- [ ] Shows document icon and title
- [ ] Error state if BookStack unreachable
- [ ] Works from LAN only

**Note:** If deployed externally, requires Cloudflare Tunnel or similar to access internal IP.

**Test Plan:**
1. Configure BOOKSTACK_API_KEY in env
2. Type in search → results appear
3. Click result → opens BookStack page
4. No network to 192.168.85.178 → shows error

---

## SPRINT 5: Polish & UX

### Feature 5.1: Loading States

**Acceptance Criteria:**
- [ ] Every widget shows skeleton loader on first load
- [ ] Skeleton matches widget dimensions
- [ ] Loading lasts < 3 seconds normally

### Feature 5.2: Error States

**Acceptance Criteria:**
- [ ] API failure shows friendly message + retry button
- [ ] Network offline shows "Unable to connect"
- [ ] Error doesn't break entire page (isolated to widget)

### Feature 5.3: Mobile Responsiveness

**Acceptance Criteria:**
- [ ] Single column on phones (< 640px)
- [ ] Two columns on tablets (640px - 1024px)
- [ ] Full grid on desktop (> 1024px)
- [ ] Touch-friendly tap targets (min 44px)

### Feature 5.4: Theme Toggle

**Acceptance Criteria:**
- [ ] Dark mode (current default)
- [ ] Light mode option
- [ ] Persists preference in localStorage

---

## Environment Variables Summary

```env
# Database
DATABASE_URL=postgresql://...

# Auth
AUTH_PASSWORD=your-secure-password-hash

# External APIs
OPENWEATHERMAP_API_KEY=      # Not needed - using Open-Meteo
FOOTBALL_DATA_API_KEY=       # Get from football-data.org
BOOKSTACK_URL=http://192.168.85.178
BOOKSTACK_API_KEY=

# Apple Reminders
APPLE_REMINDERS_WEBHOOK=     # Your Shortcuts webhook URL

# Ollama
OLLAMA_BASE_URL=http://192.168.85.50:11434
OLLAMA_MODEL=qwen3:14b
```

---

## Definition of Done (Full Project)

- [ ] All acceptance criteria checked per feature
- [ ] No console errors on page load
- [ ] Mobile responsive (tested on phone viewport)
- [ ] All external API errors handled gracefully
- [ ] Database persists across restarts
- [ ] Authentication working
- [ ] Deployed to Coolify successfully
- [ ] Documentation updated
