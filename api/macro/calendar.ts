import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const now = new Date()
  const from = new Date(now)
  from.setDate(from.getDate() - 7)
  const to = new Date(now)
  to.setDate(to.getDate() + 7)

  const fmt = (d: Date) => d.toISOString().split('T')[0]

  try {
    const { data, stale } = await cached('macro:calendar', 300_000, async () => {
      const r = await fetch(
        `https://finnhub.io/api/v1/calendar/economic?from=${fmt(from)}&to=${fmt(to)}&token=${process.env.FINNHUB_API_KEY}`
      )
      if (!r.ok) throw new Error(`Finnhub error: ${r.status}`)
      const json = await r.json()
      return json.economicCalendar ?? []
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch economic calendar' })
  }
}
