import { NextRequest, NextResponse } from 'next/server';

// MVP: Return empty alerts for now
export async function GET(request: NextRequest) {
  return NextResponse.json({ alerts: [], count: 0 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "Alerts not implemented in MVP" });
}
