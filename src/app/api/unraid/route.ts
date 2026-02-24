import { NextResponse } from 'next/server'
import axios from 'axios'

const UNRAID_URL = process.env.UNRAID_URL || ''
const UNRAID_API_KEY = process.env.UNRAID_API_KEY || ''

export async function GET() {
  if (!UNRAID_URL || !UNRAID_API_KEY) {
    return NextResponse.json({ error: 'Unraid not configured' }, { status: 500 })
  }

  try {
    // Fetch server stats from Unraid API
    const [systemInfo, info] = await Promise.all([
      axios.get(`${UNRAID_URL}/api/systeminfo`, {
        headers: { 'Authorization': `Bearer ${UNRAID_API_KEY}` },
        timeout: 5000,
      }).catch(() => null),
      axios.get(`${UNRAID_URL}/api/info`, {
        headers: { 'Authorization': `Bearer ${UNRAID_API_KEY}` },
        timeout: 5000,
      }).catch(() => null),
    ])

    // Mock data for now since Unraid API structure varies
    // Real implementation would parse the actual API response
    return NextResponse.json({
      cpu: Math.floor(Math.random() * 40) + 20, // 20-60%
      memory: Math.floor(Math.random() * 30) + 50, // 50-80%
      disk: Math.floor(Math.random() * 20) + 60, // 60-80%
      containers: 12,
      runningContainers: Math.floor(Math.random() * 3) + 10,
      uptime: '5 days, 3 hours',
      hostname: info?.data?.name || 'Unraid',
    })
  } catch (error) {
    console.error('Unraid API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Unraid stats' },
      { status: 500 }
    )
  }
}
