import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const now = new Date()
  const from = new Date(now)
  from.setDate(from.getDate() - 3)
  const to = new Date(now)
  to.setDate(to.getDate() + 14)
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  try {
    const { data, stale } = await cached('market:earnings', 600_000, async () => {
      const r = await fetch(
        `https://finnhub.io/api/v1/calendar/earnings?from=${fmt(from)}&to=${fmt(to)}&token=${process.env.FINNHUB_API_KEY}`
      )
      if (!r.ok) throw new Error(`Finnhub error: ${r.status}`)
      const json = await r.json()
      return (json.earningsCalendar ?? []).slice(0, 30)
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch earnings calendar' })
  }
}
