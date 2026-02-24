import fs from 'node:fs';
import path from 'node:path';
import { env } from '@/lib/env';
import { insertEvent, upsertDeployStatus } from '@/lib/db';
import { runtimeState } from '@/lib/state';

function normalizeStatus(raw: string): 'success' | 'failed' | 'running' | 'unknown' {
  const v = (raw || '').toLowerCase();
  if (['success', 'completed', 'done', 'finished'].includes(v)) return 'success';
  if (['failed', 'error', 'cancelled', 'canceled'].includes(v)) return 'failed';
  if (['running', 'queued', 'pending', 'in_progress', 'building'].includes(v)) return 'running';
  return 'unknown';
}

function logWarn(message: string, metadata?: unknown) {
  insertEvent({
    id: crypto.randomUUID(),
    type: 'deploy',
    level: 'warn',
    source: 'coolify',
    message,
    metadataJson: metadata ? JSON.stringify(metadata) : null,
    createdAt: new Date().toISOString(),
  });
}

export async function ingestCoolify() {
  if (!env.coolifyBaseUrl || !env.coolifyToken) {
    runtimeState.checks.coolify = 'unknown';
    return;
  }

  try {
    const res = await fetch(`${env.coolifyBaseUrl.replace(/\/$/, '')}/api/v1/deployments`, {
      headers: { Authorization: `Bearer ${env.coolifyToken}` },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`coolify http ${res.status}`);
    const body = await res.json() as any[];
    let items = Array.isArray(body) ? body : [];
    if (env.coolifyAppUuid) {
      items = items.filter((x) => (x?.application_uuid || x?.appUuid) === env.coolifyAppUuid);
    }
    const latest = items[0] || {};
    const normalized = normalizeStatus(latest?.status || latest?.deployment_status || 'unknown');
    const updatedAt = latest?.updated_at || latest?.finished_at || latest?.created_at || new Date().toISOString();

    upsertDeployStatus({
      id: 'latest',
      provider: 'coolify',
      appUuid: latest?.application_uuid || env.coolifyAppUuid || null,
      status: normalized,
      startedAt: latest?.created_at ?? null,
      finishedAt: latest?.finished_at ?? null,
      updatedAt,
      rawJson: JSON.stringify(latest),
    });

    fs.mkdirSync(path.dirname(env.deployCachePath), { recursive: true });
    fs.writeFileSync(env.deployCachePath, JSON.stringify({ updatedAt, status: normalized, raw: latest }, null, 2));

    runtimeState.checks.coolify = 'ok';
    runtimeState.issues.delete('coolify_unreachable');
  } catch (error) {
    runtimeState.checks.coolify = 'unreachable';
    runtimeState.issues.add('coolify_unreachable');
    logWarn('Coolify unreachable; using last cached deploy status', { error: String(error) });
  }
}
