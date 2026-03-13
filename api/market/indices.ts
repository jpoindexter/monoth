import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const INDICES = [
  { symbol: 'SPY', name: 'S&P 500' },
  { symbol: 'QQQ', name: 'NASDAQ' },
  { symbol: 'DIA', name: 'Dow Jones' },
  { symbol: 'EFA', name: 'Intl Developed' },
  { symbol: 'EEM', name: 'Emerging Markets' },
  { symbol: 'IWM', name: 'Russell 2000' },
  { symbol: 'VTI', name: 'Total Market' },
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('indices', 30_000, async () => {
      const symbols = INDICES.map((i) => i.symbol).join(',')
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=symbol,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketDayHigh,regularMarketDayLow,regularMarketOpen,regularMarketPreviousClose`
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } })
      if (!r.ok) throw new Error(`Yahoo Finance error: ${r.status}`)
      const json = await r.json()
      const resultMap = new Map((json.quoteResponse?.result ?? []).map((q: Record<string, unknown>) => [q.symbol, q]))
      return INDICES.map(({ symbol, name }) => {
        const q = resultMap.get(symbol) as Record<string, number> | undefined
        return {
          symbol, name,
          price: q?.regularMarketPrice ?? null,
          change: q?.regularMarketChange ?? 0,
          changePercent: q?.regularMarketChangePercent ?? 0,
          high: q?.regularMarketDayHigh,
          low: q?.regularMarketDayLow,
          open: q?.regularMarketOpen,
          previousClose: q?.regularMarketPreviousClose,
          timestamp: Date.now(),
          source: 'yahoo',
        }
      })
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch indices' })
  }
}
