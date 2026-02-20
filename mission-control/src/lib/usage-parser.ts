// Simple JSONL parser for session logs - fetches from local server or reads local files
import fs from 'fs';
import path from 'path';

// Local volume mount path (set by Coolify persistent storage)
const SESSION_LOG_PATH = '/app/agents/main/sessions';
const HOST_SESSION_URL = process.env.HOST_SESSION_URL || 'http://host.docker.internal:8787';

export interface ParsedUsage {
  timestamp: string;
  agentId: string;
  sessionId: string;
  provider?: string;
  model: string;
  role?: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
  stopReason?: string;
  errorMessage?: string;
}

function parseUsageFromLine(line: string, filename: string): ParsedUsage | null {
  try {
    const entry = JSON.parse(line);
    const msg = entry.message || entry;
    const usage = msg.usage || {};
    
    if (!usage.totalTokens && !usage.input) return null;
    
    return {
      timestamp: entry.timestamp || new Date().toISOString(),
      agentId: entry.agentId || 'main',
      sessionId: filename.replace('.jsonl', ''),
      provider: msg.provider || null,
      model: msg.model || 'unknown',
      role: msg.role || null,
      inputTokens: usage.input || 0,
      outputTokens: usage.output || 0,
      cacheReadTokens: usage.cacheRead || 0,
      cacheWriteTokens: usage.cacheWrite || 0,
      totalTokens: usage.totalTokens || 0,
      stopReason: msg.stopReason || null,
      errorMessage: msg.errorMessage || null,
    };
  } catch {
    return null;
  }
}

export async function parseSessionLogs(): Promise<ParsedUsage[]> {
  const results: ParsedUsage[] = [];
  
  // First try: local filesystem
  if (fs.existsSync(SESSION_LOG_PATH)) {
    console.log('[usage] Reading from local path:', SESSION_LOG_PATH);
    const files = fs.readdirSync(SESSION_LOG_PATH).filter(f => f.endsWith('.jsonl'));
    
    for (const file of files.slice(0, 50)) { // Limit to 50 files for performance
      const filePath = path.join(SESSION_LOG_PATH, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());
        
        for (const line of lines) {
          const parsed = parseUsageFromLine(line, file);
          if (parsed) results.push(parsed);
        }
      } catch (e) {
        console.warn('[usage] Error reading', file, e);
      }
    }
    return results;
  }
  
  // Second try: fetch from host HTTP server
  console.log('[usage] Trying to fetch from host:', HOST_SESSION_URL);
  try {
    const listRes = await fetch(HOST_SESSION_URL + '/');
    const html = await listRes.text();
    const fileMatches = html.match(/href="([^"]*\.jsonl)"/g) || [];
    
    for (const match of fileMatches.slice(0, 50)) {
      const filename = match.replace('href="', '').replace('"', '');
      try {
        const fileRes = await fetch(HOST_SESSION_URL + '/' + filename);
        const content = await fileRes.text();
        const lines = content.split('\n').filter(l => l.trim());
        
        for (const line of lines) {
          const parsed = parseUsageFromLine(line, filename);
          if (parsed) results.push(parsed);
        }
      } catch (e) {
        console.warn('[usage] Error fetching', filename, e);
      }
    }
  } catch (e) {
    console.warn('[usage] Could not fetch from host:', e);
  }
  
  console.log('[usage] Total entries parsed:', results.length);
  
  // Log some timestamp samples
  if (results.length > 0) {
    console.log('[usage] First 3 timestamps:', results.slice(0, 3).map(e => e.timestamp));
  }
  
  return results;
}

export function filterByRange(entries: ParsedUsage[], range: string): ParsedUsage[] {
  const now = new Date();
  let cutoff: Date;
  
  switch (range) {
    case '1h':
      cutoff = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  
  return entries.filter(e => new Date(e.timestamp) >= cutoff);
}
