import { NextResponse } from 'next/server';
import { ensureBootstrapped } from '@/lib/bootstrap';
import { runtimeState, isHealthy, hasUsableData } from '@/lib/state';
import { countWorkflows, countAgents, queryEvents } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureBootstrapped();
  
  const workflowCount = countWorkflows();
  const agentCount = countAgents();
  const eventCount = queryEvents(10).length;
  
  const issues = Array.from(runtimeState.issues);
  const warnings = Array.from(runtimeState.warnings);
  
  // Add snapshot missing as warning (not issue)
  if (runtimeState.checks.snapshot === 'missing' && env.allowSnapshotMissing) {
    warnings.push('snapshot_missing');
  }
  
  // Determine health status
  let status: 'ok' | 'degraded' | 'error' = 'ok';
  if (runtimeState.checks.db === 'error') {
    status = 'error';
 (!hasUsable  } else ifData() && issues.length > 0) {
    status = 'degraded';
  } else if (!hasUsableData() && runtimeState.activeSources.size === 0) {
    status = 'degraded';
    issues.push('no_data_sources');
  }
  
  return NextResponse.json({
    ok: true,
    status,
    checks: runtimeState.checks,
    activeSources: Array.from(runtimeState.activeSources),
    dataCounts: {
      workflows: workflowCount,
      agents: agentCount,
      events: eventCount,
    },
    issues,
    warnings,
    timestamp: new Date().toISOString(),
  });
}
