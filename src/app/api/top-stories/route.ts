import { NextResponse } from 'next/server'

// Top Stories aggregator (RSS, no API keys).
// Returns items with title/link/published/category/image (from RSS when available).

type Story = {
  id: string
  title: string
  link: string
  publishedAt?: string
  category: 'security' | 'tech' | 'ai'
  image?: string
  source?: string
}

const FEEDS: Array<{ category: Story['category']; source: string; url: string }> = [
  // Security
  { category: 'security', source: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/' },
  // General tech
  { category: 'tech', source: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  // AI
  { category: 'ai', source: 'Ars Technica (AI)', url: 'https://arstechnica.com/ai/feed/' },
]

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

function extractFirstUrlFromTag(tagName: string, xml: string): string | undefined {
  // Matches e.g. <media:content url="..." ... /> or <enclosure url="..." .../>
  const re = new RegExp(`<${tagName}[^>]*?url=["']([^"']+)["'][^>]*?>`, 'i')
  const m = xml.match(re)
  return m?.[1]
}

function extractImgFromHtml(html: string): string | undefined {
  const m = html.match(/<img[^>]*?src=["']([^"']+)["'][^>]*?>/i)
  return m?.[1]
}

function extractTag(tag: string, xml: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = xml.match(re)
  return m?.[1]?.trim()
}

function parseRss(xml: string, category: Story['category'], source: string, limit: number): Story[] {
  const items: Story[] = []

  const itemRe = /<item>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml)) !== null && items.length < limit) {
    const itemXml = m[1]

    const rawTitle = extractTag('title', itemXml)
    const rawLink = extractTag('link', itemXml)

    const title = rawTitle ? decodeHtml(rawTitle.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/i, '$1')).trim() : undefined
    const link = rawLink ? decodeHtml(rawLink.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/i, '$1')).trim() : undefined

    if (!title || !link) continue

    const pubDate = extractTag('pubDate', itemXml) || extractTag('published', itemXml)

    // Prefer media:content / enclosure images, then description/content img.
    const image =
      extractFirstUrlFromTag('media:content', itemXml) ||
      extractFirstUrlFromTag('enclosure', itemXml) ||
      (() => {
        const desc = extractTag('description', itemXml) || extractTag('content:encoded', itemXml)
        if (!desc) return undefined
        const cleaned = desc.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/i, '$1')
        return extractImgFromHtml(cleaned)
      })()

    items.push({
      id: `${category}:${link}`,
      title,
      link,
      publishedAt: pubDate ? decodeHtml(pubDate) : undefined,
      category,
      image,
      source,
    })
  }

  return items
}

async function fetchFeed(url: string) {
  const res = await fetch(url, {
    next: { revalidate: 60 * 30 }, // 30 min
    signal: AbortSignal.timeout(12000),
    headers: { 'user-agent': 'home-hub-dashboard/1.0' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = Math.max(1, Math.min(30, Number(searchParams.get('limit') || '18')))

  try {
    const perFeed = Math.max(4, Math.ceil(limit / FEEDS.length))

    const xmls = await Promise.all(
      FEEDS.map(async (f) => ({
        feed: f,
        xml: await fetchFeed(f.url),
      }))
    )

    const combined = xmls.flatMap(({ feed, xml }) => parseRss(xml, feed.category, feed.source, perFeed))

    // Basic de-dupe by link
    const seen = new Set<string>()
    const deduped = combined.filter((s) => {
      if (seen.has(s.link)) return false
      seen.add(s.link)
      return true
    })

    // Not strictly sorted (RSS feeds vary), but keep stable order by category priority
    // so the widget always has a mix.
    const catOrder: Record<Story['category'], number> = { security: 0, tech: 1, ai: 2 }
    deduped.sort((a, b) => catOrder[a.category] - catOrder[b.category])

    return NextResponse.json(deduped.slice(0, limit), {
      headers: {
        'cache-control': 'public, max-age=0, s-maxage=1800, stale-while-revalidate=86400',
      },
    })
  } catch (e: any) {
    console.error('top-stories failed:', e)
    const fallback: Story[] = [
      {
        id: 'tech:fallback',
        title: 'Top stories are loading…',
        link: '#',
        category: 'tech',
        source: 'Home Hub',
      },
    ]
    return NextResponse.json(fallback)
  }
}
