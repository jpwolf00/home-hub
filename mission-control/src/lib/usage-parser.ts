import fs from 'node:fs';
import path from 'node:path';
import { env } from './env';
import { insertUsageEvent, upsertParserState, getParserState, checkAndCreateAlerts } from './usage-db';

interface SessionEntry {
  type: string;
  timestamp: string;
  id?: string;
  session?: string;
  message?: {
    role?: string;
    api?: string;
    provider?: string;
    model?: string;
    usage?: {
      input?: number;
      output?: number;
      cacheRead?: number;
      cacheWrite?: number;
      totalTokens?: number;
    };
    stopReason?: string;
    errorMessage?: string;
    content?: Array<{ type: string; text?: string; thinking?: string }>;
    toolName?: string;
  };
}

// Extract agent_id from session path or ID
function extractAgentId(sessionId: string): string {
  // Try to determine agent from session ID patterns like:
  // agent:main:main, agent:architect:subagent:xyz, etc.
  if (sessionId.startsWith('agent:')) {
    const parts = sessionId.split(':');
    if (parts.length >= 2) {
      return `agent:${parts[1]}`;
    }
  }
  return sessionId;
}

// Parse a single JSONL line
function parseLine(line: string, sourceFile: string, offset: number): SessionEntry | null {
  try {
    return JSON.parse(line.trim()) as SessionEntry;
  } catch (e) {
    return null;
  }
}

// Process a message entry and insert into DB
function processEntry(entry: SessionEntry, sourceFile: string, offset: number): void {
  if (entry.type !== 'message' || !entry.message) return;

  const msg = entry.message;
  
  // Only process API calls with usage data (assistant messages)
  if (!msg.usage || msg.role === 'user') return;

  const event = {
    ts: entry.timestamp || new Date().toISOString(),
    agent_id: extractAgentId(entry.session || 'unknown'),
    session_id: entry.session || path.basename(sourceFile, '.jsonl'),
    provider: msg.provider || 'unknown',
    model: msg.model || 'unknown',
    role: msg.role || undefined,
    input_tokens: msg.usage.input || 0,
    output_tokens: msg.usage.output || 0,
    cache_read_tokens: msg.usage.cacheRead || 0,
    cache_write_tokens: msg.usage.cacheWrite || 0,
    total_tokens: msg.usage.totalTokens || 0,
    stop_reason: msg.stopReason || undefined,
    error_message: msg.errorMessage || undefined,
    source_file: sourceFile,
    source_offset: offset,
  };

  insertUsageEvent(event);
}

// Parse a single file
function parseFile(filePath: string): number {
  const fileName = path.basename(filePath);
  const state = getParserState(fileName);
  const startOffset = state?.last_offset || 0;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let newEvents = 0;
  let currentOffset = 0;
  let lastTs = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    currentOffset = i;

    if (i < startOffset) continue;

    const entry = parseLine(line, fileName, i);
    if (entry) {
      if (entry.timestamp) lastTs = entry.timestamp;
      processEntry(entry, fileName, i);
      newEvents++;
    }
  }

  if (newEvents > 0 || lastTs) {
    upsertParserState(fileName, currentOffset + 1, lastTs);
  }

  return newEvents;
}

// Main parser function - scans all session files
export function parseSessionLogs(): number {
  const sessionsPath = env.sessionsPath;
  
  if (!fs.existsSync(sessionsPath)) {
    console.warn(`Sessions path does not exist: ${sessionsPath}`);
    return 0;
  }

  const files = fs.readdirSync(sessionsPath)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => path.join(sessionsPath, f));

  let totalEvents = 0;

  for (const file of files) {
    try {
      const count = parseFile(file);
      totalEvents += count;
    } catch (e) {
      console.error(`Error parsing ${file}:`, e);
    }
  }

  // Check for alerts after parsing
  if (totalEvents > 0) {
    try {
      checkAndCreateAlerts();
    } catch (e) {
      console.error('Error checking alerts:', e);
    }
  }

  return totalEvents;
}

// For manual triggering via API
export function refreshUsageData(): { newEvents: number; message: string } {
  try {
    const count = parseSessionLogs();
    return {
      newEvents: count,
      message: count === 0 ? 'No new events found' : `Inserted ${count} new events`,
    };
  } catch (e: any) {
    return {
      newEvents: 0,
      message: `Error: ${e.message}`,
    };
  }
}
