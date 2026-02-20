import { NextResponse } from 'next/server';
import { ensureBootstrapped } from '@/lib/bootstrap';
import { runtimeState } from '@/lib/state';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureBootstrapped();
  const issues = Array.from(runtimeState.issues);
  // Only degrade if DB error or true issues - snapshot missing alone is not degrading
  const status = runtimeState.checks.db === 'error' ? 'error' : (issues.length > 0 ? 'degraded' : 'ok');

  return NextResponse.json({
    ok: true,
    status,
    checks: runtimeState.checks,
    activeSources: Array.from(runtimeState.activeSources),
    issues,
    timestamp: new Date().toISOString(),
  });
}
