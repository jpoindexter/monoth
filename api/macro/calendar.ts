import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

interface FFEvent {
  title: string
  country: string
  date: string       // ISO datetime e.g. "2025-03-07T13:30:00-0500"
  impact: string     // "High" | "Medium" | "Low" | "Holiday"
  forecast: string   // may be empty string
  previous: string   // may be empty string
  actual: string     // may be empty string
}

interface EconEvent {
  id: string
  event: string
  country: string
  date: string       // YYYY-MM-DD
  time: string       // HH:MM
  impact: 'high' | 'medium' | 'low'
  actual: string | null
  estimate: string | null
  previous: string | null
}

const COUNTRY_MAP: Record<string, string> = {
  USD: 'US', EUR: 'EU', GBP: 'GB', JPY: 'JP', CAD: 'CA',
  AUD: 'AU', NZD: 'NZ', CHF: 'CH', CNY: 'CN',
}

function mapImpact(s: string): 'high' | 'medium' | 'low' {
  const l = s.toLowerCase()
  if (l === 'high') return 'high'
  if (l === 'medium' || l === 'moderate') return 'medium'
  return 'low'
}

function orNull(s: string): string | null {
  return s && s.trim() !== '' ? s.trim() : null
}

function mapEvent(e: FFEvent, idx: number): EconEvent | null {
  if (!e.date || !e.title) return null
  const dt = new Date(e.date)
  if (isNaN(dt.getTime())) return null

  // Convert to ET (UTC-5 / UTC-4 DST) — ForexFactory timestamps include offset
  const date = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })  // YYYY-MM-DD
  const time = dt.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false })

  const country = COUNTRY_MAP[e.country] ?? e.country

  return {
    id: `ff-${e.country}-${idx}`,
    event: e.title,
    country,
    date,
    time,
    impact: mapImpact(e.impact),
    actual: orNull(e.actual),
    estimate: orNull(e.forecast),
    previous: orNull(e.previous),
  }
}

async function fetchFF(week: 'thisweek' | 'nextweek'): Promise<FFEvent[]> {
  const url = `https://nfs.faireconomy.media/ff_calendar_${week}.json?version=1`
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MonothDashboard/1.0)' },
    signal: AbortSignal.timeout(8_000),
  })
  if (!r.ok) throw new Error(`ForexFactory ${week}: ${r.status}`)
  return r.json() as Promise<FFEvent[]>
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const { data } = await cached('macro:calendar', 1_800_000, async () => {
    const [thisWeek, nextWeek] = await Promise.allSettled([
      fetchFF('thisweek'),
      fetchFF('nextweek'),
    ])

    const raw: FFEvent[] = [
      ...(thisWeek.status === 'fulfilled' ? thisWeek.value : []),
      ...(nextWeek.status === 'fulfilled' ? nextWeek.value : []),
    ]

    if (raw.length === 0) throw new Error('No calendar data from ForexFactory')

    const events: EconEvent[] = raw
      .map((e, i) => mapEvent(e, i))
      .filter((e): e is EconEvent => e !== null)
      // Only US, EU, GB events (most relevant for equity traders)
      .filter(e => ['US', 'EU', 'GB'].includes(e.country))
      // Drop "Holiday" impact (low) — keep medium and high
      .filter(e => e.impact !== 'low' || e.event.toLowerCase().includes('holiday'))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

    return events
  })

  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
  res.json(data)
}
