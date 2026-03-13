import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors'
import { cached } from '../_cache'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('crypto-top50', 60_000, async () => {
      const r = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h'
      )
      if (!r.ok) throw new Error(`CoinGecko error: ${r.status}`)
      const coins = await r.json()
      return coins.map((c: any) => ({
        id: c.id,
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        price: c.current_price,
        change24h: c.price_change_24h,
        changePercent24h: c.price_change_percentage_24h,
        marketCap: c.market_cap,
        volume24h: c.total_volume,
        rank: c.market_cap_rank,
      }))
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch crypto prices' })
  }
}
