import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('movers', 300_000, async () => {
      const r = await fetch(
        `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
      )
      if (!r.ok) throw new Error(`Alpha Vantage error: ${r.status}`)
      const json = await r.json()
      return {
        gainers: (json.top_gainers ?? []).slice(0, 10).map((g: Record<string, string>) => ({
          symbol: g.ticker,
          price: parseFloat(g.price),
          change: parseFloat(g.change_amount),
          changePercent: parseFloat(g.change_percentage?.replace('%', '') ?? '0'),
          volume: parseInt(g.volume ?? '0', 10),
        })),
        losers: (json.top_losers ?? []).slice(0, 10).map((l: Record<string, string>) => ({
          symbol: l.ticker,
          price: parseFloat(l.price),
          change: parseFloat(l.change_amount),
          changePercent: parseFloat(l.change_percentage?.replace('%', '') ?? '0'),
          volume: parseInt(l.volume ?? '0', 10),
        })),
        active: (json.most_actively_traded ?? []).slice(0, 10).map((a: Record<string, string>) => ({
          symbol: a.ticker,
          price: parseFloat(a.price),
          change: parseFloat(a.change_amount),
          changePercent: parseFloat(a.change_percentage?.replace('%', '') ?? '0'),
          volume: parseInt(a.volume ?? '0', 10),
        })),
      }
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch movers' })
  }
}
