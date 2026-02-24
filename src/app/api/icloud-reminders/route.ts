import { NextResponse } from 'next/server'

const ICLOUD_EMAIL = process.env.ICLOUD_EMAIL
const ICLOUD_PASSWORD = process.env.ICLOUD_APP_PASSWORD

// Cache for 60 seconds
let cache: { data: any; timestamp: number } | null = null
const CACHE_TTL = 60000

function basicAuth(user: string, pass: string): string {
  return 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64')
}

async function caldavRequest(url: string, method: string, body: string, auth: string, depth = '1'): Promise<string> {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Depth': depth,
      'Authorization': auth,
    },
    body,
  })
  return await res.text()
}

// Extract href values from XML - handles both prefixed and unprefixed namespaces
function extractHref(xml: string): string | null {
  const match = xml.match(/<(?:\w+:)?href[^>]*>([^<]+)<\/(?:\w+:)?href>/i)
  return match ? match[1] : null
}

// Step 1: Discover principal URL
async function discoverPrincipal(auth: string): Promise<string> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop><d:current-user-principal/></d:prop>
</d:propfind>`

  const xml = await caldavRequest('https://caldav.icloud.com/', 'PROPFIND', body, auth, '0')
  const match = xml.match(/<(?:\w+:)?current-user-principal[^>]*>[\s\S]*?<(?:\w+:)?href[^>]*>([^<]+)<\/(?:\w+:)?href>/i)
  if (!match) throw new Error('Could not discover principal URL')
  return match[1]
}

// Step 2: Discover calendar home set
async function discoverCalendarHome(principalUrl: string, auth: string): Promise<string> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop><c:calendar-home-set/></d:prop>
</d:propfind>`

  const fullUrl = principalUrl.startsWith('http') ? principalUrl : `https://caldav.icloud.com${principalUrl}`
  const xml = await caldavRequest(fullUrl, 'PROPFIND', body, auth, '0')
  const match = xml.match(/<(?:\w+:)?calendar-home-set[^>]*>[\s\S]*?<(?:\w+:)?href[^>]*>([^<]+)<\/(?:\w+:)?href>/i)
  if (!match) throw new Error('Could not discover calendar home set')
  return match[1]
}

// Step 3: List VTODO collections
async function listReminderCollections(homeUrl: string, auth: string): Promise<Array<{ url: string; name: string }>> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:displayname/>
    <d:resourcetype/>
    <c:supported-calendar-component-set/>
  </d:prop>
</d:propfind>`

  const xml = await caldavRequest(homeUrl, 'PROPFIND', body, auth)
  const collections: Array<{ url: string; name: string }> = []

  // Split on <response> or <d:response>
  const responses = xml.split(/<(?:\w+:)?response(?:\s[^>]*)?>/i).slice(1)

  for (const resp of responses) {
    // Must support VTODO and be a calendar (not outbox/inbox)
    if (!/VTODO/i.test(resp)) continue
    if (/schedule-inbox|schedule-outbox|notification/i.test(resp)) continue

    const hrefMatch = resp.match(/<(?:\w+:)?href[^>]*>([^<]+)<\/(?:\w+:)?href>/i)
    const nameMatch = resp.match(/<(?:\w+:)?displayname[^>]*>([^<]*)<\/(?:\w+:)?displayname>/i)
    if (hrefMatch) {
      collections.push({
        url: hrefMatch[1].startsWith('http') ? hrefMatch[1] : `${homeUrl.replace(/\/[^/]*\/$/, '')}/../..${hrefMatch[1]}`,
        name: nameMatch ? nameMatch[1] : 'Reminders',
      })
    }
  }

  return collections
}

// Step 4: Fetch VTODOs from a collection
async function fetchReminders(collectionUrl: string, auth: string): Promise<Array<{ title: string; completed: boolean }>> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag/>
    <c:calendar-data/>
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VTODO"/>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`

  const xml = await caldavRequest(collectionUrl, 'REPORT', body, auth)
  const reminders: Array<{ title: string; completed: boolean }> = []

  // Split on <response> tags
  const responses = xml.split(/<(?:\w+:)?response(?:\s[^>]*)?>/i).slice(1)

  for (const resp of responses) {
    // Extract calendar data - may be in CDATA or plain text
    const cdataMatch = resp.match(/<(?:\w+:)?calendar-data[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/(?:\w+:)?calendar-data>/i)
    const plainMatch = resp.match(/<(?:\w+:)?calendar-data[^>]*>([\s\S]*?)<\/(?:\w+:)?calendar-data>/i)
    const ical = cdataMatch ? cdataMatch[1] : plainMatch ? plainMatch[1] : null
    if (!ical || !ical.includes('VTODO')) continue

    const summaryMatch = ical.match(/SUMMARY:(.+)/i)
    const statusMatch = ical.match(/STATUS:(.+)/i)
    const completedMatch = ical.match(/COMPLETED:/i)

    const title = summaryMatch ? summaryMatch[1].trim() : 'Untitled'
    const status = statusMatch ? statusMatch[1].trim().toUpperCase() : ''
    const completed = status === 'COMPLETED' || !!completedMatch

    if (!completed) {
      reminders.push({ title, completed: false })
    }
  }

  return reminders
}

// Reconstruct full URL for a collection path using the calendar home base
function resolveCollectionUrl(homeUrl: string, path: string): string {
  if (path.startsWith('http')) return path
  // homeUrl is like https://p165-caldav.icloud.com:443/67916596/calendars/
  // path is like /67916596/calendars/xxx-xxx/
  const urlObj = new URL(homeUrl)
  return `${urlObj.protocol}//${urlObj.host}${path}`
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

    const principalUrl = await discoverPrincipal(auth)
    console.log('Principal URL:', principalUrl)

    const homeUrl = await discoverCalendarHome(principalUrl, auth)
    console.log('Calendar home URL:', homeUrl)

    const collections = await listReminderCollections(homeUrl, auth)
    console.log('Reminder collections:', collections.map(c => `${c.name} -> ${c.url}`))

    const allReminders: Array<{ title: string; completed: boolean; list: string }> = []

    for (const col of collections) {
      const fullUrl = resolveCollectionUrl(homeUrl, col.url)
      console.log(`Fetching reminders from: ${col.name} at ${fullUrl}`)
      const items = await fetchReminders(fullUrl, auth)
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
