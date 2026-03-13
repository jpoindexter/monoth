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

const HARDCODED_EVENTS: CorrelationEvent[] = [
  {
    id: 'nfp-2025-02',
    indicator: 'Non-Farm Payrolls',
    country: 'US',
    actual: 151,
    expected: 170,
    previous: 256,
    surprise: -19,
    impact: 'high',
    timestamp: new Date('2025-03-07T13:30:00Z').getTime(),
    unit: 'K',
  },
  {
    id: 'cpi-2025-02',
    indicator: 'CPI (YoY)',
    country: 'US',
    actual: 2.8,
    expected: 2.9,
    previous: 3.0,
    surprise: -0.1,
    impact: 'high',
    timestamp: new Date('2025-03-12T12:30:00Z').getTime(),
    unit: '%',
  },
  {
    id: 'unrate-2025-02',
    indicator: 'Unemployment Rate',
    country: 'US',
    actual: 4.1,
    expected: 4.0,
    previous: 4.0,
    surprise: 0.1,
    impact: 'high',
    timestamp: new Date('2025-03-07T13:30:00Z').getTime(),
    unit: '%',
  },
  {
    id: 'pce-2025-01',
    indicator: 'Core PCE (YoY)',
    country: 'US',
    actual: 2.6,
    expected: 2.6,
    previous: 2.8,
    surprise: 0,
    impact: 'high',
    timestamp: new Date('2025-02-28T13:30:00Z').getTime(),
    unit: '%',
  },
  {
    id: 'fedfunds-2025-01',
    indicator: 'Fed Funds Rate',
    country: 'US',
    actual: 4.33,
    expected: 4.33,
    previous: 4.33,
    surprise: 0,
    impact: 'high',
    timestamp: new Date('2025-01-29T19:00:00Z').getTime(),
    unit: '%',
  },
  {
    id: 'gdp-2024-q4',
    indicator: 'GDP Growth Rate (QoQ)',
    country: 'US',
    actual: 2.3,
    expected: 2.6,
    previous: 3.1,
    surprise: -0.3,
    impact: 'high',
    timestamp: new Date('2025-01-30T13:30:00Z').getTime(),
    unit: '%',
  },
  {
    id: 'retail-2025-01',
    indicator: 'Retail Sales (MoM)',
    country: 'US',
    actual: -0.9,
    expected: -0.1,
    previous: 0.7,
    surprise: -0.8,
    impact: 'high',
    timestamp: new Date('2025-02-14T13:30:00Z').getTime(),
    unit: '%',
  },
]

const FRED_SERIES: { id: string; indicator: string; impact: 'high' | 'medium' | 'low'; unit: string }[] = [
  { id: 'UNRATE', indicator: 'Unemployment Rate', impact: 'high', unit: '%' },
  { id: 'CPIAUCSL', indicator: 'CPI (YoY)', impact: 'high', unit: '%' },
  { id: 'PAYEMS', indicator: 'Non-Farm Payrolls', impact: 'high', unit: 'K' },
  { id: 'FEDFUNDS', indicator: 'Fed Funds Rate', impact: 'high', unit: '%' },
]

async function fetchFred(seriesId: string, apiKey: string): Promise<{ value: number; date: string }[]> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&limit=3&sort_order=desc&api_key=${apiKey}&file_type=json`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`FRED error ${r.status}`)
  const json = await r.json()
  return (json.observations ?? [])
    .filter((o: Record<string, string>) => o.value !== '.')
    .map((o: Record<string, string>) => ({ value: Number(o.value), date: o.date }))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    const { data, stale } = await cached('correlation:events', 300_000, async () => {
      const apiKey = process.env.FRED_API_KEY
      if (!apiKey) return HARDCODED_EVENTS

      const results = await Promise.allSettled(
        FRED_SERIES.map(async (s) => {
          const obs = await fetchFred(s.id, apiKey)
          if (obs.length < 2) return null
          const [latest, prev] = obs
          const surprise = latest.value - prev.value
          return {
            id: `${s.id}-${latest.date}`,
            indicator: s.indicator,
            country: 'US',
            actual: latest.value,
            expected: prev.value,
            previous: obs[2]?.value ?? prev.value,
            surprise,
            impact: s.impact,
            timestamp: new Date(latest.date).getTime(),
            unit: s.unit,
          } as CorrelationEvent
        })
      )

      const events: CorrelationEvent[] = results
        .filter((r): r is PromiseFulfilledResult<CorrelationEvent | null> => r.status === 'fulfilled' && r.value !== null)
        .map((r) => r.value!)
        .sort((a, b) => b.timestamp - a.timestamp)

      return events.length ? events : HARDCODED_EVENTS
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch correlation events' })
  }
}
