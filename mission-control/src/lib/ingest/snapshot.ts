import fs from 'node:fs';
import { insertEvent, upsertAgent, upsertWorkflow } from '@/lib/db';
import { env } from '@/lib/env';
import { runtimeState } from '@/lib/state';
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

export function ingestSnapshot() {
  try {
    if (!fs.existsSync(env.snapshotPath)) {
      runtimeState.checks.snapshot = 'missing';
      runtimeState.issues.add('snapshot_missing');
      evt('warn', 'openclaw', 'Snapshot missing', { path: env.snapshotPath });
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
    runtimeState.issues.delete('snapshot_missing');

    if (stale) {
      runtimeState.issues.add('snapshot_stale');
      evt('warn', 'openclaw', `Snapshot stale (>${env.snapshotMaxAgeMs}ms)`, { generatedAt: parsed.generatedAt });
    } else {
      runtimeState.issues.delete('snapshot_stale');
      evt('info', 'openclaw', 'Snapshot ingestion ok');
    }
  } catch (error) {
    runtimeState.issues.add('db_error');
    runtimeState.checks.db = 'error';
    evt('error', 'system', 'Snapshot ingestion failed', { error: String(error) });
  }
}
