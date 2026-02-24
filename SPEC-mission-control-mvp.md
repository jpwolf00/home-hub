# SPEC-mission-control-mvp.md

## 0) Objective
Ship a **read-only Mission Control MVP** as a **separate web service on port 3001** that tracks workflow/task state and active agent/subagent activity without impacting the existing Home Hub dashboard on port 3000.

---

## 1) Architecture Decision (Explicit)

## Decision
Use a **second app service in the same repo** (recommended), not a second process inside the existing dashboard service.

### Why
- Strong isolation of runtime, ports, env vars, and deploy lifecycle.
- Lower risk of regressions in the existing dashboard.
- Cleaner Coolify operations (independent deploys/healthchecks/logs).
- Easy rollback of Mission Control without touching dashboard.

## Topology
- Existing app remains unchanged:
  - `home-hub` service → Next.js app on **3000**
- New app:
  - `mission-control` service → Next.js app on **3001**

## Repo Layout (implementation target)
```text
/home/jpwolf00/.openclaw/workspace/home-hub/
  src/                        # existing dashboard app (port 3000)
  mission-control/            # NEW standalone Next.js app (port 3001)
    src/
    package.json
    next.config.js
    tsconfig.json
    data/                     # optional local seed/fallback files
  data/
    mission-control/
      mission-control.db      # canonical SQLite store (persistent volume)
      snapshots/
        openclaw-snapshot.json
      cache/
        deploy-status.json
```

## Coolify Deployment Model
Create **two application entries** in Coolify pointing to same repo, different base directories:
1. Home Hub app
   - Base dir: `/` (or current existing)
   - Port: `3000`
2. Mission Control app
   - Base dir: `/mission-control`
   - Port: `3001`

If Coolify cannot use a subdirectory directly, use a dedicated build command that `cd mission-control` before install/build/start.

## Required Mission Control Env Vars
```bash
# Runtime
NODE_ENV=production
PORT=3001
MISSION_CONTROL_PORT=3001
TZ=America/New_York

# Storage (must be persistent volume path)
MC_DATA_DIR=/app/data/mission-control
MC_DB_PATH=/app/data/mission-control/mission-control.db
MC_SNAPSHOT_PATH=/app/data/mission-control/snapshots/openclaw-snapshot.json
MC_DEPLOY_CACHE_PATH=/app/data/mission-control/cache/deploy-status.json

# Polling
MC_POLL_MS=15000
MC_STALLED_MINUTES=10
MC_DEPLOY_POLL_MS=60000

# Optional Coolify integration
COOLIFY_BASE_URL=http://192.168.85.202:8000
COOLIFY_TOKEN=<secret>
COOLIFY_APP_UUID=<optional, for filtering to mission/home-hub app>

# Optional OpenClaw gateway/snapshot source
OPENCLAW_GATEWAY_URL=<optional>
OPENCLAW_GATEWAY_TOKEN=<optional>
MC_SNAPSHOT_MAX_AGE_MS=120000
```

---

## 2) MVP Scope (Must-Have Only)

### In Scope (v1)
1. **Workflows/Tasks board (read-only)**
   - Group tasks by status: `Planned`, `In Progress`, `Review`, `Blocked`, `Done`.
2. **Agents/Subagents panel (read-only)**
   - Show active and recently seen agents with runtime, last update, status.
3. **Activity strip (read-only)**
   - Show latest deploy status/timestamp and recent ingestion events.
4. **Stalled-run indicator**
   - Highlight task/agent if no update for >10 min.

### Out of Scope (v1)
- Creating/editing/deleting tasks in UI.
- Triggering deploys from UI.
- Agent controls (kill/restart/steer).
- RBAC/auth complexity (assume private/internal network initially).

---

## 3) Data Model & Storage

## Canonical Source of Truth
Use **SQLite** for canonical state (fast, local, durable, simple). Path:
- `/app/data/mission-control/mission-control.db` in container
- mapped to host persistent volume via Coolify

Snapshot JSON files are **ingestion inputs**, not canonical state.

## Tables

### `workflows`
```sql
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  workflow TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('Planned','In Progress','Review','Blocked','Done')),
  ownerAgent TEXT,
  specPath TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

### `agents`
```sql
CREATE TABLE IF NOT EXISTS agents (
  sessionKey TEXT PRIMARY KEY,
  runId TEXT,
  model TEXT,
  runtimeSeconds INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('idle','running','blocked','error','offline','completed')),
  lastSeen TEXT NOT NULL,
  workflow TEXT,
  currentTaskId TEXT,
  updatedAt TEXT NOT NULL
);
```

### `activity_events`
```sql
CREATE TABLE IF NOT EXISTS activity_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,                -- 'deploy' | 'ingestion' | 'agent' | 'workflow'
  level TEXT NOT NULL,               -- 'info' | 'warn' | 'error'
  source TEXT NOT NULL,              -- 'coolify' | 'openclaw' | 'system'
  message TEXT NOT NULL,
  metadataJson TEXT,
  createdAt TEXT NOT NULL
);
```

### `deploy_status`
```sql
CREATE TABLE IF NOT EXISTS deploy_status (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,            -- 'coolify'
  appUuid TEXT,
  status TEXT NOT NULL,              -- normalized: success|failed|running|unknown
  startedAt TEXT,
  finishedAt TEXT,
  updatedAt TEXT NOT NULL,
  rawJson TEXT
);
```

## Canonical JSON Shapes (API output)

### Workflow record
```json
{
  "id": "wf-task-001",
  "title": "Mission Control MVP spec",
  "workflow": "mission-control-mvp",
  "status": "In Progress",
  "ownerAgent": "architect",
  "specPath": "/home/jpwolf00/.openclaw/workspace/home-hub/SPEC-mission-control-mvp.md",
  "createdAt": "2026-02-19T23:00:00.000Z",
  "updatedAt": "2026-02-20T00:05:00.000Z",
  "notes": "Awaiting implementer handoff"
}
```

### Agent activity record
```json
{
  "sessionKey": "agent:architect:subagent:423b220f-...",
  "runId": "423b220f-4a7b-415c-9b80-f1485e237dcd",
  "model": "openai-codex/gpt-5.3-codex",
  "runtimeSeconds": 1320,
  "status": "running",
  "lastSeen": "2026-02-20T00:05:10.000Z"
}
```

---

## 4) Data Ingestion

## Ingestion Strategy (MVP)
Run a lightweight server-side poll loop in Mission Control backend:
- On boot: initialize DB + perform immediate ingestion.
- Every `MC_POLL_MS` (default 15s): refresh workflow/agent snapshot source.
- Every `MC_DEPLOY_POLL_MS` (default 60s): refresh deploy status.

## OpenClaw Activity Source (Primary MVP path)
Because Mission Control service cannot directly call OpenClaw interactive tools, use **snapshot file ingestion**.

### Snapshot input file
- Path: `MC_SNAPSHOT_PATH`
- Expected producer: external collector (can be a tiny script run by operator/automation) writes normalized JSON.

### Required snapshot schema
```json
{
  "generatedAt": "2026-02-20T00:04:30.000Z",
  "workflows": [
    {
      "id": "wf-task-001",
      "title": "Mission Control MVP spec",
      "workflow": "mission-control-mvp",
      "status": "In Progress",
      "ownerAgent": "architect",
      "specPath": "/home/jpwolf00/.openclaw/workspace/home-hub/SPEC-mission-control-mvp.md",
      "createdAt": "2026-02-19T23:00:00.000Z",
      "updatedAt": "2026-02-20T00:04:00.000Z",
      "notes": "..."
    }
  ],
  "agents": [
    {
      "sessionKey": "agent:architect:subagent:...",
      "runId": "...",
      "model": "...",
      "runtimeSeconds": 1200,
      "status": "running",
      "lastSeen": "2026-02-20T00:04:20.000Z",
      "workflow": "mission-control-mvp",
      "currentTaskId": "wf-task-001"
    }
  ]
}
```

### Snapshot freshness rules
- If snapshot missing: keep last DB state and record warning event.
- If `now - generatedAt > MC_SNAPSHOT_MAX_AGE_MS` (default 2 min): mark data as stale and raise warning banner.

## Optional Coolify Deploy Status Source
Use Coolify API when token/url are configured:
- `GET {COOLIFY_BASE_URL}/api/v1/deployments`
- Header: `Authorization: Bearer {COOLIFY_TOKEN}`

Filter by `COOLIFY_APP_UUID` if set, else use latest deployment overall.
Normalize to: `success | failed | running | unknown` with timestamp.

If Coolify API unavailable:
- Return last cached deploy row from DB.
- Add `activity_events` warning (`source=coolify`).

## Error Handling
- Never crash request handlers from ingestion errors.
- Log and store errors in `activity_events`.
- `/api/health` must expose degraded status with reason(s):
  - `snapshot_missing`
  - `snapshot_stale`
  - `coolify_unreachable`
  - `db_error`
- On gateway/pairing-style failures upstream: preserve last known good state + surface non-blocking warning.

---

## 5) UI Spec

## Information Architecture
Single-page Mission Control dashboard (desktop-first):
1. Top bar
   - Title: `Mission Control`
   - Last refresh time
   - Health pill: `Healthy` / `Degraded`
2. Workflow board (primary)
   - Five status columns: Planned, In Progress, Review, Blocked, Done
   - Cards show title, workflow, ownerAgent, updated time, stalled badge
3. Agents panel (secondary)
   - Table/list of active/recent agents
   - Columns: Agent/session, status, runtime, lastSeen, workflow/task
4. Activity strip (bottom/right)
   - Latest deploy status + timestamp
   - Last 10 events (ingestion/deploy warnings/info)

## Example Screen Structure
```text
+--------------------------------------------------------------------------------+
| Mission Control                                 Last refresh 19:06:22  Healthy |
+--------------------------------------------------------------------------------+
| WORKFLOWS                                                                [5]   |
| Planned | In Progress | Review | Blocked | Done                                 |
|  card   | card       | card   | card    | card                                 |
+--------------------------------------------------------------------------------+
| ACTIVE AGENTS                                                                 |
| agent/session | status | runtime | last update | workflow/task                 |
+--------------------------------------------------------------------------------+
| ACTIVITY                                                                        |
| Deploy: SUCCESS @ 19:04:11  | Ingestion OK @ 19:06:15 | Snapshot stale warning |
+--------------------------------------------------------------------------------+
```

## States
- **Loading**: skeleton cards/rows + “Loading Mission Control data…”.
- **Empty**:
  - No workflows: “No tracked workflows yet.”
  - No agents: “No active agents detected.”
- **Error (hard)**: API unreachable; show retry hint.
- **Degraded (soft)**: stale/missing data warning banner but still render last-known data.

## Stalled Indicator
- Workflow or agent considered stalled if:
  - `now - updatedAt > MC_STALLED_MINUTES` for workflows
  - `now - lastSeen > MC_STALLED_MINUTES` for agents
- UI badge: `Stalled (>10m)` in amber/red.

---

## 6) API Contract (Mission Control Internal)

All endpoints return JSON and are read-only.

## `GET /api/workflows`
Returns grouped or flat workflows.

### Query params
- `status` (optional): one of status values
- `workflow` (optional): filter by workflow/project

### Response 200
```json
{
  "ok": true,
  "generatedAt": "2026-02-20T00:06:00.000Z",
  "stale": false,
  "items": [
    {
      "id": "wf-task-001",
      "title": "Mission Control MVP spec",
      "workflow": "mission-control-mvp",
      "status": "In Progress",
      "ownerAgent": "architect",
      "specPath": "/home/.../SPEC-mission-control-mvp.md",
      "createdAt": "2026-02-19T23:00:00.000Z",
      "updatedAt": "2026-02-20T00:04:00.000Z",
      "notes": "Awaiting implementer"
    }
  ]
}
```

## `GET /api/agents`
### Query params
- `status` (optional)
- `activeOnly=true|false` (default true, active = running/blocked)

### Response 200
```json
{
  "ok": true,
  "generatedAt": "2026-02-20T00:06:00.000Z",
  "stale": false,
  "items": [
    {
      "sessionKey": "agent:architect:subagent:...",
      "runId": "...",
      "model": "openai-codex/gpt-5.3-codex",
      "runtimeSeconds": 1320,
      "status": "running",
      "lastSeen": "2026-02-20T00:05:10.000Z",
      "workflow": "mission-control-mvp",
      "currentTaskId": "wf-task-001"
    }
  ]
}
```

## `GET /api/activity`
Returns latest deploy + recent events.

### Response 200
```json
{
  "ok": true,
  "latestDeploy": {
    "provider": "coolify",
    "appUuid": "noc0so844sksg8wsc0gc0w00",
    "status": "success",
    "updatedAt": "2026-02-20T00:03:20.000Z"
  },
  "events": [
    {
      "id": "evt-...",
      "type": "ingestion",
      "level": "warn",
      "source": "openclaw",
      "message": "Snapshot stale (>120000ms)",
      "createdAt": "2026-02-20T00:05:00.000Z"
    }
  ]
}
```

## `GET /api/health`
### Response 200 (healthy)
```json
{
  "ok": true,
  "status": "healthy",
  "checks": {
    "db": "ok",
    "snapshot": "ok",
    "coolify": "ok"
  },
  "timestamp": "2026-02-20T00:06:10.000Z"
}
```

### Response 200 (degraded)
```json
{
  "ok": true,
  "status": "degraded",
  "checks": {
    "db": "ok",
    "snapshot": "stale",
    "coolify": "unreachable"
  },
  "issues": ["snapshot_stale", "coolify_unreachable"],
  "timestamp": "2026-02-20T00:06:10.000Z"
}
```

---

## 7) Port and Run Config

## Mission Control app commands
From `/home/jpwolf00/.openclaw/workspace/home-hub/mission-control`:
```bash
npm install
npm run build
PORT=3001 npm run start -- -p 3001 -H 0.0.0.0
```

Recommended package scripts:
```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001 -H 0.0.0.0",
    "lint": "next lint"
  }
}
```

## Coolify steps (second app)
1. Create new Application in Coolify from same repo.
2. Set Base Directory = `mission-control`.
3. Build command: `npm ci && npm run build`.
4. Start command: `npm run start`.
5. Exposed port: `3001`.
6. Attach persistent volume to `/app/data/mission-control`.
7. Add env vars from section 1.
8. Healthcheck path: `/api/health`.
9. Deploy and verify generated URL.

## Healthcheck
- Endpoint: `GET /api/health`
- Pass condition: HTTP 200 and `status` in body is `healthy` or `degraded` (degraded should still keep service up).

---

## 8) Acceptance Criteria

1. Mission Control app is reachable on **port 3001**.
2. Home Hub dashboard remains reachable on **port 3000** with no behavior changes.
3. Mission Control shows:
   - workflows grouped by statuses (Planned/In Progress/Review/Blocked/Done),
   - active/recent agents with runtime + last update,
   - latest deploy status/timestamp strip.
4. Workflows/projects are distinguishable by `workflow` field and filterable.
5. Stalled indicator appears when no updates >10 minutes.
6. If snapshot/Coolify source is down, last known data remains visible and health is marked degraded (not blank crash screen).

---

## 9) Reviewer Test Plan

## A) Build & Static checks
- Home Hub existing app (port 3000 app):
  - `cd /home/jpwolf00/.openclaw/workspace/home-hub && npm run build`
- Mission Control app:
  - `cd /home/jpwolf00/.openclaw/workspace/home-hub/mission-control && npm run build`
- Record any TypeScript/lint errors.

## B) Local runtime validation
Run both apps concurrently:
1. Home Hub on 3000 (existing process/command)
2. Mission Control on 3001 (`npm run start`)

Verify:
- `curl -sS http://localhost:3000 | head`
- `curl -sS http://localhost:3001 | head`
- `curl -sS http://localhost:3001/api/health`
- `curl -sS http://localhost:3001/api/workflows`
- `curl -sS http://localhost:3001/api/agents`
- `curl -sS http://localhost:3001/api/activity`

## C) Data reliability checks
1. Provide sample snapshot JSON file and confirm ingestion updates DB.
2. Stop snapshot updates >10 min; confirm stalled badges + degraded health.
3. Remove/invalid Coolify token; confirm deploy section falls back gracefully and warning appears.

## D) Deploy validation (Coolify)
1. Deploy Home Hub app (existing) — ensure still healthy on 3000 URL.
2. Deploy Mission Control app — ensure healthy on new URL (port 3001 route target).
3. Hit both `/api/health` endpoints and confirm both live.

## E) Visual verification
- Open Mission Control URL in browser.
- Capture screenshot showing:
  - workflow board,
  - agents panel,
  - activity strip,
  - health state.
- Confirm no obvious layout breakage at standard desktop width.

Reviewer output must include pass/fail per section and screenshot artifact path.

---

## 10) Implementation Checklist (for Implementer)

1. Create new app directory: `home-hub/mission-control` (Next.js + TS).
2. Add API routes:
   - `src/app/api/workflows/route.ts`
   - `src/app/api/agents/route.ts`
   - `src/app/api/activity/route.ts`
   - `src/app/api/health/route.ts`
3. Add DB layer in `src/lib/db.ts` and initialize tables above.
4. Add ingestion services:
   - `src/lib/ingest/snapshot.ts`
   - `src/lib/ingest/coolify.ts`
   - `src/lib/ingest/scheduler.ts`
5. Build read-only UI page at `src/app/page.tsx` with sections defined in UI spec.
6. Add stalled logic utility `src/lib/stalled.ts`.
7. Add env parser/validation `src/lib/env.ts` with sane defaults.
8. Add lightweight seed/sample snapshot file for local testing:
   - `mission-control/data/sample-openclaw-snapshot.json`
9. Ensure run scripts bind to `0.0.0.0:3001`.
10. Document run/deploy in `home-hub/mission-control/README.md`.
11. Validate no changes required in existing `home-hub/src` runtime path unless explicitly needed.

---

## 11) Non-Goals / Guardrails
- No mutation APIs in v1.
- No direct tool execution from browser requests.
- No hard dependency on OpenClaw gateway availability at request time.
- Keep implementation tight: SQLite + polling + simple UI only.

This is the minimum shippable one-pass MVP for immediate visibility into multi-workflow/multi-agent state on a dedicated port 3001 service.
