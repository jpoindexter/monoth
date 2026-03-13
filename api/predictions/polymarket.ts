import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

interface PolymarketEvent {
  id: string
  title: string
  slug: string
  outcomes: string[]
  outcomePrices: string // JSON string of prices array
  volume: number
  liquidity: number
  endDate: string
  active: boolean
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    const { data, stale } = await cached('polymarket', 300_000, async () => {
      const url = 'https://gamma-api.polymarket.com/events?limit=20&active=true&closed=false&order=volume&ascending=false&tag=Politics,Economics,Crypto,Finance'
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Accept': 'application/json',
        },
      })
      if (!r.ok) throw new Error(`Polymarket error: ${r.status}`)
      const events: PolymarketEvent[] = await r.json()

      return events
        .filter((e) => e.active && e.outcomes?.length >= 2)
        .map((e) => {
          let prices: number[] = []
          try {
            prices = JSON.parse(e.outcomePrices || '[]').map(Number)
          } catch {}
          const yesPrice = prices[0] ?? 0.5
          const yesPct = Math.round(yesPrice * 100)

          return {
            id: e.id,
            title: e.title,
            yesPct,
            noPct: 100 - yesPct,
            volume: e.volume,
            endDate: e.endDate,
          }
        })
        .slice(0, 15)
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch predictions' })
  }
}
