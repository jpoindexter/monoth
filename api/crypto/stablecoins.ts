import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('stablecoins', 300_000, async () => {
      const r = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=tether,usd-coin,dai,first-digital-usd,ethena-usde&order=market_cap_desc&sparkline=false'
      )
      if (!r.ok) throw new Error(`CoinGecko error: ${r.status}`)
      const coins = await r.json()
      return coins.map((c: any) => ({
        id: c.id,
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        price: c.current_price,
        pegDeviation: Math.abs(c.current_price - 1),
        marketCap: c.market_cap,
        volume24h: c.total_volume,
      }))
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch stablecoins' })
  }
}
