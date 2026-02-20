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

export function latestDeploy(): any {
  return db.prepare('SELECT * FROM deploy_status ORDER BY updatedAt DESC LIMIT 1').get();
}
