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

export type HealthIssue = 'db_error' | 'coolify_unreachable';

export type DataSource = 'snapshot' | 'seed' | 'coolify';

export const runtimeState: {
  generatedAt: string | null;
  stale: boolean;
  issues: Set<HealthIssue>;
  checks: { db: 'ok' | 'error'; snapshot: 'ok' | 'missing' | 'stale'; coolify: 'ok' | 'unreachable' | 'unknown' };
  activeSources: Set<DataSource>;
  lastRefreshAt: string | null;
} = {
  generatedAt: null,
  stale: false,
  issues: new Set<HealthIssue>(),
  checks: { db: 'ok', snapshot: 'missing', coolify: 'unknown' },
  activeSources: new Set<DataSource>(),
  lastRefreshAt: null,
};
