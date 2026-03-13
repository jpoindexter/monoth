import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const SECTOR_ETFS = [
  { symbol: 'XLK', name: 'Technology' },
  { symbol: 'XLF', name: 'Financials' },
  { symbol: 'XLV', name: 'Health Care' },
  { symbol: 'XLE', name: 'Energy' },
  { symbol: 'XLI', name: 'Industrials' },
  { symbol: 'XLY', name: 'Consumer Discretionary' },
  { symbol: 'XLP', name: 'Consumer Staples' },
  { symbol: 'XLU', name: 'Utilities' },
  { symbol: 'XLB', name: 'Materials' },
  { symbol: 'XLRE', name: 'Real Estate' },
  { symbol: 'XLC', name: 'Communication Services' },
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('sectors', 60_000, async () => {
      const symbols = SECTOR_ETFS.map((s) => s.symbol).join(',')
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=symbol,regularMarketPrice,regularMarketChange,regularMarketChangePercent`
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } })
      if (!r.ok) throw new Error(`Yahoo Finance error: ${r.status}`)
      const json = await r.json()
      const resultMap = new Map((json.quoteResponse?.result ?? []).map((q: Record<string, unknown>) => [q.symbol, q]))
      return SECTOR_ETFS.map(({ symbol, name }) => {
        const q = resultMap.get(symbol) as Record<string, number> | undefined
        return { symbol, name, price: q?.regularMarketPrice, change: q?.regularMarketChange, changePercent: q?.regularMarketChangePercent }
      })
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch sector data' })
  }
}
