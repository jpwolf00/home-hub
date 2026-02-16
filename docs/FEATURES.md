# Home Hub Dashboard - Feature Overview

## Overview
Home Hub is a personal dashboard for monitoring your home infrastructure. Built with Next.js, deployed on Coolify.

**URL:** http://192.168.85.202:3000 (local)

---

## Pages

### 1. Dashboard (/)
**Location:** `/src/app/page.tsx`

A collection of widgets showing at-a-glance information:

- **Tasks Widget** - Add/complete todo items (local storage, not persisted)
- **Weather Widget** - Current weather (requires OpenWeatherMap API key)
- **Unraid Widget** - Server stats (CPU, RAM, Disk) - currently shows mock/limited data
- **Sports Widget** - Premier League soccer scores (requires football-data.org API key)
- **AI Copilot Widget** - Chat interface using local Ollama (192.168.85.50:11434)

---

### 2. Server Monitor (/server)
**Location:** `/src/app/server/page.tsx`

Displays real-time stats for all monitored VMs via Beszel:

| Server | IP | Stats Shown |
|--------|-----|-------------|
| UNRAID | 192.168.85.199 | CPU, RAM, Disk |
| OPENCLAW | 192.168.85.200 | CPU, RAM, Disk |
| OLLAMA | 192.168.85.195 | CPU, RAM, Disk |
| COOLIFY | 192.168.85.202 | CPU, RAM, Disk |

**Data Source:** Beszel API (192.168.85.199:8090)
- Auto-refreshes every 30 seconds
- Shows online/offline status
- Color-coded metrics (green/yellow/red)

---

### 3. Kanban Board (/kanban)
**Location:** `/src/app/kanban/page.tsx`

Feature/idea tracking board with columns:
- **Backlog** - Ideas not started
- **In Progress** - Features being worked on
- **Done** - Completed features

Features:
- Add new features with title and description
- Drag cards between columns (UI exists, persistence in-memory)
- Track agent name, tokens used, last prompt time

---

## Navigation

Top navigation bar with links to:
- Dashboard (/)
- Servers (/server)
- Kanban (/kanban)

---

## Technical Details

### API Routes
- `/api/servers` - Fetches data from Beszel
- `/api/weather` - Weather data (needs API key)
- `/api/sports` - Sports scores (needs API key)
- `/api/ai/chat` - Ollama chat proxy
- `/api/tasks` - Task management
- `/api/kanban` - Kanban board data

### Environment Variables Needed
```
OPENWEATHERMAP_API_KEY - Weather data
FOOTBALL_DATA_API_KEY - Sports scores
OLLAMA_BASE_URL - http://192.168.85.50:11434
OLLAMA_MODEL - qwen3:14b
```

---

## Known Issues (as of 2026-02-15)

1. **UI Quality** - Needs UX review, feels "engineer-y"
2. **Widgets not fully connected** - Weather, Sports need API keys
3. **No persistence** - Tasks and Kanban data lost on reload (in-memory)
4. **No authentication** - Anyone can access

---

## Future Improvements

1. Connect to Apple Reminders for tasks
2. Add proper database (SQLite/Postgres)
3. Improve UI with proper design review
4. Add authentication
5. Connect more services (camera feeds, etc.)
