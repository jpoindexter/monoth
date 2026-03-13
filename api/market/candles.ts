import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const symbol = (req.query.symbol as string)?.toUpperCase()
  const resolution = (req.query.resolution as string) || 'D'

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol required' })
  }

  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const { data, stale } = await cached(`candles:${symbol}:${resolution}`, 300_000, async () => {
      const to = Math.floor(Date.now() / 1000)
      const from = to - 90 * 86400 // 90 days

      const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`
      const r = await fetch(url)
      if (!r.ok) throw new Error(`Finnhub error: ${r.status}`)
      const json = await r.json()

      if (json.s !== 'ok' || !json.c) return []

      return json.c.map((close: number, i: number) => ({
        time: new Date(json.t[i] * 1000).toISOString().slice(0, 10),
        open: json.o[i],
        high: json.h[i],
        low: json.l[i],
        close: json.c[i],
        value: json.c[i],
      }))
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch candles' })
  }
}
