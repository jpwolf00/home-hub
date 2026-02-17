import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FRENCH_NEWS_SOURCES = [
  'https://www.lemonde.fr/rss/',
  'https://www.franceinfo.fr/rss'
];

async function fetchWithTimeout(url: string, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'HomeHub/1.0' }
    });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

function extractHeadlines(html: string, sourceName: string): string[] {
  const headlines: string[] = [];
  
  // Match various RSS title patterns
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>([^<]+)<\/title>/gi;
  let match;
  
  while ((match = titleRegex.exec(html)) !== null && headlines.length < 5) {
    const title = match[1] || match[2];
    // Skip RSS channel titles and empty titles
    if (title && 
        !title.includes('CDATA') &&
        title.length > 10 &&
        !title.includes('Le Monde') && 
        !title.includes('France Info') &&
        !title.includes('RSS')) {
      headlines.push(title.trim());
    }
  }
  
  return headlines;
}

export async function GET() {
  const allHeadlines: { source: string; headlines: string[] }[] = [];
  
  for (const source of FRENCH_NEWS_SOURCES) {
    try {
      const res = await fetchWithTimeout(source, 8000);
      const html = await res.text();
      const sourceName = source.includes('lemonde') ? 'Le Monde' : 'France Info';
      const headlines = extractHeadlines(html, sourceName);
      
      if (headlines.length > 0) {
        allHeadlines.push({ source: sourceName, headlines });
      }
    } catch (err) {
      console.error(`Failed to fetch from ${source}:`, err);
    }
  }
  
  // Flatten headlines for display
  const headlines = allHeadlines.flatMap(h => h.headlines).slice(0, 10);
  
  return NextResponse.json({ 
    headlines,
    sources: allHeadlines.map(h => h.source)
  });
}
