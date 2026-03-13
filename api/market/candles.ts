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

  try {
    const { data, stale } = await cached(`candles:${symbol}:${resolution}`, 300_000, async () => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } })
      if (!r.ok) throw new Error(`Yahoo Finance error: ${r.status}`)
      const json = await r.json()
      const result = json.chart?.result?.[0]
      if (!result) return []
      const timestamps: number[] = result.timestamp ?? []
      const q = result.indicators?.quote?.[0] ?? {}
      return timestamps
        .map((ts: number, i: number) => ({
          time: new Date(ts * 1000).toISOString().split('T')[0],
          open: q.open?.[i],
          high: q.high?.[i],
          low: q.low?.[i],
          close: q.close?.[i],
          value: q.close?.[i],
        }))
        .filter((c: { close: number | null | undefined }) => c.close != null)
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch candles' })
  }
}
