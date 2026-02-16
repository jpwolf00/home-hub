import { NextResponse } from 'next/server'

const MAC_IP = process.env.MAC_REMINDERS_IP || '192.168.85.109'
const MAC_PORT = process.env.MAC_REMINDERS_PORT || '3456'

export async function GET() {
  try {
    const response = await fetch(`http://${MAC_IP}:${MAC_PORT}/reminders`, {
      next: { revalidate: 60 } // Cache for 60 seconds
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch reminders:', error)
    return NextResponse.json([])
  }
}
