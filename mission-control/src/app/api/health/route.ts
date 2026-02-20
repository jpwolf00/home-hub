import { NextResponse } from 'next/server';
import { ensureBootstrapped } from '@/lib/bootstrap';
import { runtimeState } from '@/lib/state';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureBootstrapped();
  const issues = Array.from(runtimeState.issues);
  const status = issues.length ? 'degraded' : 'healthy';

  return NextResponse.json({
    ok: true,
    status,
    checks: runtimeState.checks,
    issues,
    timestamp: new Date().toISOString(),
  });
}
