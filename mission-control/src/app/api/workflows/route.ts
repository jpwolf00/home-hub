import { NextRequest, NextResponse } from 'next/server';
import { ensureBootstrapped } from '@/lib/bootstrap';
import { queryWorkflows } from '@/lib/db';
import { runtimeState } from '@/lib/state';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  ensureBootstrapped();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;
  const workflow = searchParams.get('workflow') ?? undefined;
  const items = queryWorkflows(status, workflow);

  return NextResponse.json({
    ok: true,
    generatedAt: runtimeState.generatedAt,
    stale: runtimeState.stale,
    items,
  });
}
