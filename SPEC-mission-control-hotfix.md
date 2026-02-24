# SPEC-mission-control-hotfix.md

## 1) Problem Statement
Mission Control (port 3001) is currently functionally “empty/broken” in production when `MC_SNAPSHOT_PATH` is absent. Current behavior sets `snapshot_missing` and leaves workflows/agents cards empty, causing degraded health despite core API runtime being otherwise operational.

## 2) Hotfix Goals (P0)
1. Remove hard dependency on file snapshot for MVP usability.
2. Ensure ingestion still produces useful data when snapshot file is missing by using fallback ingestion:
   - live polling sources that are available (Coolify now, OpenClaw optional), and/or
   - auto-seeded workflow/task records from `BACKLOG.md` or configured defaults.
3. Health should be `ok` (or non-degraded) when snapshot is missing but DB/API and at least one data source/fallback is functional.
4. UI cards must show meaningful content (not universal empty states).
5. Keep service strictly read-only; no destructive actions/mutations.
6. Keep existing 3000 dashboard codepath untouched.

## 3) Scope and Non-Goals
### In Scope
- Mission Control app only: `home-hub/mission-control/**`
- Snapshot-missing resilience
- Fallback data seeding and health model adjustments

### Out of Scope
- Any changes to `home-hub/src/**` (main dashboard on 3000)
- New write/mutation APIs
- Agent control actions (kill/restart/steer)

## 4) Design Summary
Implement **multi-source ingestion with graceful fallback**:

### Source precedence
1. **Snapshot file** (if present and valid) — existing path.
2. **Live providers** (currently Coolify deploy polling; optional OpenClaw polling adapter if env configured).
3. **Seed records** from `BACKLOG.md` and/or env-provided defaults when no primary task data exists.

### Key behavior changes
- Missing snapshot becomes **non-fatal** and **non-degrading by itself**.
- Health degrades only when **core function is impaired** (DB failure, API failure, all data sources unavailable with zero usable records).
- Seeded records are clearly tagged (`source: seed`) and read-only.

## 5) Concrete File-Level Changes

### A) `home-hub/mission-control/src/lib/state.ts`
- Replace snapshot-centric check model with source-aware checks:
  - `checks.snapshot: 'ok' | 'missing' | 'stale' | 'disabled'`
  - `checks.seed: 'unused' | 'ok' | 'failed'`
  - `checks.data: 'ok' | 'degraded'`
- Add derived booleans/metadata:
  - `activeSources: string[]` (e.g., `['snapshot']`, `['seed','coolify']`)
  - `hasUsableWorkflowData`, `hasUsableAgentData`
- Update `HealthIssue` semantics:
  - keep `snapshot_missing` as informational event only (not auto-added to degrading issues)
  - retain true degraders: `db_error`, `coolify_unreachable` (only if it is the sole live source), `no_data_sources`

### B) `home-hub/mission-control/src/lib/env.ts`
Add hotfix envs with safe defaults:
- `MC_ALLOW_SNAPSHOT_MISSING=true` (default true)
- `MC_ENABLE_BACKLOG_SEED=true` (default true)
- `MC_BACKLOG_PATH=/workspace/BACKLOG.md` (or resolved repo-root path)
- `MC_SEED_DEFAULTS_JSON` (optional JSON array of workflows/tasks)
- `MC_MIN_SEED_ITEMS=3`

No required env change for existing deployments; defaults make hotfix backward-compatible.

### C) `home-hub/mission-control/src/lib/ingest/snapshot.ts`
- Change missing-file branch:
  - do **not** add degrading issue solely for missing snapshot when `MC_ALLOW_SNAPSHOT_MISSING=true`.
  - emit warn event (`Snapshot missing; fallback ingestion active`) once per interval batch (or dedup).
- Preserve stale detection when snapshot exists.
- On successful snapshot ingestion, mark `activeSources` include `snapshot` and clear `snapshot_stale` issue.

### D) **New file** `home-hub/mission-control/src/lib/ingest/seed.ts`
Add fallback seed ingestion:
- `seedFromBacklog(backlogPath)` parser:
  - parse `### [ID] Title` blocks in `BACKLOG.md`
  - map backlog sections/status to Mission Control statuses:
    - `Ready for Design/Dev/Review` → `In Progress` or `Review`
    - `Done` → `Done`
    - unsorted/backlog → `Planned`
- create deterministic IDs (`seed-backlog-<ID>`)
- populate fields: `title`, `workflow='home-hub'`, `ownerAgent` inferred from section, timestamps from now if absent, `notes='Seeded from BACKLOG.md'`
- if parsing fails or file absent, fallback to `MC_SEED_DEFAULTS_JSON` static defaults.
- idempotent upsert only; never delete canonical rows.

### E) `home-hub/mission-control/src/lib/ingest/scheduler.ts`
- Adjust startup order:
  1. `initDb()`
  2. `ingestSnapshot()`
  3. `ingestCoolify()`
  4. `seedIfNeeded()` when workflows/agents are empty or snapshot missing
- Per poll cycle, run seed check after ingestion if data is still empty.
- Avoid aggressive event spam (simple dedupe window or last-message guard).

### F) `home-hub/mission-control/src/lib/db.ts`
- Add helper queries needed by seed/health:
  - `countWorkflows()`
  - `countAgents()`
- Optional metadata persistence for source attribution (minimal option):
  - add nullable `source TEXT` column to workflows/agents via `ALTER TABLE ...` guarded migration
  - if skipped for hotfix, keep source attribution in notes.

### G) `home-hub/mission-control/src/app/api/health/route.ts`
- Replace issue-count-only health with derived health policy:
  - `status='ok'` when DB check is `ok` and API responds and at least one usable data path exists (snapshot OR seed OR live cache).
  - `status='degraded'` when only partial data and no workflow/agent cards can be populated.
- Return richer response:
  - `checks`, `activeSources`, `dataCounts`, `issues` (degrading only), `warnings` (informational incl. snapshot missing)

### H) `home-hub/mission-control/src/app/page.tsx`
- Improve empty-state rendering hierarchy:
  - if seeded/live data exists, render cards normally
  - show small banner: `Snapshot unavailable — showing seeded/live data`
- Ensure cards are populated from seeded workflows (and at least one system/agent placeholder if no agents):
  - e.g., synthetic read-only agent row: `system:ingestion` status `running/idle` with last refresh timestamp.
- Keep all views read-only; no buttons for create/edit/delete actions.

### I) `home-hub/mission-control/src/app/api/workflows/route.ts` and `src/app/api/agents/route.ts`
- Include optional metadata in payload:
  - `dataSourceSummary`, `seeded: boolean` (per item if available)
- Keep endpoint shape backward-compatible (`items` unchanged).

### J) `home-hub/mission-control/README.md`
- Document new fallback behavior and env defaults.
- Clarify that `MC_SNAPSHOT_PATH` is optional for MVP usability.

## 6) Health Policy (Hotfix)
`/api/health` should evaluate:

- **ok**:
  - DB healthy, and
  - API serving, and
  - at least one of:
    - valid snapshot data, or
    - seeded workflow/task data present, or
    - live deploy/activity polling operational with non-empty activity.

- **degraded**:
  - DB ok but no usable records and all ingestion paths unavailable.

- **error/unhealthy (if ever introduced)**:
  - DB/init failures or unhandled runtime failures.

Important: `snapshot_missing` alone is a **warning**, not a degrading issue.

## 7) Read-Only Guardrails
- Do not add POST/PUT/PATCH/DELETE endpoints.
- Seeder/upsert may create non-destructive records only.
- Never delete existing workflow/agent data during fallback ingestion.
- No deploy trigger endpoints, no agent controls.

## 8) Backward Compatibility / Risk Control
- All changes isolated to `home-hub/mission-control` service.
- No import-path or runtime changes in main dashboard (`home-hub/src/**`).
- Env defaults preserve existing behavior when snapshot is available.

## 9) Acceptance Criteria
1. With `MC_SNAPSHOT_PATH` missing on deployed 3001 app, `/api/health` returns `status: "ok"` (or non-degraded by policy) if DB and fallback data are available.
2. Mission Control UI renders non-empty cards (workflows and activity at minimum; agents can be seeded/synthetic).
3. APIs return meaningful payloads without snapshot:
   - `/api/workflows` has >= `MC_MIN_SEED_ITEMS` when backlog/defaults exist.
   - `/api/activity` still shows deploy/ingestion events.
4. If snapshot appears later, ingestion uses it without restart and updates runtime source to include `snapshot`.
5. Service remains strictly read-only (no mutation routes).
6. Home Hub on 3000 remains unaffected (build + runtime unchanged).

## 10) Reviewer Test Plan (Deployed app on 3001)
Use deployed URLs:
- `MC_URL=<mission-control-3001-url>`
- `HUB_URL=<existing-3000-url>`

### A. Baseline deploy validation
1. `curl -sS "$MC_URL/api/health" | jq`
   - Expect `ok: true`
   - Expect `status` not hard-failed when snapshot missing.
2. `curl -sS "$MC_URL/api/workflows" | jq '.items | length'`
   - Expect non-zero count from seed/backlog fallback.
3. `curl -sS "$MC_URL/api/agents" | jq '.items | length'`
   - Expect non-zero OR documented synthetic/system row behavior.
4. `curl -sS "$MC_URL/api/activity" | jq`
   - Expect latest deploy/event objects.

### B. Snapshot-missing scenario
1. Temporarily set invalid/nonexistent `MC_SNAPSHOT_PATH` in Mission Control service env.
2. Redeploy on 3001.
3. Re-run API checks:
   - health remains `ok` or non-degraded when fallback works
   - response includes warning about snapshot missing
   - workflow cards remain populated.

### C. Snapshot recovery scenario
1. Restore valid snapshot file path.
2. Wait one poll interval (`MC_POLL_MS`).
3. Verify `/api/health` shows snapshot check `ok` and active sources include snapshot.

### D. Read-only verification
1. Attempt mutation calls (expect 404/405):
   - `POST $MC_URL/api/workflows`
   - `DELETE $MC_URL/api/agents/anything`
2. Confirm no destructive actions exposed in UI.

### E. Regression check for dashboard on 3000
1. `curl -sS "$HUB_URL" | head`
2. Spot-check existing dashboard API endpoint(s) on 3000.
3. Confirm no behavior change and no new errors in logs.

### F. Visual verification
- Capture screenshot of 3001 Mission Control showing:
  - health pill not hard-error,
  - populated workflow cards,
  - activity section with real entries,
  - snapshot warning banner if missing.

## 11) Definition of Done
- Implemented file changes above.
- Deployed Mission Control hotfix on port 3001.
- Reviewer confirms acceptance criteria and regression checks.
- No changes required for 3000 dashboard deployment.
