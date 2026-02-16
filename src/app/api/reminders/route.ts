import { NextResponse } from 'next/server'

const MAC_IP = process.env.MAC_REMINDERS_IP || '192.168.85.109'
const MAC_PORT = process.env.MAC_REMINDERS_PORT || '3456'

// Cache the reminders for 30 seconds
let cache: { data: any; timestamp: number } | null = null
const CACHE_TTL = 30000 // 30 seconds

export async function GET() {
  const now = Date.now()
  
  // Return cached data if fresh
  if (cache && (now - cache.timestamp) < CACHE_TTL) {
    return NextResponse.json(cache.data)
  }
  
  try {
    const response = await fetch(`http://${MAC_IP}:${MAC_PORT}/reminders`, {
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    
    // Update cache
    cache = { data, timestamp: now }
    
    return NextResponse.json(data)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Failed to fetch reminders:', errMsg)
    // Return stale cache if available
    if (cache) {
      console.log('Returning stale cache')
      return NextResponse.json(cache.data)
    }
    return NextResponse.json({ error: errMsg, mac: MAC_IP })
  }
}
