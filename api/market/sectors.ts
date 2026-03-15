import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'
import { wmGet } from '../_wm.js'

const SECTOR_NAMES: Record<string, string> = {
  XLK: 'Technology',
  XLF: 'Financials',
  XLV: 'Health Care',
  XLE: 'Energy',
  XLI: 'Industrials',
  XLY: 'Consumer Discretionary',
  XLP: 'Consumer Staples',
  XLU: 'Utilities',
  XLB: 'Materials',
  XLRE: 'Real Estate',
  XLC: 'Communication Services',
}

const SECTOR_ETFS = Object.keys(SECTOR_NAMES)

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('sectors', 120_000, async () => {
      // Primary: worldmonitor (Finnhub + Yahoo, cached 10min server-side)
      try {
        const resp = await wmGet<{ sectors: { symbol: string; name: string; change: number }[] }>(
          '/api/market/v1/get-sector-summary',
          { period: 'day' },
        )
        if (resp.sectors?.length) {
          return resp.sectors.map(s => ({
            symbol: s.symbol,
            name: SECTOR_NAMES[s.symbol] ?? s.name,
            price: 0,
            change: 0,
            changePercent: s.change,
          }))
        }
      } catch (e) {
      }

      // Fallback: direct Yahoo Finance (11 sequential calls)
      return Promise.all(SECTOR_ETFS.map(async (symbol) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
        const r = await fetch(url, { headers: YF_HEADERS })
        if (!r.ok) throw new Error(`Yahoo Finance error: ${r.status}`)
        const json = await r.json()
        const meta = json.chart?.result?.[0]?.meta
        if (!meta) throw new Error('No data')
        const price = meta.regularMarketPrice
        const prevClose = meta.regularMarketPreviousClose ?? meta.chartPreviousClose
        const change = price - prevClose
        const changePercent = (change / prevClose) * 100
        return { symbol, name: SECTOR_NAMES[symbol] ?? symbol, price, change, changePercent }
      }))
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch sector data' })
  }
}
