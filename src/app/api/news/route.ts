import { NextResponse } from 'next/server'

const FEEDS = [
  // NYT World News - fresh, reliable
  'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  // NBC News for variety
  'https://feeds.nbcnews.com/nbcnews/topheads',
]

// Cache news for 3 minutes
let cache: { data: string[]; timestamp: number } | null = null
const CACHE_TTL = 180000 // 3 minutes

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

function extractTitles(xml: string, max: number) {
  const titles: string[] = []
  const itemRe = /<item>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null

  while ((m = itemRe.exec(xml)) !== null && titles.length < max) {
    const itemXml = m[1]
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i)
    if (!titleMatch) continue
    const raw = titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/i, '$1')
    const title = decodeHtml(raw).trim()
    if (title) titles.push(title)
  }

  return titles
}

export async function GET() {
  const now = Date.now()

  if (cache && now - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data)
  }

  try {
    const settled = await Promise.allSettled(
      FEEDS.map(async (url) => {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(10000),
          next: { revalidate: 60 * 5 },
          headers: { 'user-agent': 'home-hub-dashboard/1.0' },
        })
        if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
        return response.text()
      })
    )

    const xmls = settled
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map((r) => r.value)

    if (xmls.length === 0) throw new Error('All breaking RSS sources failed')

    const merged = xmls.flatMap((xml) => extractTitles(xml, 10))

    // De-dupe while keeping order
    const seen = new Set<string>()
    const titles = merged.filter((t) => {
      if (seen.has(t)) return false
      seen.add(t)
      return true
    })

    const out = titles.slice(0, 15)
    cache = { data: out, timestamp: now }
    return NextResponse.json(out)
  } catch (error) {
    console.error('Failed to fetch breaking RSS:', error)
    return NextResponse.json([
      'Breaking: news feed temporarily unavailable',
      'Reuters/AP will resume shortly',
    ])
  }
}
