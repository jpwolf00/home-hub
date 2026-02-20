import { NextResponse } from 'next/server';
import { refreshUsageData } from '@/lib/usage-db';

export async function POST() {
  try {
    const result = refreshUsageData();
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, newEvents: 0 }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
