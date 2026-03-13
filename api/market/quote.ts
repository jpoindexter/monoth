import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors'
import { cached } from '../_cache'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  const symbols = (req.query.symbols as string)?.split(',').filter(Boolean) ?? []
  if (!symbols.length) return res.status(400).json({ error: 'symbols param required' })
  try {
    const quotes = await Promise.all(
      symbols.map((symbol) =>
        cached(`quote:${symbol}`, 30_000, async () => {
          const r = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${process.env.FINNHUB_API_KEY}`
          )
          if (!r.ok) throw new Error(`Finnhub error: ${r.status}`)
          const q = await r.json()
          return {
            symbol, price: q.c, change: q.d, changePercent: q.dp,
            volume: 0, timestamp: q.t * 1000, source: 'finnhub',
          }
        })
      )
    )
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    res.json(quotes.map((q) => q.data))
  } catch {
    res.status(500).json({ error: 'Failed to fetch quotes' })
  }
}
