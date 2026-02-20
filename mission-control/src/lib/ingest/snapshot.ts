import fs from 'node:fs';
import { env } from '@/lib/env';
import { runtimeState } from '@/lib/state';
import { insertEvent, upsertAgent, upsertWorkflow } from '@/lib/db';
import type { Agent, Workflow } from '@/lib/types';

function evt(level: 'info' | 'warn' | 'error', source: string, message: string, metadata?: unknown) {
  insertEvent({
    id: crypto.randomUUID(),
    type: 'ingestion',
    level,
    source,
    message,
    metadataJson: metadata ? JSON.stringify(metadata) : null,
    createdAt: new Date().toISOString(),
  });
}

const DEFAULT_WORKFLOWS: Workflow[] = [
  { id: 'seed-mc', title: 'Mission Control MVP', workflow: 'home-hub', status: 'In Progress', ownerAgent: 'system', specPath: null, notes: 'Seeded default', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'seed-dashboard', title: 'Home Hub Dashboard', workflow: 'home-hub', status: 'In Progress', ownerAgent: 'system', specPath: null, notes: 'Seeded default', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const SYNTHETIC_AGENT: Agent = {
  sessionKey: 'system:ingestion', runId: null, model: null, runtimeSeconds: 0,
  status: 'running', lastSeen: new Date().toISOString(), workflow: 'home-hub', currentTaskId: 'mission-control', updatedAt: new Date().toISOString()
};

let warnedSnapshotMissing = false;
let seeded = false;

export function ingestSnapshot() {
  try {
    if (!fs.existsSync(env.snapshotPath)) {
      runtimeState.checks.snapshot = 'missing';
      
      if (!warnedSnapshotMissing) {
        evt('warn', 'openclaw', 'Snapshot missing; fallback seeding active', { path: env.snapshotPath });
        warnedSnapshotMissing = true;
      }
      
      // Seed defaults if not already done
      if (!seeded) {
        for (const wf of DEFAULT_WORKFLOWS) upsertWorkflow(wf);
        upsertAgent(SYNTHETIC_AGENT);
        runtimeState.activeSources.add('seed');
        seeded = true;
        evt('info', 'seed', 'Seeded default workflows and synthetic agent');
      }
      
      return;
    }

    const parsed = JSON.parse(fs.readFileSync(env.snapshotPath, 'utf8')) as {
      generatedAt: string;
      workflows: Workflow[];
      agents: Agent[];
    };

    for (const item of parsed.workflows ?? []) upsertWorkflow(item);
    for (const item of parsed.agents ?? []) upsertAgent({ ...item, updatedAt: item.lastSeen ?? new Date().toISOString() });

    runtimeState.generatedAt = parsed.generatedAt;
    runtimeState.lastRefreshAt = new Date().toISOString();

    const generatedTime = new Date(parsed.generatedAt).getTime();
    const stale = !Number.isFinite(generatedTime) || Date.now() - generatedTime > env.snapshotMaxAgeMs;
    runtimeState.stale = stale;
    runtimeState.checks.snapshot = stale ? 'stale' : 'ok';
    runtimeState.activeSources.add('snapshot');

    if (stale) {
      evt('warn', 'openclaw', `Snapshot stale (>${env.snapshotMaxAgeMs}ms)`, { generatedAt: parsed.generatedAt });
    } else {
      evt('info', 'openclaw', 'Snapshot ingestion ok');
    }
  } catch (error) {
    runtimeState.issues.add('db_error');
    runtimeState.checks.db = 'error';
    evt('error', 'system', 'Snapshot ingestion failed', { error: String(error) });
  }
}
