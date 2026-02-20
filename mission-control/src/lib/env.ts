import path from 'node:path';

const cwd = process.cwd();

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw.toLowerCase() === 'true' || raw === '1';
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
  // Hotfix: fallback behavior
  allowSnapshotMissing: bool('MC_ALLOW_SNAPSHOT_MISSING', true),
  enableBacklogSeed: bool('MC_ENABLE_BACKLOG_SEED', true),
  backlogPath: process.env.MC_BACKLOG_PATH ?? path.join(cwd, '..', 'BACKLOG.md'),
  seedDefaultsJson: process.env.MC_SEED_DEFAULTS_JSON,
  minSeedItems: num('MC_MIN_SEED_ITEMS', 3),
};
