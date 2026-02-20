import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from './env';
import type { Agent, ActivityEvent, Workflow } from './types';

function ensureDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

ensureDir(env.dbPath);
const db = new Database(env.dbPath);
db.pragma('journal_mode = WAL');

export { db };

export function initDb() {
  db.exec(`
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

    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      level TEXT NOT NULL,
      source TEXT NOT NULL,
      message TEXT NOT NULL,
      metadataJson TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deploy_status (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      appUuid TEXT,
      status TEXT NOT NULL,
      startedAt TEXT,
      finishedAt TEXT,
      updatedAt TEXT NOT NULL,
      rawJson TEXT
    );
  `);
}

export function upsertWorkflow(item: Workflow) {
  db.prepare(`
    INSERT INTO workflows (id, title, workflow, status, ownerAgent, specPath, notes, createdAt, updatedAt)
    VALUES (@id, @title, @workflow, @status, @ownerAgent, @specPath, @notes, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,
      workflow=excluded.workflow,
      status=excluded.status,
      ownerAgent=excluded.ownerAgent,
      specPath=excluded.specPath,
      notes=excluded.notes,
      updatedAt=excluded.updatedAt
  `).run(item);
}

export function upsertAgent(item: Agent) {
  db.prepare(`
    INSERT INTO agents (sessionKey, runId, model, runtimeSeconds, status, lastSeen, workflow, currentTaskId, updatedAt)
    VALUES (@sessionKey, @runId, @model, @runtimeSeconds, @status, @lastSeen, @workflow, @currentTaskId, @updatedAt)
    ON CONFLICT(sessionKey) DO UPDATE SET
      runId=excluded.runId,
      model=excluded.model,
      runtimeSeconds=excluded.runtimeSeconds,
      status=excluded.status,
      lastSeen=excluded.lastSeen,
      workflow=excluded.workflow,
      currentTaskId=excluded.currentTaskId,
      updatedAt=excluded.updatedAt
  `).run(item);
}

export function insertEvent(item: ActivityEvent) {
  db.prepare(`
    INSERT INTO activity_events (id, type, level, source, message, metadataJson, createdAt)
    VALUES (@id, @type, @level, @source, @message, @metadataJson, @createdAt)
  `).run(item);
}

export function upsertDeployStatus(payload: {
  id: string; provider: string; appUuid: string | null; status: string; startedAt: string | null; finishedAt: string | null; updatedAt: string; rawJson: string;
}) {
  db.prepare(`
    INSERT INTO deploy_status (id, provider, appUuid, status, startedAt, finishedAt, updatedAt, rawJson)
    VALUES (@id, @provider, @appUuid, @status, @startedAt, @finishedAt, @updatedAt, @rawJson)
    ON CONFLICT(id) DO UPDATE SET
      provider=excluded.provider,
      appUuid=excluded.appUuid,
      status=excluded.status,
      startedAt=excluded.startedAt,
      finishedAt=excluded.finishedAt,
      updatedAt=excluded.updatedAt,
      rawJson=excluded.rawJson
  `).run(payload);
}

export function queryWorkflows(status?: string, workflow?: string): Workflow[] {
  let sql = 'SELECT * FROM workflows';
  const where: string[] = [];
  const params: Record<string, string> = {};
  if (status) { where.push('status = @status'); params.status = status; }
  if (workflow) { where.push('workflow = @workflow'); params.workflow = workflow; }
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ' ORDER BY updatedAt DESC';
  return db.prepare(sql).all(params) as Workflow[];
}

export function queryAgents(status?: string, activeOnly = true): Agent[] {
  let sql = 'SELECT * FROM agents';
  const where: string[] = [];
  const params: Record<string, string> = {};
  if (activeOnly) where.push("status IN ('running','blocked')");
  if (status) { where.push('status = @status'); params.status = status; }
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ' ORDER BY lastSeen DESC';
  return db.prepare(sql).all(params) as Agent[];
}

export function queryEvents(limit = 10): ActivityEvent[] {
  return db.prepare('SELECT * FROM activity_events ORDER BY createdAt DESC LIMIT ?').all(limit) as ActivityEvent[];
}

export function countWorkflows(): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM workflows').get() as { count: number };
  return result.count;
}

export function countAgents(): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };
  return result.count;
}

export function latestDeploy(): any {
  return db.prepare('SELECT * FROM deploy_status ORDER BY updatedAt DESC LIMIT 1').get();
}

// ===== USAGE TABLES =====

export function initUsageDb() {
  db.exec(`
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

    CREATE TABLE IF NOT EXISTS usage_rollups_hourly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hour_bucket TEXT NOT NULL,
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

    CREATE TABLE IF NOT EXISTS parser_state (
      source_file TEXT PRIMARY KEY,
      last_offset INTEGER DEFAULT 0,
      last_ts TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alert_config (
      rule_id TEXT PRIMARY KEY,
      config_json TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_usage_ts ON usage_events(ts);
    CREATE INDEX IF NOT EXISTS idx_usage_agent ON usage_events(agent_id);
    CREATE INDEX IF NOT EXISTS idx_usage_model ON usage_events(model);
    CREATE INDEX IF NOT EXISTS idx_rollups_hour ON usage_rollups_hourly(hour_bucket);
    CREATE INDEX IF NOT EXISTS idx_alert_status ON alert_events(status);
  `);

  // Insert default alert config if not exists
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM alert_config').get() as { cnt: number };
  if (existing.cnt === 0) {
    db.prepare(`INSERT INTO alert_config (rule_id, config_json, enabled) VALUES (?, ?, 1)`).run(
      'provider_daily_limit',
      JSON.stringify({ openai: 10000000, anthropic: 5000000, nanogpt: 50000000 })
    );
    db.prepare(`INSERT INTO alert_config (rule_id, config_json, enabled) VALUES (?, ?, 1)`).run(
      'spike_multiplier',
      JSON.stringify({ value: 2.0 })
    );
    db.prepare(`INSERT INTO alert_config (rule_id, config_json, enabled) VALUES (?, ?, 1)`).run(
      'error_rate_threshold',
      JSON.stringify({ value: 0.05 })
    );
  }
}
