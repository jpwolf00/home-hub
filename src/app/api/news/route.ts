import { NextResponse } from 'next/server'

const RSS_URL = 'https://bullrich.dev/tldr-rss/tech.rss'

export async function GET() {
  try {
    const response = await fetch(RSS_URL, {
      next: { revalidate: 300 } // Cache for 5 minutes
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const xml = await response.text()
    
    // Simple XML parsing for titles
    const titles: string[] = []
    const regex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/g
    let match
    
    while ((match = regex.exec(xml)) !== null && titles.length < 10) {
      const title = match[1] || match[2]
      // Skip channel title and empty titles
      if (title && title !== 'TLDR TECH Feed' && title.trim().length > 0) {
        titles.push(title.trim())
      }
    }
    
    return NextResponse.json(titles)
  } catch (error) {
    console.error('Failed to fetch RSS:', error)
    return NextResponse.json([
      'OpenClaw, OpenAI, and the future',
      'Anthropic closes $30 billion funding round',
      'Waymo extends US robotaxi lead',
      'Google Deep Think AI partners on math',
      'Apple prepares new Siri features'
    ])
  }
}
