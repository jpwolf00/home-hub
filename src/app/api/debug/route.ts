import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.FOOTBALL_DATA_API_KEY
  return NextResponse.json({ 
    hasKey: !!key,
    keyLength: key?.length || 0,
    keyPrefix: key?.substring(0, 4) || 'none'
  })
}
