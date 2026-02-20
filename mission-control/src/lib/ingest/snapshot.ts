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

// Track if we've already logged the missing snapshot warning to avoid spam
let warnedSnapshotMissing = false;

export function ingestSnapshot() {
  try {
    if (!fs.existsSync(env.snapshotPath)) {
      runtimeState.checks.snapshot = 'missing';
      
      // Only warn once per runtime to avoid spam
      if (!warnedSnapshotMissing) {
        evt('warn', 'openclaw', 'Snapshot missing; fallback ingestion active', { path: env.snapshotPath });
        warnedSnapshotMissing = true;
      }
      
      // Only add as warning, not as degrading issue
      // Remove any existing snapshot-related issues
      runtimeState.issues.delete('snapshot_missing');
      runtimeState.issues.delete('snapshot_stale');
      
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
    
    // Add snapshot as active source
    runtimeState.activeSources.add('snapshot');
    
    // Clear snapshot-related issues
    runtimeState.issues.delete('snapshot_missing');

    if (stale) {
      runtimeState.issues.delete('snapshot_stale');
      runtimeState.issues.add('snapshot_stale' as any);
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
