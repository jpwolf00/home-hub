import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

// Return build timestamp for auto-reload detection
export async function GET() {
  try {
    // Use git commit hash as version identifier
    const hash = execSync('git rev-parse HEAD', { cwd: process.cwd(), encoding: 'utf-8' }).trim()
    const timestamp = execSync('git log -1 --format=%ct', { cwd: process.cwd(), encoding: 'utf-8' }).trim()
    return NextResponse.json({ 
      version: hash.slice(0, 7),
      timestamp: parseInt(timestamp) * 1000
    })
  } catch {
    // Fallback to build time
    return NextResponse.json({ 
      version: 'local',
      timestamp: Date.now()
    })
  }
}