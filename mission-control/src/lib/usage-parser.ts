// Simple JSONL parser for session logs - no DB dependency
import fs from 'fs';
import path from 'path';

// Try multiple paths - container mount, host.docker.internal, or direct
const SESSION_LOG_PATH = process.env.SESSION_LOG_PATH || 
  (fs.existsSync('/app/agents/main/sessions') ? '/app/agents/main/sessions' :
   fs.existsSync('/host/home/jpwolf00/.openclaw/agents/main/sessions') ? '/host/home/jpwolf00/.openclaw/agents/main/sessions' :
   '/home/jpwolf00/.openclaw/agents/main/sessions');

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

export function parseSessionLogs(): ParsedUsage[] {
  const results: ParsedUsage[] = [];
  
  if (!fs.existsSync(SESSION_LOG_PATH)) {
    console.warn('[usage] Session log path not found:', SESSION_LOG_PATH);
    return results;
  }
  
  const files = fs.readdirSync(SESSION_LOG_PATH).filter(f => f.endsWith('.jsonl'));
  
  for (const file of files) {
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
