import { NextResponse } from 'next/server'

const RSS_URL = 'https://bullrich.dev/tldr-rss/tech.rss'

export async function GET() {
  try {
    const response = await fetch(RSS_URL, { next: { revalidate: 300 } })
    const text = await response.text()
    
    // Simple RSS parsing - extract titles
    const items: string[] = []
    const regex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/g
    let match
    let count = 0
    
    while ((match = regex.exec(text)) !== null && count < 15) {
      const title = match[1] || match[2]
      // Skip RSS channel title
      if (title && !title.includes('TLDR') && title.length > 10) {
        items.push(title.toUpperCase())
        count++
      }
    }
    
    return NextResponse.json({ items })
  } catch (error) {
    console.error('News fetch error:', error)
    return NextResponse.json({ items: [] }, { status: 500 })
  }
}
