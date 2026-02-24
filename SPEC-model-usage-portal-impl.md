# Implementation Spec: Model Usage Portal

**Based on:** `SPEC-model-usage-portal.md`  
**Output:** `SPEC-model-usage-portal-impl.md`  
**Date:** 2026-02-20

---

## 1. Overview

This spec defines implementation for an MVP Model Usage Portal that integrates into the existing Home Hub dashboard (port 3000). The portal provides usage visibility, per-agent/model breakdown, forecasting, and alerts.

**Key Assumption:** The session logs are expected at `/mnt/hal-openclaw/agents/*/sessions/*.jsonl` but that path is currently not mounted. Implementation assumes this path will be available, with fallback to local sample data for development.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Home Hub (Next.js)                       │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │ Mission Control │  │ Model Usage Portal (/usage)    │  │
│  │    (existing)   │  │                                 │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Routes (Next.js)                       │
│  GET /api/usage/global        - KPIs for time range         │
│  GET /api/usage/agents        - Per-agent breakdown          │
│  GET /api/usage/models        - Per-model breakdown          │
│  GET /api/usage/sessions      - Session drilldown           │
│  GET /api/usage/alerts        - List/acknowledge alerts     │
│  GET /api/usage/forecast      - Risk forecasting            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer (SQLite)                        │
│  - usage_events (raw API calls)                             │
│  - usage_rollups_hourly (aggregated)                         │
│  - alert_events (alerts)                                     │
│  - parser_state (checkpoint offsets)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Ingestion: JSONL Parser Job                     │
│  Path: /mnt/hal-openclaw/agents/*/sessions/*.jsonl          │
│  Runs: Every 5 minutes (cron-like)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 New Tables (add to existing mission-control.db)

```sql
-- Raw usage events (one row per API call)
CREATE TABLE IF NOT EXISTS usage_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  provider TEXT,
  model TEXT NOT NULL,
  role TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cache_read_tokens INTEGER DEFAULT 0,
  cache_write_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  stop_reason TEXT,
  error_message TEXT,
  source_file TEXT,
  source_offset INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Hourly rollups for fast dashboard queries
CREATE TABLE IF NOT EXISTS usage_rollups_hourly (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hour_bucket TEXT NOT NULL,  -- ISO hour: "2026-02-20T14:00"
  agent_id TEXT NOT NULL,
  provider TEXT,
  model TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(hour_bucket, agent_id, model)
);

-- Alert events
CREATE TABLE IF NOT EXISTS alert_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('warning','critical')),
  rule_id TEXT NOT NULL,
  title TEXT NOT NULL,
  details_json TEXT,
  status TEXT DEFAULT 'open' CHECK(status IN ('open','acked','resolved')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Parser checkpoint state
CREATE TABLE IF NOT EXISTS parser_state (
  source_file TEXT PRIMARY KEY,
  last_offset INTEGER DEFAULT 0,
  last_ts TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Alert threshold configuration
CREATE TABLE IF NOT EXISTS alert_config (
  rule_id TEXT PRIMARY KEY,
  config_json TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### 3.2 Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_usage_ts ON usage_events(ts);
CREATE INDEX IF NOT EXISTS idx_usage_agent ON usage_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_usage_model ON usage_events(model);
CREATE INDEX IF NOT EXISTS idx_rollups_hour ON usage_rollups_hourly(hour_bucket);
CREATE INDEX IF NOT EXISTS idx_alert_status ON alert_events(status);
```

---

## 4. File Changes

### 4.1 New Files to Create

| File | Purpose |
|------|---------|
| `mission-control/src/lib/usage-db.ts` | Database init + queries for usage data |
| `mission-control/src/lib/usage-parser.ts` | JSONL parser for session logs |
| `mission-control/src/lib/usage-forecast.ts` | Forecasting + risk calculation |
| `mission-control/src/lib/usage-alerts.ts` | Alert evaluation engine |
| `mission-control/src/app/api/usage/global/route.ts` | Global KPIs endpoint |
| `mission-control/src/app/api/usage/agents/route.ts` | Agent breakdown endpoint |
| `mission-control/src/app/api/usage/models/route.ts` | Model breakdown endpoint |
| `mission-control/src/app/api/usage/sessions/route.ts` | Session drilldown endpoint |
| `mission-control/src/app/api/usage/alerts/route.ts` | Alerts endpoint |
| `mission-control/src/app/api/usage/forecast/route.ts` | Forecast endpoint |
| `mission-control/src/app/api/usage/refresh/route.ts` | Trigger parser manually |
| `mission-control/src/app/usage/page.tsx` | Portal UI page |
| `mission-control/src/components/usage/*` | Chart + table components |

### 4.2 Files to Modify

| File | Changes |
|------|---------|
| `mission-control/src/lib/db.ts` | Add init call for new tables |
| `mission-control/src/lib/env.ts` | Add config for log path, thresholds |
| `mission-control/src/app/layout.tsx` | Add nav link to /usage |
| `mission-control/package.json` | Add recharts (or similar) for charts |

---

## 5. API Endpoints

### 5.1 GET /api/usage/global

**Query Params:** `range=24h|7d|30d|custom&start=ISO&end=ISO`

**Response:**
```json
{
  "range": { "start": "2026-02-19T09:00:00Z", "end": "2026-02-20T09:00:00Z" },
  "totals": {
    "requests": 1542,
    "inputTokens": 4852000,
    "outputTokens": 892000,
    "cacheReadTokens": 120000,
    "cacheWriteTokens": 45000,
    "totalTokens": 5889000,
    "errors": 23
  },
  "errorRate": 0.0149,
  "byProvider": [
    { "provider": "openai", "requests": 1200, "totalTokens": 4500000 },
    { "provider": "anthropic", "requests": 342, "totalTokens": 1389000 }
  ]
}
```

### 5.2 GET /api/usage/agents

**Query Params:** `range=24h|7d|30d`

**Response:**
```json
{
  "agents": [
    {
      "agentId": "agent:main:main",
      "requests": 450,
      "inputTokens": 1200000,
      "outputTokens": 340000,
      "totalTokens": 1540000,
      "avgTokensPerRequest": 3422,
      "topModels": ["gpt-4.5", "o3-mini"],
      "providers": { "openai": 0.7, "anthropic": 0.3 }
    }
  ]
}
```

### 5.3 GET /api/usage/models

**Query Params:** `range=24h|7d|30d`

**Response:**
```json
{
  "models": [
    {
      "model": "gpt-4.5",
      "provider": "openai",
      "requests": 890,
      "inputTokens": 2400000,
      "outputTokens": 560000,
      "totalTokens": 2960000,
      "errorRate": 0.012,
      "p95TokensPerRequest": 4500
    }
  ]
}
```

### 5.4 GET /api/usage/sessions

**Query Params:** `range=24h|7d|30d&sort= tokens|requests|errors&limit=20`

**Response:**
```json
{
  "sessions": [
    {
      "sessionId": "agent:architect:subagent:xyz",
      "agentId": "agent:architect",
      "requests": 45,
      "totalTokens": 125000,
      "errors": 2,
      "lastActivity": "2026-02-20T08:45:00Z"
    }
  ]
}
```

### 5.5 GET /api/usage/alerts

**Query Params:** `status=open|acked|resolved&limit=50`

**Response:**
```json
{
  "alerts": [
    {
      "id": 1,
      "ts": "2026-02-20T08:00:00Z",
      "severity": "critical",
      "ruleId": "provider_daily_limit",
      "title": "OpenAI daily limit at 92%",
      "details": { "provider": "openai", "used": 920000, "limit": 1000000 },
      "status": "open"
    }
  ]
}
```

### 5.6 POST /api/usage/alerts

**Body:** `{ "alertId": 1, "action": "ack|resolve" }`

### 5.7 GET /api/usage/forecast

**Response:**
```json
{
  "forecast": {
    "dailyBurnRate": 2850000,
    "sevenDayAvg": 2700000,
    "projectedMonthly": 85500000,
    "riskTier": "yellow",
    "riskFactors": ["OpenAI usage trending up", "gpt-4.5 requests +15%"]
  },
  "providerLimits": [
    { "provider": "openai", "dailyLimit": 10000000, "used": 4200000, "pct": 0.42, "projectedDays": 12 }
  ]
}
```

### 5.8 POST /api/usage/refresh

Triggers manual parse of new log lines. Returns count of new events.

---

## 6. Parser Logic

### 6.1 JSONL Entry Format (expected)

```json
{
  "type": "message",
  "timestamp": "2026-02-20T08:15:32.123Z",
  "session": "agent:main:main",
  "message": {
    "role": "assistant",
    "api": "chat.completions",
    "provider": "openai",
    "model": "gpt-4.5",
    "usage": {
      "inputTokens": 4500,
      "outputTokens": 1200,
      "cacheReadTokens": 200,
      "cacheWriteTokens": 50,
      "totalTokens": 5950
    },
    "stopReason": "stop",
    "errorMessage": null
  }
}
```

### 6.2 Parser Flow

1. Scan `/mnt/hal-openclaw/agents/*/sessions/*.jsonl`
2. For each file, read from last known offset (from `parser_state`)
3. Parse each line as JSON, extract fields per schema
4. Insert into `usage_events` table
5. Update hourly rollups (upsert into `usage_rollups_hourly`)
6. Update checkpoint offset in `parser_state`
7. On error: log and continue, don't break parser

### 6.3 Error Handling

- Skip malformed lines (log count of skips)
- Handle missing fields gracefully (default to 0/null)
- If source file missing: log warning, continue with empty state

---

## 7. Alert Rules (MVP)

### 7.1 Threshold Rules

| Rule ID | Condition | Warning | Critical |
|---------|-----------|---------|----------|
| `provider_daily_limit` | Provider usage % | 70% | 90% |
| `agent_daily_budget` | Agent tokens/day | Config per agent | Config × 1.5 |

### 7.2 Anomaly Rules

| Rule ID | Condition | Severity |
|---------|-----------|----------|
| `usage_spike` | Current hour > 2× 7-day hour avg | warning |
| `error_rate_spike` | Error rate > 5% over 15 min | critical |

### 7.3 Default Config

```json
{
  "provider_daily_limit": { "openai": 10000000, "anthropic": 5000000 },
  "agent_daily_budget": { "default": 1000000 },
  "spike_multiplier": 2.0,
  "error_rate_threshold": 0.05
}
```

---

## 8. UI Components

### 8.1 Page: /usage

**Layout:**
- Header: "Model Usage" + time range selector (Today | 24h | 7d | 30d)
- Row 1: KPI cards (Requests, Input Tokens, Output Tokens, Errors, Error Rate)
- Row 2: Risk status pill + burn rate sparkline
- Row 3: Two columns
  - Left: Agent breakdown table + bar chart
  - Right: Model breakdown table + pie chart
- Row 4: Alerts panel (collapsible, shows open alerts)
- Row 5: Session drilldown table (optional expand)

### 8.2 Components

| Component | Description |
|-----------|-------------|
| `KPICard` | Single metric with label + value + trend |
| `TimeRangeSelector` | Dropdown: Today, 24h, 7d, 30d, Custom |
| `AgentTable` | Sortable table with agent, requests, tokens, avg |
| `ModelTable` | Sortable table with model, provider, tokens, errors |
| `RiskIndicator` | Pill: Green/Yellow/Red + reason text |
| `AlertList` | List of alerts with severity color, ack button |
| `BurnRateChart` | Sparkline or small line chart |

---

## 9. Acceptance Criteria

### AC-1: Global Dashboard
- [ ] User can view total requests, tokens (in/out/total), errors for selected range
- [ ] Time range selector changes data correctly (24h, 7d, 30d)
- [ ] Error rate displays as percentage

### AC-2: Agent Breakdown
- [ ] Table shows each agent with request count, token totals, avg tokens/request
- [ ] Top 3 models per agent displayed
- [ ] Sortable by any column

### AC-3: Model Breakdown
- [ ] Table shows each model with request count, tokens, error rate
- [ ] Provider column included
- [ ] p95 tokens per request calculated

### AC-4: Forecasting
- [ ] Daily burn rate displayed
- [ ] Risk tier (Green/Yellow/Red) based on threshold config
- [ ] Projected days-to-limit shown

### AC-5: Alerts
- [ ] Open alerts visible in portal
- [ ] Alert can be acknowledged
- [ ] Critical alerts highlighted in red

### AC-6: Integration
- [ ] Portal accessible at /usage route
- [ ] Navigation link from main dashboard
- [ ] Consistent styling with existing Mission Control

### AC-7: Data Accuracy
- [ ] Parser correctly reads JSONL entries
- [ ] Aggregations match raw event sums (spot check)
- [ ] Handles missing/null fields gracefully

---

## 10. Reviewer Test Plan

### 10.1 Build Verification
```bash
cd /home/jpwolf00/.openclaw/workspace/home-hub/mission-control
npm run build
# Expected: No errors, no TypeScript warnings
```

### 10.2 Unit Tests (if applicable)
- Parser correctly extracts fields from valid JSONL
- Parser handles malformed lines without crashing
- Database queries return expected shape
- Alert rules trigger at correct thresholds

### 10.3 Integration Tests
- `GET /api/usage/global?range=24h` returns JSON with expected fields
- `GET /api/usage/agents` returns agent array
- `GET /api/usage/alerts` returns alert list
- Manual `/api/usage/refresh` parses new events

### 10.4 Visual Verification
- Navigate to `/usage` in browser
- Verify KPI cards render with data
- Verify tables are sortable
- Verify time range selector works
- Verify risk indicator displays correctly
- Verify alert list shows with correct severity colors

### 10.5 End-to-End
1. Deploy to Coolify staging
2. Trigger parser on sample data
3. Verify dashboard shows metrics
4. Inject test alert (via config or manual insert)
5. Verify alert appears in UI
6. Acknowledge alert, verify status changes

---

## 11. Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `better-sqlite3` | Database (already in use) | ^11.x |
| `recharts` | Charts | ^2.x |
| `date-fns` | Date manipulation | ^4.x |

---

## 12. Open Questions (for implementation)

1. **Log Path:** Confirm `/mnt/hal-openclaw/agents/*/sessions/*.jsonl` is correct path or provide alternate
2. **Provider Limits:** What are the actual daily token limits per provider?
3. **Alert Channels:** Besides dashboard, should critical alerts go to Telegram? (Spec says yes)
4. **Retention:** How long to keep raw events vs. only rollups?

---

## 13. Implementation Notes

- Use existing mission-control.db (co-located with workflows/agents tables)
- Parser should be idempotent (handle restarts gracefully)
- Keep UI simple for MVP — avoid complex interactivity
- Focus on data accuracy over fancy visualizations
