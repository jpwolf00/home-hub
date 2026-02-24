import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasSportsKey: !!process.env.FOOTBALL_DATA_API_KEY,
    keyPrefix: process.env.FOOTBALL_DATA_API_KEY?.substring(0, 10) || 'none',
  })
}
