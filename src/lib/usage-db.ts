import { parseSessionLogs, filterByRange, type ParsedUsage } from './usage-parser';

let cachedData: ParsedUsage[] | null = null;
let lastParseTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

function getUsageData(): ParsedUsage[] {
  const now = Date.now();
  if (!cachedData || now - lastParseTime > CACHE_TTL_MS) {
    cachedData = parseSessionLogs();
    lastParseTime = now;
  }
  return cachedData;
}

export function queryUsageGlobal(range: string = '24h') {
  const all = getUsageData();
  const filtered = filterByRange(all, range);
  
  const totals = filtered.reduce((acc, u) => ({
    requests: acc.requests + 1,
    inputTokens: acc.inputTokens + u.inputTokens,
    outputTokens: acc.outputTokens + u.outputTokens,
    cacheReadTokens: acc.cacheReadTokens + u.cacheReadTokens,
    cacheWriteTokens: acc.cacheWriteTokens + u.cacheWriteTokens,
    totalTokens: acc.totalTokens + u.totalTokens,
    errors: acc.errors + (u.errorMessage ? 1 : 0),
  }), {
    requests: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalTokens: 0,
    errors: 0,
  });
  
  const errorRate = totals.requests > 0 ? totals.errors / totals.requests : 0;
  
  // Group by provider
  const byProvider: Record<string, { requests: number; totalTokens: number }> = {};
  for (const u of filtered) {
    const p = u.provider || 'unknown';
    if (!byProvider[p]) byProvider[p] = { requests: 0, totalTokens: 0 };
    byProvider[p].requests++;
    byProvider[p].totalTokens += u.totalTokens;
  }
  
  // Group by model
  const byModel: Record<string, { requests: number; totalTokens: number }> = {};
  for (const u of filtered) {
    const m = u.model || 'unknown';
    if (!byModel[m]) byModel[m] = { requests: 0, totalTokens: 0 };
    byModel[m].requests++;
    byModel[m].totalTokens += u.totalTokens;
  }
  
  return {
    range,
    totals,
    errorRate: Math.round(errorRate * 100) / 100,
    byProvider: Object.entries(byProvider).map(([provider, v]) => ({ provider, ...v })),
    byModel: Object.entries(byModel).map(([model, v]) => ({ model, ...v })),
    count: filtered.length,
  };
}

export function queryUsageByAgent(range: string = '24h') {
  const all = getUsageData();
  const filtered = filterByRange(all, range);
  
  const byAgent: Record<string, typeof filtered> = {};
  for (const u of filtered) {
    const agent = u.agentId || 'unknown';
    if (!byAgent[agent]) byAgent[agent] = [];
    byAgent[agent].push(u);
  }
  
  return Object.entries(byAgent).map(([agentId, entries]) => ({
    agentId,
    requests: entries.length,
    inputTokens: entries.reduce((s, u) => s + u.inputTokens, 0),
    outputTokens: entries.reduce((s, u) => s + u.outputTokens, 0),
    totalTokens: entries.reduce((s, u) => s + u.totalTokens, 0),
    errors: entries.filter(u => u.errorMessage).length,
  })).sort((a, b) => b.totalTokens - a.totalTokens);
}

export function queryUsageByModel(range: string = '24h') {
  const all = getUsageData();
  const filtered = filterByRange(all, range);
  
  const byModel: Record<string, typeof filtered> = {};
  for (const u of filtered) {
    const model = u.model || 'unknown';
    if (!byModel[model]) byModel[model] = [];
    byModel[model].push(u);
  }
  
  return Object.entries(byModel).map(([model, entries]) => ({
    model,
    provider: entries[0].provider || 'unknown',
    requests: entries.length,
    inputTokens: entries.reduce((s, u) => s + u.inputTokens, 0),
    outputTokens: entries.reduce((s, u) => s + u.outputTokens, 0),
    totalTokens: entries.reduce((s, u) => s + u.totalTokens, 0),
    errors: entries.filter(u => u.errorMessage).length,
  })).sort((a, b) => b.totalTokens - a.totalTokens);
}

export function refreshUsageData() {
  cachedData = null;
  lastParseTime = 0;
  return getUsageData();
}
