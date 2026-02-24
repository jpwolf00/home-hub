import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RSS_URL = 'https://www.lemonde.fr/rss/une.xml';

async function fetchWithHeaders(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml, text/xml',
    }
  });
  return res;
}

function extractHeadlines(xml: string): string[] {
  const headlines: string[] = [];
  
  // Match <title> elements (skip first 2 which are usually channel title)
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>([^<]+)<\/title>/gi;
  let match;
  let count = 0;
  
  while ((match = titleRegex.exec(xml)) !== null && headlines.length < 8) {
    const title = match[1] || match[2];
    // Skip channel title and empty titles
    if (title && title.length > 5 && !title.includes('1jour1actu')) {
      headlines.push(title.trim());
    }
  }
  
  return headlines;
}

export async function GET() {
  try {
    const res = await fetchWithHeaders(RSS_URL);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const xml = await res.text();
    const headlines = extractHeadlines(xml);
    
    if (headlines.length === 0) {
      throw new Error('No headlines extracted');
    }
    
    return NextResponse.json({ 
      headlines,
      source: 'Le Monde'
    });
  } catch (err) {
    console.error('French news fetch error:', err);
    
    // Fallback headlines
    const fallback = [
      "Le président announce une nouvelle politique",
      "La météo prévoit des températures record",
      "Les négociations commerciales à Paris",
      "Une découverte scientifique majeure",
      "Le championship de football débute",
      "Les actions en bourse montent",
      "Le gouvernement présente son budget",
      "Les étudiants manifestent pour le climat"
    ];
    
    return NextResponse.json({ 
      headlines: fallback,
      source: 'Fallback (API Error)'
    });
  }
}
