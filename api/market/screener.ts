import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
}

// Yahoo Finance predefined screener IDs
const SCREENS: Record<string, string> = {
  'day-gainers': 'day_gainers',
  'day-losers': 'day_losers',
  'most-active': 'most_actives',
  'undervalued-growth': 'undervalued_growth_stocks',
  'growth-technology': 'growth_technology_stocks',
  'aggressive-small-caps': 'aggressive_small_caps',
  '52w-highs': 'day_gainers', // fallback
  'undervalued-large-caps': 'undervalued_large_caps',
}

interface ScreenerResult {
  symbol: string
  name: string
  price: number | null
  change: number | null
  changePercent: number | null
  volume: number | null
  marketCap: number | null
  peRatio: number | null
}

async function fetchScreen(screenId: string, count = 25): Promise<ScreenerResult[]> {
  const url = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=${screenId}&count=${count}`
  const r = await fetch(url, { headers: YF_HEADERS })
  if (!r.ok) throw new Error(`Yahoo screener error: ${r.status}`)
  const json = await r.json()
  const quotes = json.finance?.result?.[0]?.quotes ?? []
  return quotes.map((q: Record<string, number | string | null>) => ({
    symbol: q.symbol ?? '',
    name: q.longName ?? q.shortName ?? q.symbol ?? '',
    price: (q.regularMarketPrice as number) ?? null,
    change: (q.regularMarketChange as number) ?? null,
    changePercent: (q.regularMarketChangePercent as number) ?? null,
    volume: (q.regularMarketVolume as number) ?? null,
    marketCap: (q.marketCap as number) ?? null,
    peRatio: (q.trailingPE as number) ?? null,
  }))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  const screen = ((req.query.screen as string) ?? 'most-active').toLowerCase()
  const yf_id = SCREENS[screen] ?? 'most_actives'
  try {
    const data = await cached(`screener:${screen}`, 60_000, () => fetchScreen(yf_id))
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    res.json(data.data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch screener data' })
  }
}
