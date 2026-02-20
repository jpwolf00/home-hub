import { NextRequest, NextResponse } from 'next/server';
import { queryUsageByAgent } from '@/lib/usage-db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '24h';

  try {
    const data = await queryUsageByAgent(range);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
