import { NextResponse } from 'next/server';

// Free, no-key data source: Stooq CSV endpoints.
// Notes:
// - Stooq symbol formats vary. For common US tickers, `TICKER.US` usually works.
// - Data is end-of-day-ish; perfect for a dashboard that doesn't need real-time.

const DEFAULT_SYMBOLS = ['SPY', 'QQQ', 'DIA']; // S&P 500, Nasdaq 100, Dow Jones (via DIA)

const SYMBOL_OVERRIDES: Record<string, string> = {
  // Indices via liquid ETFs (more consistent than index symbols across providers)
  DOW: 'DIA',
  NASDAQ: 'QQQ',
  SP500: 'SPY',
  'S&P500': 'SPY',
};

function normalizeToStooqSymbol(symbol: string): { display: string; stooq: string } {
  const raw = symbol.trim();
  const upper = raw.toUpperCase();

  const mapped = SYMBOL_OVERRIDES[upper] ?? upper;

  // Stooq expects lowercase symbols.
  // Try to keep dots (e.g. BRK.B) because stooq commonly uses them.
  const cleaned = mapped
    .replace(/\s+/g, '')
    .replace(/^\^/, '')
    .toLowerCase();

  // If user already supplied a suffix like .us, keep it.
  const stooq = cleaned.includes('.') ? cleaned : `${cleaned}.us`;

  return { display: mapped, stooq };
}

async function fetchDailySeries(stooqSymbol: string) {
  // Daily candles CSV
  // Example: https://stooq.com/q/d/l/?s=spy.us&i=d
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol)}&i=d`;

  const res = await fetch(url, {
    // Cache server-side; we don't need frequent updates
    next: { revalidate: 60 * 60 }, // 1 hour
    headers: {
      'user-agent': 'home-hub-dashboard/1.0',
    },
  });

  if (!res.ok) throw new Error(`Stooq fetch failed (${res.status}) for ${stooqSymbol}`);
  const text = await res.text();

  // CSV format: Date,Open,High,Low,Close,Volume
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 3) throw new Error(`Not enough data for ${stooqSymbol}`);

  const header = lines[0].toLowerCase();
  if (!header.includes('date') || !header.includes('close')) {
    throw new Error(`Unexpected CSV header for ${stooqSymbol}`);
  }

  const rows = lines
    .slice(1)
    .map((line) => line.split(','))
    .filter((cols) => cols.length >= 5)
    .map((cols) => ({
      date: cols[0],
      close: Number(cols[4]),
    }))
    .filter((r) => Number.isFinite(r.close));

  if (rows.length < 2) throw new Error(`Not enough parsed rows for ${stooqSymbol}`);

  return rows;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const symbolsParam = searchParams.get('symbols');
  const symbols = (symbolsParam ? symbolsParam.split(',') : DEFAULT_SYMBOLS)
    .map((s) => s.trim())
    .filter(Boolean);

  const results = await Promise.all(
    symbols.map(async (sym) => {
      const { display, stooq } = normalizeToStooqSymbol(sym);
      try {
        const rows = await fetchDailySeries(stooq);
        const last = rows[rows.length - 1];
        const prev = rows[rows.length - 2];
        const price = last.close;
        const changePct = prev.close ? ((last.close - prev.close) / prev.close) * 100 : 0;

        // Keep a small series for potential sparklines (last 30 closes)
        const series = rows.slice(-30).map((r) => r.close);

        return {
          symbol: display,
          price,
          changePct,
          asOf: last.date,
          series,
          source: 'stooq',
        };
      } catch (e: any) {
        return {
          symbol: display,
          error: e?.message ?? String(e),
          source: 'stooq',
        };
      }
    })
  );

  return NextResponse.json(results, {
    headers: {
      // Extra edge caching hint (in addition to Next revalidate)
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
