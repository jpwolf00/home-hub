import { NextResponse } from 'next/server'

const ICLOUD_EMAIL = process.env.ICLOUD_EMAIL
const ICLOUD_PASSWORD = process.env.ICLOUD_APP_PASSWORD

// Cache for 60 seconds
let cache: { data: any; timestamp: number } | null = null
const CACHE_TTL = 60000

function basicAuth(user: string, pass: string): string {
  return 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64')
}

async function caldavRequest(url: string, method: string, body: string, auth: string): Promise<{ status: number; text: string }> {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Depth': '1',
      'Authorization': auth,
    },
    body,
  })
  const text = await res.text()
  return { status: res.status, text }
}

// Discover the principal URL for the user
async function discoverPrincipal(auth: string): Promise<string> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:current-user-principal/>
  </d:prop>
</d:propfind>`

  const res = await caldavRequest('https://caldav.icloud.com/', 'PROPFIND', body, auth)
  const match = res.text.match(/<d:current-user-principal>[\s\S]*?<d:href>([^<]+)<\/d:href>/i)
    || res.text.match(/<D:current-user-principal>[\s\S]*?<D:href>([^<]+)<\/D:href>/i)
  if (!match) throw new Error('Could not discover principal URL')
  return match[1]
}

// Discover the calendar home set
async function discoverCalendarHome(principalUrl: string, auth: string): Promise<string> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <c:calendar-home-set/>
  </d:prop>
</d:propfind>`

  const fullUrl = principalUrl.startsWith('http') ? principalUrl : `https://caldav.icloud.com${principalUrl}`
  const res = await caldavRequest(fullUrl, 'PROPFIND', body, auth)
  const match = res.text.match(/<cal:calendar-home-set>[\s\S]*?<d:href>([^<]+)<\/d:href>/i)
    || res.text.match(/<C:calendar-home-set>[\s\S]*?<D:href>([^<]+)<\/D:href>/i)
    || res.text.match(/<calendar-home-set[^>]*>[\s\S]*?<href[^>]*>([^<]+)<\/href>/i)
  if (!match) throw new Error('Could not discover calendar home set')
  return match[1]
}

// List calendars that support VTODO (reminders)
async function listReminderCollections(homeUrl: string, auth: string): Promise<Array<{ url: string; name: string }>> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/" xmlns:x="http://apple.com/ns/ical/">
  <d:prop>
    <d:displayname/>
    <d:resourcetype/>
    <c:supported-calendar-component-set/>
  </d:prop>
</d:propfind>`

  const fullUrl = homeUrl.startsWith('http') ? homeUrl : `https://caldav.icloud.com${homeUrl}`
  const res = await caldavRequest(fullUrl, 'PROPFIND', body, auth)

  const collections: Array<{ url: string; name: string }> = []
  // Split into individual responses
  const responses = res.text.split(/<d:response>/i).slice(1)

  for (const resp of responses) {
    // Check if this collection supports VTODO
    if (!/VTODO/i.test(resp)) continue

    const hrefMatch = resp.match(/<d:href>([^<]+)<\/d:href>/i)
    const nameMatch = resp.match(/<d:displayname>([^<]*)<\/d:displayname>/i)
    if (hrefMatch) {
      collections.push({
        url: hrefMatch[1],
        name: nameMatch ? nameMatch[1] : 'Reminders',
      })
    }
  }

  return collections
}

// Fetch VTODOs from a reminder collection
async function fetchReminders(collectionUrl: string, auth: string): Promise<Array<{ title: string; completed: boolean }>> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag/>
    <c:calendar-data/>
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VTODO">
        <c:prop-filter name="STATUS">
          <c:text-match negate-condition="yes">COMPLETED</c:text-match>
        </c:prop-filter>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`

  const fullUrl = collectionUrl.startsWith('http') ? collectionUrl : `https://caldav.icloud.com${collectionUrl}`
  const res = await caldavRequest(fullUrl, 'REPORT', body, auth)

  const reminders: Array<{ title: string; completed: boolean }> = []
  const responses = res.text.split(/<d:response>/i).slice(1)

  for (const resp of responses) {
    const calDataMatch = resp.match(/<c:calendar-data[^>]*>([\s\S]*?)<\/c:calendar-data>/i)
      || resp.match(/<cal:calendar-data[^>]*>([\s\S]*?)<\/cal:calendar-data>/i)
      || resp.match(/<C:calendar-data[^>]*>([\s\S]*?)<\/C:calendar-data>/i)
    if (!calDataMatch) continue

    const ical = calDataMatch[1]
    const summaryMatch = ical.match(/SUMMARY[^:]*:(.+)/i)
    const statusMatch = ical.match(/STATUS[^:]*:(.+)/i)

    const title = summaryMatch ? summaryMatch[1].trim() : 'Untitled'
    const status = statusMatch ? statusMatch[1].trim().toUpperCase() : ''
    const completed = status === 'COMPLETED'

    reminders.push({ title, completed })
  }

  return reminders
}

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
    const auth = basicAuth(ICLOUD_EMAIL, ICLOUD_PASSWORD)

    // Step 1: Discover principal
    const principalUrl = await discoverPrincipal(auth)
    console.log('Principal URL:', principalUrl)

    // Step 2: Discover calendar home
    const homeUrl = await discoverCalendarHome(principalUrl, auth)
    console.log('Calendar home URL:', homeUrl)

    // Step 3: List reminder collections (VTODO-supporting calendars)
    const collections = await listReminderCollections(homeUrl, auth)
    console.log('Reminder collections:', collections.map(c => c.name))

    // Step 4: Fetch incomplete reminders from each collection
    const allReminders: Array<{ title: string; completed: boolean; list: string }> = []

    for (const col of collections) {
      const items = await fetchReminders(col.url, auth)
      for (const item of items) {
        allReminders.push({ ...item, list: col.name })
      }
    }

    console.log(`Fetched ${allReminders.length} incomplete reminders`)
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
