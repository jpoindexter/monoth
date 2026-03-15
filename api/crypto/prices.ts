import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'
import { wmGet } from '../_wm.js'

// Top crypto IDs matching worldmonitor's crypto.json (CoinGecko IDs)
const CRYPTO_IDS = [
  'bitcoin', 'ethereum', 'tether', 'binancecoin', 'ripple', 'solana', 'usd-coin',
  'dogecoin', 'cardano', 'tron', 'avalanche-2', 'chainlink', 'polkadot', 'polygon',
  'litecoin', 'wrapped-bitcoin', 'dai', 'uniswap', 'cosmos', 'ethereum-classic',
  'monero', 'stellar', 'bitcoin-cash', 'algorand', 'near', 'internet-computer',
  'filecoin', 'lido-dao', 'shiba-inu', 'pepe',
]

interface WmCryptoQuote {
  name: string
  symbol: string
  price: number
  change: number // percent 24h
  sparkline: number[]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('crypto-top50', 120_000, async () => {
      // Primary: CoinGecko top 50 by market cap (full data: rank, marketCap, volume, sparkline)
      try {
        const r = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h',
          { signal: AbortSignal.timeout(10_000) }
        )
        if (r.ok) {
          const coins = await r.json()
          if (Array.isArray(coins) && coins.length) {
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
              sparkline: c.sparkline_in_7d?.price
                ? c.sparkline_in_7d.price.filter((_: number, i: number) => i % 24 === 0)
                : undefined,
            }))
          }
        }
      } catch {}

      // Fallback: worldmonitor (pro CoinGecko key + CoinPaprika fallback, no rank/marketCap)
      const resp = await wmGet<{ quotes: WmCryptoQuote[] }>(
        '/api/market/v1/list-crypto-quotes',
        { ids: CRYPTO_IDS },
      )
      return (resp.quotes ?? []).map((q, i) => ({
        id: q.symbol.toLowerCase(),
        symbol: q.symbol.toUpperCase(),
        name: q.name,
        price: q.price,
        change24h: 0,
        changePercent24h: q.change,
        marketCap: 0,
        volume24h: 0,
        rank: i + 1,
        sparkline: q.sparkline?.filter((_: number, i: number) => i % 24 === 0),
      }))
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch crypto prices' })
  }
}
