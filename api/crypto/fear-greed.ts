import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors'
import { cached } from '../_cache'

const STABLE_SYMBOLS = ['usdt', 'usdc', 'busd', 'dai', 'tusd', 'usdp', 'usdd', 'frax', 'lusd', 'gusd', 'susd', 'fei', 'husd', 'ustc']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    const { data } = await cached('fear-greed', 300_000, async () => {
      const [fngRes, globalRes] = await Promise.all([
        fetch('https://api.alternative.me/fng/?limit=7&format=json'),
        fetch('https://api.coingecko.com/api/v3/global'),
      ])

      if (!fngRes.ok) throw new Error('FNG fetch failed')
      if (!globalRes.ok) throw new Error('Global fetch failed')

      const fng = await fngRes.json()
      const global = await globalRes.json()

      const current = fng.data[0]
      const history = fng.data.map((d: { value: string; value_classification: string; timestamp: string }) => ({
        value: parseInt(d.value, 10),
        classification: d.value_classification,
        date: new Date(parseInt(d.timestamp, 10) * 1000).toISOString().slice(0, 10),
      }))

      const mcapPct: Record<string, number> = global.data?.market_cap_percentage ?? {}
      const btc = mcapPct['btc'] ?? 0
      const eth = mcapPct['eth'] ?? 0
      const stable = Object.entries(mcapPct)
        .filter(([sym]) => STABLE_SYMBOLS.includes(sym.toLowerCase()))
        .reduce((sum, [, pct]) => sum + pct, 0)
      const other = Math.max(0, 100 - btc - eth - stable)

      return {
        fearGreed: {
          value: parseInt(current.value, 10),
          classification: current.value_classification,
          history,
        },
        dominance: { btc, eth, stable, other },
      }
    })

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}
