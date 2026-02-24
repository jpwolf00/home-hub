# SPEC — Model Usage Reporting Portal

## Document Control
- **Owner:** Jason / Marshal (audit requirements)
- **Implementing Team:** Hal (Architect → Implementer → Reviewer)
- **Status:** Draft for implementation
- **Priority:** High (capacity/rate-limit risk control)
- **Created:** 2026-02-19

---

## 1) Problem Statement
Jason needs reliable visibility into model consumption to prevent:
- account bans from excessive or abnormal usage,
- unexpected quota exhaustion,
- hidden capacity drain by specific agents/sessions,
- failure loops (rate-limit/retry storms) that waste calls.

Current state: usage is available in session JSONL logs but not normalized into an operational reporting portal.

---

## 2) Objectives
Build a reporting portal that provides:
1. **Global usage visibility** (requests + tokens in/out/cache by time range)
2. **Per-agent visibility** (which agent is using which models, with volume)
3. **Per-model/provider visibility** (load, errors, spikes)
4. **Forecasting + risk indicators** (burn rate and capacity risk)
5. **Actionable alerts** for excessive usage and anomalies

---

## 3) Non-Goals (Phase 1)
- Automated model switching/throttling (recommendations only)
- Full billing reconciliation against provider invoices
- Historical backfill beyond available logs (optional if cost-effective)

---

## 4) Data Sources (Authoritative)

### 4.1 Session Logs
Path pattern:
- `/mnt/hal-openclaw/agents/*/sessions/*.jsonl`

Parse entries including:
- `type: "message"`
- `timestamp`
- `message.role`
- `message.api`
- `message.provider`
- `message.model`
- `message.usage.input`
- `message.usage.output`
- `message.usage.cacheRead`
- `message.usage.cacheWrite`
- `message.usage.totalTokens`
- `message.stopReason`
- `message.errorMessage`

### 4.2 Agent/Model Configuration
- `/mnt/hal-openclaw/openclaw.json`

Used to map:
- default/primary models by agent,
- allowed fallback chains,
- provider definitions.

---

## 5) Functional Requirements

### FR-1: Global KPI Dashboard
Display for selectable ranges (Today, 24h, 7d, 30d, custom):
- Total requests
- Total input tokens
- Total output tokens
- Total cache read/write tokens (if present)
- Total tokens
- Error count and error rate

### FR-2: Agent Usage Breakdown
For each agent (main, architect, implementer, reviewer, ui-designer, etc):
- request count,
- input/output/total tokens,
- avg tokens/request,
- top models used,
- % usage by provider.

### FR-3: Model/Provider Breakdown
For each model/provider pair:
- requests,
- tokens in/out/total,
- error rate,
- p95 tokens/request,
- trend over time.

### FR-4: Session-Level Drilldown
Allow click-through from spike/metric to:
- contributing sessions,
- time windows,
- top messages by token volume,
- errors (`rate_limit`, `timeout`, `fetch failed`, etc.).

### FR-5: Forecasting (Capacity Risk)
Compute rolling forecasts using trailing baseline:
- 7-day avg daily token burn
- projected days-to-limit (when limit configured)
- risk tier: Green / Yellow / Red

### FR-6: Alerts Engine
Generate alerts based on threshold and anomaly rules (see section 8).

### FR-7: Reporting Output
Provide:
- portal UI (regular reporting portal),
- daily digest summary,
- critical incident notifications to Telegram.

---

## 6) Portal UX Requirements

### View A: Executive Summary
- Today’s totals (requests/tokens/errors)
- Top 5 models by token usage
- Current risk status (Green/Yellow/Red)
- Burn rate trend sparkline

### View B: Agent Breakdown
- Table + bar chart by agent
- Filters: time range, provider, model
- Sort by total tokens descending

### View C: Model/Provider Health
- Time-series for requests and errors
- Error-type distribution
- Fallback frequency indicator (if derivable)

### View D: Forensics
- Spike timeline with click-to-drill
- Session and message evidence
- Export to CSV/JSON

---

## 7) Data Model (Minimum)

### Table: usage_events
- id
- ts
- agent_id
- session_id
- provider
- model
- role
- input_tokens
- output_tokens
- cache_read_tokens
- cache_write_tokens
- total_tokens
- stop_reason
- error_message
- source_file
- source_offset

### Table: usage_rollups_hourly
- hour_bucket
- agent_id
- provider
- model
- request_count
- input_tokens
- output_tokens
- total_tokens
- error_count

### Table: alert_events
- id
- ts
- severity (warning/critical)
- rule_id
- title
- details_json
- status (open/acked/resolved)

---

## 8) Alert Rules (Initial Policy)

### Threshold Rules
1. **Provider Daily Token Threshold**
   - Warning at 70%
   - Critical at 90%
   - Requires configured daily limit per provider

2. **Per-Agent Daily Budget Exceeded**
   - Warning/critical thresholds configurable per agent

3. **Per-Session Runaway Usage**
   - Critical if session > X tokens in Y minutes (configurable)

### Anomaly Rules
4. **Usage Spike**
   - Warning if current hour > 2.0x rolling 7-day hour-of-day baseline

5. **Error Rate Spike**
   - Critical if model/provider error rate > 5% over rolling 15 min

6. **Retry/Failure Loop Detector**
   - Critical if repeated same error pattern N times in short window

---

## 9) Notification Policy
- **Critical alerts:** immediate Telegram notification
- **Warnings:** hourly digest aggregation
- **Daily summary:** fixed-time daily report with trend + top offenders + risk projection
- **Noise control:** deduplicate repeated alerts within cooldown window

---

## 10) Technical Architecture (MVP)

### Ingestion
- Incremental parser job reads only new JSONL lines (stateful offsets/checkpoints)
- Run every 5–10 minutes

### Storage
- SQLite acceptable for MVP
- Postgres preferred if multi-user/high-volume expected

### API
- Read APIs for dashboard/filtering/drilldown
- Alert API (list/acknowledge)

### Frontend
- Minimal dashboard UI (charts + tables)
- Time range selectors and filters
- Drilldown links to raw evidence

### Scheduler
- ETL refresh job
- Alert evaluation job (5 min)
- Daily digest job

---

## 11) Security & Access
- Portal access restricted to Jason/admin identities
- No secret tokens rendered in UI
- Store only required usage metadata; avoid sensitive prompt content in primary tables
- Raw log links should respect host permissions

---

## 12) Acceptance Criteria

1. Jason can open portal and see usage totals for last 24h/7d/30d.
2. Jason can identify top token-consuming **agents** and **models**.
3. Jason can inspect at least one usage spike and trace it to session evidence.
4. System sends a critical Telegram alert when configured threshold is breached.
5. Daily digest is generated with: totals, top offenders, and risk forecast.
6. Reviewer validates metrics against a sampled set of raw JSONL lines (accuracy check).

---

## 13) Implementation Plan (Hal Workflow)
1. **Architect:**
   - finalize schema,
   - define parser mapping,
   - define alert-rule config format,
   - produce implementation spec.

2. **Implementer:**
   - build parser + storage,
   - build APIs + dashboard,
   - add scheduled jobs + telegram notifier.

3. **Reviewer:**
   - test ingestion accuracy,
   - test alert triggering/dedup,
   - validate UI filtering/drilldown,
   - run end-to-end with synthetic spike scenarios.

---

## 14) Open Questions
1. What are hard quota limits per provider/account (daily/monthly)?
2. Should warnings go only to dashboard, or also Telegram digest?
3. Required retention period (30/90/365 days)?
4. Should token usage include tool messages or only assistant model calls?

---

## 15) Nice-to-Have (Phase 2)
- Budget policy simulator (if we switch model mix, what happens?)
- Automatic recommendations for cheaper/faster fallback paths
- Config change correlation timeline (model switch vs usage shift)
- Exportable weekly executive PDF
