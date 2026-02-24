import { NextResponse } from 'next/server';
import { ensureBootstrapped } from '@/lib/bootstrap';
import { latestDeploy, queryEvents } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureBootstrapped();
  const deploy = latestDeploy();
  const events = queryEvents(10);

  return NextResponse.json({
    ok: true,
    latestDeploy: deploy
      ? {
          provider: deploy.provider,
          appUuid: deploy.appUuid,
          status: deploy.status,
          updatedAt: deploy.updatedAt,
        }
      : null,
    events,
  });
}
