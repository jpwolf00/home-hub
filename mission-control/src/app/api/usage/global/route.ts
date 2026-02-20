import { NextRequest, NextResponse } from 'next/server';
import { queryUsageGlobal } from '@/lib/usage-db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '24h';
  const start = searchParams.get('start') || undefined;
  const end = searchParams.get('end') || undefined;

  try {
    const data = await queryUsageGlobal(range);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
