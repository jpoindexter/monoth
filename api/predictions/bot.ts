import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const BOT_URL = process.env.BOT_API_URL

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  if (!BOT_URL) {
    return res.json({ positions: [], trades: [], performance: null })
  }

  try {
    const { data } = await cached('bot:snapshot', 15_000, async () => {
      const [posR, tradeR, perfR] = await Promise.all([
        fetch(`${BOT_URL}/api/positions`),
        fetch(`${BOT_URL}/api/trades?period=7d`),
        fetch(`${BOT_URL}/api/performance?period=7d`),
      ])
      const [positions, trades, perfBody] = await Promise.all([
        posR.ok ? posR.json() : [],
        tradeR.ok ? tradeR.json() : [],
        perfR.ok ? perfR.json() : null,
      ])
      const performance = perfBody?.data ?? perfBody ?? null
      return { positions, trades: (trades as unknown[]).slice(0, 20), performance }
    })
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30')
    res.json(data)
  } catch {
    res.json({ positions: [], trades: [], performance: null })
  }
}
