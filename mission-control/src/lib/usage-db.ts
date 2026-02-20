import { db } from './db';

export interface UsageEvent {
  id?: number;
  ts: string;
  agent_id: string;
  session_id: string;
  provider?: string;
  model: string;
  role?: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  total_tokens: number;
  stop_reason?: string;
  error_message?: string;
  source_file?: string;
  source_offset?: number;
}

export interface UsageGlobal {
  range: { start: string; end: string };
  totals: {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    totalTokens: number;
    errors: number;
  };
  errorRate: number;
  byProvider: { provider: string; requests: number; totalTokens: number }[];
}

export interface AgentUsage {
  agentId: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  avgTokensPerRequest: number;
  topModels: string[];
  providers: Record<string, number>;
}

export interface ModelUsage {
  model: string;
  provider: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  errorRate: number;
  p95TokensPerRequest: number;
}

export interface Alert {
  id: number;
  ts: string;
  severity: 'warning' | 'critical';
  ruleId: string;
  title: string;
  details: Record<string, any>;
  status: 'open' | 'acked' | 'resolved';
}

// Helper to get time range
function getTimeRange(range: string, start?: string, end?: string): { start: string; end: string } {
  const now = new Date();
  let startDate: Date;
  let endDate = now;

  if (start && end) {
    return { start, end };
  }

  switch (range) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}

export function queryUsageGlobal(range: string, start?: string, end?: string): UsageGlobal {
  const { start: startTs, end: endTs } = getTimeRange(range, start, end);

  // Get totals
  const totals = db.prepare(`
    SELECT 
      COUNT(*) as requests,
      COALESCE(SUM(input_tokens), 0) as input_tokens,
      COALESCE(SUM(output_tokens), 0) as output_tokens,
      COALESCE(SUM(cache_read_tokens), 0) as cache_read_tokens,
      COALESCE(SUM(cache_write_tokens), 0) as cache_write_tokens,
      COALESCE(SUM(total_tokens), 0) as total_tokens,
      COALESCE(SUM(CASE WHEN error_message IS NOT NULL THEN 1 ELSE 0 END), 0) as errors
    FROM usage_events
    WHERE ts >= ? AND ts <= ?
  `).get(startTs, endTs) as any;

  // Get by provider
  const byProvider = db.prepare(`
    SELECT 
      provider,
      COUNT(*) as requests,
      COALESCE(SUM(total_tokens), 0) as total_tokens
    FROM usage_events
    WHERE ts >= ? AND ts <= ? AND provider IS NOT NULL
    GROUP BY provider
  `).all(startTs, endTs) as any[];

  const totalRequests = totals.requests || 1;
  const errorRate = (totals.errors || 0) / totalRequests;

  return {
    range: { start: startTs, end: endTs },
    totals: {
      requests: totals.requests || 0,
      inputTokens: totals.input_tokens || 0,
      outputTokens: totals.output_tokens || 0,
      cacheReadTokens: totals.cache_read_tokens || 0,
      cacheWriteTokens: totals.cache_write_tokens || 0,
      totalTokens: totals.total_tokens || 0,
      errors: totals.errors || 0,
    },
    errorRate,
    byProvider: byProvider.map((p) => ({
      provider: p.provider || 'unknown',
      requests: p.requests || 0,
      totalTokens: p.total_tokens || 0,
    })),
  };
}

export function queryUsageAgents(range: string): { agents: AgentUsage[] } {
  const { start: startTs, end: endTs } = getTimeRange(range);

  const agents = db.prepare(`
    SELECT 
      agent_id,
      COUNT(*) as requests,
      COALESCE(SUM(input_tokens), 0) as input_tokens,
      COALESCE(SUM(output_tokens), 0) as output_tokens,
      COALESCE(SUM(total_tokens), 0) as total_tokens
    FROM usage_events
    WHERE ts >= ? AND ts <= ?
    GROUP BY agent_id
    ORDER BY total_tokens DESC
  `).all(startTs, endTs) as any[];

  const result: AgentUsage[] = [];

  for (const agent of agents) {
    // Get top models
    const topModelsRows = db.prepare(`
      SELECT model, COUNT(*) as cnt
      FROM usage_events
      WHERE ts >= ? AND ts <= ? AND agent_id = ?
      GROUP BY model
      ORDER BY cnt DESC
      LIMIT 3
    `).all(startTs, endTs, agent.agent_id) as any[];

    // Get provider distribution
    const providerRows = db.prepare(`
      SELECT provider, COUNT(*) as cnt
      FROM usage_events
      WHERE ts >= ? AND ts <= ? AND agent_id = ? AND provider IS NOT NULL
      GROUP BY provider
    `).all(startTs, endTs, agent.agent_id) as any[];

    const totalRequests = agent.requests || 1;
    const providerCounts: Record<string, number> = {};
    for (const p of providerRows) {
      providerCounts[p.provider] = p.cnt / totalRequests;
    }

    result.push({
      agentId: agent.agent_id,
      requests: agent.requests || 0,
      inputTokens: agent.input_tokens || 0,
      outputTokens: agent.output_tokens || 0,
      totalTokens: agent.total_tokens || 0,
      avgTokensPerRequest: Math.round((agent.total_tokens || 0) / totalRequests),
      topModels: topModelsRows.map((m) => m.model),
      providers: providerCounts,
    });
  }

  return { agents: result };
}

export function queryUsageModels(range: string): { models: ModelUsage[] } {
  const { start: startTs, end: endTs } = getTimeRange(range);

  const models = db.prepare(`
    SELECT 
      model,
      provider,
      COUNT(*) as requests,
      COALESCE(SUM(input_tokens), 0) as input_tokens,
      COALESCE(SUM(output_tokens), 0) as output_tokens,
      COALESCE(SUM(total_tokens), 0) as total_tokens,
      COALESCE(SUM(CASE WHEN error_message IS NOT NULL THEN 1 ELSE 0 END), 0) as errors
    FROM usage_events
    WHERE ts >= ? AND ts <= ?
    GROUP BY model, provider
    ORDER BY total_tokens DESC
  `).all(startTs, endTs) as any[];

  const result: ModelUsage[] = [];

  for (const m of models) {
    const requests = m.requests || 1;
    const errorRate = (m.errors || 0) / requests;

    // Calculate p95 tokens per request (simplified - actual would need all values)
    const p95Tokens = db.prepare(`
      SELECT total_tokens FROM usage_events
      WHERE ts >= ? AND ts <= ? AND model = ? AND provider = ?
      ORDER BY total_tokens
      LIMIT 1 OFFSET ?
    `).get(startTs, endTs, m.model, m.provider, Math.floor(requests * 0.95)) as any;

    result.push({
      model: m.model || 'unknown',
      provider: m.provider || 'unknown',
      requests,
      inputTokens: m.input_tokens || 0,
      outputTokens: m.output_tokens || 0,
      totalTokens: m.total_tokens || 0,
      errorRate,
      p95TokensPerRequest: p95Tokens?.total_tokens || 0,
    });
  }

  return { models: result };
}

export function queryAlerts(status?: string, limit = 50): { alerts: Alert[] } {
  let sql = 'SELECT * FROM alert_events';
  const params: any[] = [];
  
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY ts DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(sql).all(...params) as any[];

  return {
    alerts: rows.map((r) => ({
      id: r.id,
      ts: r.ts,
      severity: r.severity,
      ruleId: r.rule_id,
      title: r.title,
      details: r.details_json ? JSON.parse(r.details_json) : {},
      status: r.status,
    })),
  };
}

export function updateAlertStatus(alertId: number, action: 'ack' | 'resolve'): void {
  const newStatus = action === 'ack' ? 'acked' : 'resolved';
  db.prepare('UPDATE alert_events SET status = ? WHERE id = ?').run(newStatus, alertId);
}

export function insertUsageEvent(event: UsageEvent): void {
  db.prepare(`
    INSERT INTO usage_events (
      ts, agent_id, session_id, provider, model, role,
      input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, total_tokens,
      stop_reason, error_message, source_file, source_offset
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.ts,
    event.agent_id,
    event.session_id,
    event.provider,
    event.model,
    event.role,
    event.input_tokens,
    event.output_tokens,
    event.cache_read_tokens,
    event.cache_write_tokens,
    event.total_tokens,
    event.stop_reason,
    event.error_message,
    event.source_file,
    event.source_offset
  );
}

export function upsertParserState(sourceFile: string, lastOffset: number, lastTs: string): void {
  db.prepare(`
    INSERT INTO parser_state (source_file, last_offset, last_ts, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(source_file) DO UPDATE SET
      last_offset = excluded.last_offset,
      last_ts = excluded.last_ts,
      updated_at = datetime('now')
  `).run(sourceFile, lastOffset, lastTs);
}

export function getParserState(sourceFile: string): { last_offset: number; last_ts: string } | undefined {
  return db.prepare('SELECT last_offset, last_ts FROM parser_state WHERE source_file = ?').get(sourceFile) as any;
}

export function insertAlert(alert: { ts: string; severity: string; rule_id: string; title: string; details_json: string }): void {
  db.prepare(`
    INSERT INTO alert_events (ts, severity, rule_id, title, details_json, status)
    VALUES (?, ?, ?, ?, ?, 'open')
  `).run(alert.ts, alert.severity, alert.rule_id, alert.title, alert.details_json);
}

export function getAlertConfig(ruleId: string): { config_json: string } | undefined {
  return db.prepare('SELECT config_json FROM alert_config WHERE rule_id = ? AND enabled = 1').get(ruleId) as any;
}

export function checkAndCreateAlerts(): void {
  const now = new Date();
  const dayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const hourStart = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  // Get provider daily usage
  const providerUsage = db.prepare(`
    SELECT provider, SUM(total_tokens) as total
    FROM usage_events
    WHERE ts >= ? AND provider IS NOT NULL
    GROUP BY provider
  `).all(dayStart, now.toISOString()) as any[];

  // Check provider limits
  const limitConfig = getAlertConfig('provider_daily_limit');
  if (limitConfig) {
    const limits = JSON.parse(limitConfig.config_json);
    for (const p of providerUsage) {
      const limit = limits[p.provider];
      if (limit) {
        const pct = p.total / limit;
        if (pct >= 0.9) {
          // Check if alert already exists (not acked)
          const existing = db.prepare(`
            SELECT id FROM alert_events 
            WHERE rule_id = ? AND status != 'resolved' AND ts >= ?
          `).get(`provider_daily_limit_${p.provider}`, dayStart);
          
          if (!existing) {
            insertAlert({
              ts: now.toISOString(),
              severity: pct >= 0.9 ? 'critical' : 'warning',
              rule_id: `provider_daily_limit_${p.provider}`,
              title: `${p.provider} daily limit at ${Math.round(pct * 100)}%`,
              details_json: JSON.stringify({ provider: p.provider, used: p.total, limit, pct }),
            });
          }
        }
      }
    }
  }

  // Check error rate spike
  const errorConfig = getAlertConfig('error_rate_threshold');
  if (errorConfig) {
    const threshold = JSON.parse(errorConfig.config_json).value;
    
    const hourStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN error_message IS NOT NULL THEN 1 ELSE 0 END), 0) as errors
      FROM usage_events
      WHERE ts >= ?
    `).get(hourStart) as any;

    if (hourStats.total > 0 && hourStats.errors / hourStats.total > threshold) {
      const existing = db.prepare(`
        SELECT id FROM alert_events 
        WHERE rule_id = 'error_rate_spike' AND status != 'resolved' AND ts >= ?
      `).get(hourStart);
      
      if (!existing) {
        insertAlert({
          ts: now.toISOString(),
          severity: 'critical',
          rule_id: 'error_rate_spike',
          title: `Error rate at ${Math.round((hourStats.errors / hourStats.total) * 100)}% over last hour`,
          details_json: JSON.stringify({ errors: hourStats.errors, total: hourStats.total, threshold }),
        });
      }
    }
  }
}
