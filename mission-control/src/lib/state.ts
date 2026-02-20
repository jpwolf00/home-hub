export type HealthIssue = 'snapshot_missing' | 'snapshot_stale' | 'coolify_unreachable' | 'db_error';

export const runtimeState: {
  generatedAt: string | null;
  stale: boolean;
  issues: Set<HealthIssue>;
  checks: { db: 'ok' | 'error'; snapshot: 'ok' | 'missing' | 'stale'; coolify: 'ok' | 'unreachable' | 'unknown' };
  lastRefreshAt: string | null;
} = {
  generatedAt: null,
  stale: false,
  issues: new Set<HealthIssue>(),
  checks: { db: 'ok', snapshot: 'missing', coolify: 'unknown' },
  lastRefreshAt: null,
};
