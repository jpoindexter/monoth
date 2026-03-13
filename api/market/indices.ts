import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^FTSE', name: 'FTSE 100' },
  { symbol: '^N225', name: 'Nikkei 225' },
  { symbol: '^GDAXI', name: 'DAX' },
  { symbol: '^HSI', name: 'Hang Seng' },
]

async function fetchQuote(symbol: string) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${process.env.FINNHUB_API_KEY}`
  )
  if (!res.ok) throw new Error(`Finnhub error: ${res.status}`)
  return res.json()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('indices', 30_000, async () => {
      const quotes = await Promise.all(
        INDICES.map(async ({ symbol, name }) => {
          const q = await fetchQuote(symbol)
          return {
            symbol, name, price: q.c, change: q.d, changePercent: q.dp,
            high: q.h, low: q.l, open: q.o, previousClose: q.pc,
            timestamp: q.t * 1000, source: 'finnhub',
          }
        })
      )
      return quotes
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch indices' })
  }
}
