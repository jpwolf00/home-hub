import path from 'node:path';

const cwd = process.cwd();

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: num('PORT', 3001),
  missionControlPort: num('MISSION_CONTROL_PORT', 3001),
  dataDir: process.env.MC_DATA_DIR ?? path.join(cwd, 'data', 'mission-control'),
  dbPath: process.env.MC_DB_PATH ?? path.join(cwd, 'data', 'mission-control', 'mission-control.db'),
  snapshotPath: process.env.MC_SNAPSHOT_PATH ?? path.join(cwd, 'data', 'mission-control', 'snapshots', 'openclaw-snapshot.json'),
  deployCachePath: process.env.MC_DEPLOY_CACHE_PATH ?? path.join(cwd, 'data', 'mission-control', 'cache', 'deploy-status.json'),
  pollMs: num('MC_POLL_MS', 15000),
  stalledMinutes: num('MC_STALLED_MINUTES', 10),
  deployPollMs: num('MC_DEPLOY_POLL_MS', 60000),
  snapshotMaxAgeMs: num('MC_SNAPSHOT_MAX_AGE_MS', 120000),
  coolifyBaseUrl: process.env.COOLIFY_BASE_URL,
  coolifyToken: process.env.COOLIFY_TOKEN,
  coolifyAppUuid: process.env.COOLIFY_APP_UUID,
};

export type HealthIssue = 'db_error' | 'coolify_unreachable' | 'no_data_sources';

export type DataSource = 'snapshot' | 'seed' | 'coolify';

export const runtimeState: {
  generatedAt: string | null;
  stale: boolean;
  issues: Set<HealthIssue>;
  warnings: Set<string>;
  checks: { 
    db: 'ok' | 'error'; 
    snapshot: 'ok' | 'missing' | 'stale' | 'disabled'; 
    coolify: 'ok' | 'unreachable' | 'unknown';
    seed: 'unused' | 'ok' | 'failed';
  };
  activeSources: Set<DataSource>;
  dataCounts: { workflows: number; agents: number; events: number };
  lastRefreshAt: string | null;
} = {
  generatedAt: null,
  stale: false,
  issues: new Set<HealthIssue>(),
  warnings: new Set<string>(),
  checks: { db: 'ok', snapshot: 'missing', coolify: 'unknown', seed: 'unused' },
  activeSources: new Set<DataSource>(),
  dataCounts: { workflows: 0, agents: 0, events: 0 },
  lastRefreshAt: null,
};

export function updateDataCounts(workflows: number, agents: number, events: number) {
  runtimeState.dataCounts = { workflows, agents, events };
}

export function hasUsableData(): boolean {
  return (
    runtimeState.dataCounts.workflows > 0 ||
    runtimeState.dataCounts.agents > 0 ||
    runtimeState.activeSources.has('coolify')
  );
}

export function isHealthy(): boolean {
  if (runtimeState.checks.db === 'error') return false;
  if (runtimeState.issues.has('no_data_sources') && !hasUsableData()) return false;
  return true;
}
