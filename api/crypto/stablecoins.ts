import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'
import { wmGet } from '../_wm.js'

const STABLECOIN_IDS = [
  'tether', 'usd-coin', 'dai', 'first-digital-usd', 'ethena-usde',
  'frax', 'true-usd', 'pax-dollar', 'usdp', 'gemini-dollar',
]

interface CoinGeckoMarket {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap: number
  total_volume: number
}

interface WmStablecoin {
  id: string
  symbol: string
  name: string
  price: number
  deviation: number // absolute deviation from peg
  pegStatus: string
  marketCap: number
  volume24h: number
  change24h: number
  change7d: number
  image: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('stablecoins', 300_000, async () => {
      // Primary: proxy API
      try {
        const resp = await wmGet<{ stablecoins: WmStablecoin[] }>(
          '/api/market/v1/list-stablecoin-markets',
          { coins: STABLECOIN_IDS },
        )
        if (resp.stablecoins?.length) {
          return resp.stablecoins.map(s => ({
            id: s.id,
            symbol: s.symbol.toUpperCase(),
            name: s.name,
            price: s.price,
            pegDeviation: s.deviation, // WM deviation is absolute (e.g. 0.001)
            marketCap: s.marketCap,
            volume24h: s.volume24h,
          }))
        }
      } catch (e) {
      }

      // Fallback: CoinGecko free tier
      const r = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=tether,usd-coin,dai,first-digital-usd,ethena-usde&order=market_cap_desc&sparkline=false',
        { signal: AbortSignal.timeout(10_000) }
      )
      if (!r.ok) throw new Error(`CoinGecko error: ${r.status}`)
      const coins = await r.json()
      return coins.map((c: CoinGeckoMarket) => ({
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
