import { NextRequest, NextResponse } from 'next/server';
import { queryAlerts, updateAlertStatus } from '@/lib/usage-db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    const data = queryAlerts(status, limit);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, action } = body;

    if (!alertId || !action || !['ack', 'resolve'].includes(action)) {
      return NextResponse.json({ error: 'Invalid alertId or action' }, { status: 400 });
    }

    updateAlertStatus(alertId, action);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
