import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

interface CorrelationEvent {
  id: string
  indicator: string
  country: string
  actual: number
  expected: number
  previous: number
  surprise: number
  impact: 'high' | 'medium' | 'low'
  timestamp: number
  unit: string
}

function mapImpact(impact: string): 'high' | 'medium' | 'low' {
  const s = (impact ?? '').toLowerCase()
  if (s === 'high' || s === '3') return 'high'
  if (s === 'medium' || s === '2') return 'medium'
  return 'low'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    const { data, stale } = await cached('correlation:events', 300_000, async () => {
      const now = new Date()
      const from = new Date(now)
      from.setDate(from.getDate() - 30)
      const fmt = (d: Date) => d.toISOString().split('T')[0]

      const r = await fetch(
        `https://finnhub.io/api/v1/calendar/economic?from=${fmt(from)}&to=${fmt(now)}&token=${process.env.FINNHUB_API_KEY}`
      )
      if (!r.ok) return []
      const json = await r.json()
      if (json.error) return []
      const cal = json.economicCalendar
      const events: Record<string, unknown>[] = Array.isArray(cal) ? cal : cal?.result ?? []

      const filtered: CorrelationEvent[] = events
        .filter((e) => e.actual != null && e.estimate != null && e.actual !== '' && e.estimate !== '')
        .map((e, i) => {
          const actual = Number(e.actual)
          const expected = Number(e.estimate)
          const previous = Number(e.prev ?? 0)
          return {
            id: `${e.event ?? i}-${e.time ?? i}`,
            indicator: String(e.event ?? ''),
            country: String(e.country ?? ''),
            actual,
            expected,
            previous,
            surprise: actual - expected,
            impact: mapImpact(String(e.impact ?? '')),
            timestamp: e.time ? new Date(String(e.time)).getTime() : Date.now(),
            unit: String(e.unit ?? ''),
          }
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20)

      return filtered
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch correlation events' })
  }
}
