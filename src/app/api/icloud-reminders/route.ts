import { NextResponse } from 'next/server'

const ICLOUD_EMAIL = process.env.ICLOUD_EMAIL
const ICLOUD_PASSWORD = process.env.ICLOUD_APP_PASSWORD

// Cache for 30 seconds
let cache: { data: any; timestamp: number } | null = null
const CACHE_TTL = 30000

export async function GET() {
  if (!ICLOUD_EMAIL || !ICLOUD_PASSWORD) {
    return NextResponse.json({ 
      error: 'iCloud credentials not configured',
      needsSetup: true 
    })
  }

  const now = Date.now()
  if (cache && (now - cache.timestamp) < CACHE_TTL) {
    return NextResponse.json(cache.data)
  }

  try {
    const { CalDAVClient } = await import('caldav')
    
    const client = new CalDAVClient({
      url: 'https://caldav.icloud.com/',
      username: ICLOUD_EMAIL,
      password: ICLOUD_PASSWORD
    })

    const principal = await client.principal()
    const calendars = await principal.calendars()
    
    const allReminders: any[] = []
    
    for (const cal of calendars) {
      if (cal.name?.toLowerCase().includes('reminder') || cal.name?.toLowerCase().includes('todo')) {
        const events = await cal.events()
        for (const event of events) {
          const summary = event.data?.vcalendar?.vevent?.summary?.value || 'Untitled'
          // iCloud stores completed in a different way - check for completed status
          allReminders.push({
            title: summary,
            completed: false,
            list: cal.name
          })
        }
      }
    }

    cache = { data: allReminders, timestamp: now }
    return NextResponse.json(allReminders)
  } catch (error) {
    console.error('CalDAV error:', error)
    if (cache) {
      return NextResponse.json(cache.data)
    }
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch reminders' 
    })
  }
}
