import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const FRED_KEY = process.env.FRED_API_KEY
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'

const SERIES = [
  { id: 'BAMLH0A0HYM2', name: 'US High Yield' },
  { id: 'BAMLC0A0CM', name: 'US Inv. Grade' },
  { id: 'BAMLHE00EHY0EY', name: 'European HY' },
  { id: 'BAMLEMHBHYCRPIOAS', name: 'EM High Yield' },
]

async function fetchLatestTwo(seriesId: string): Promise<{ spread: number; change: number; date: string } | null> {
  const url = `${FRED_BASE}?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=10`
  const res = await fetch(url)
  if (!res.ok) return null
  const json = await res.json()
  const obs = (json.observations ?? []) as { value: string; date: string }[]
  const valid = obs.filter((o) => !isNaN(parseFloat(o.value)))
  if (valid.length < 1) return null
  const latest = parseFloat(valid[0].value)
  const prev = valid.length > 1 ? parseFloat(valid[1].value) : latest
  return { spread: latest, change: latest - prev, date: valid[0].date }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data } = await cached('macro:credit-spreads:v1', 3_600_000, async () => {
      const results = await Promise.all(
        SERIES.map(async (s) => {
          const d = await fetchLatestTwo(s.id)
          return { id: s.id, name: s.name, spread: d?.spread ?? null, change: d?.change ?? 0, date: d?.date ?? '' }
        })
      )
      return results
    })
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch credit spreads' })
  }
}
