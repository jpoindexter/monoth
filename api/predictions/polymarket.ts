import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

interface PolymarketMarket {
  id: string
  question: string
  slug: string
  outcomes: string
  outcomePrices: string
  volume: number
  liquidity: number
  endDate: string
  active: boolean
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    const { data, stale } = await cached('polymarket', 300_000, async () => {
      const url = 'https://gamma-api.polymarket.com/markets?limit=20&active=true&closed=false&order=volume&ascending=false'
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Accept': 'application/json',
        },
      })
      if (!r.ok) throw new Error(`Polymarket error: ${r.status}`)
      const markets: PolymarketMarket[] = await r.json()

      return markets
        .filter((m) => m.active && m.outcomePrices)
        .map((m) => {
          let prices: number[] = []
          try {
            prices = JSON.parse(m.outcomePrices || '[]').map(Number)
          } catch {}
          const yesPrice = prices[0] ?? 0.5
          const yesPct = Math.round(yesPrice * 100)

          return {
            id: m.id,
            title: m.question,
            yesPct,
            noPct: 100 - yesPct,
            volume: m.volume,
            endDate: m.endDate,
          }
        })
        .filter((m) => m.volume > 100)
        .slice(0, 15)
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch predictions' })
  }
}
