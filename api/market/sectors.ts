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
      const quotes = await Promise.all(
        SECTOR_ETFS.map(async ({ symbol, name }) => {
          const r = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
          )
          const q = await r.json()
          return { symbol, name, price: q.c, change: q.d, changePercent: q.dp }
        })
      )
      return quotes
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch sector data' })
  }
}
