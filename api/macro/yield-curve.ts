import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const FRED_KEY = 'REDACTED'
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'

const TENORS = [
  { id: 'DGS1MO', tenor: '1M' },
  { id: 'DGS3MO', tenor: '3M' },
  { id: 'DGS6MO', tenor: '6M' },
  { id: 'DGS1', tenor: '1Y' },
  { id: 'DGS2', tenor: '2Y' },
  { id: 'DGS5', tenor: '5Y' },
  { id: 'DGS7', tenor: '7Y' },
  { id: 'DGS10', tenor: '10Y' },
  { id: 'DGS20', tenor: '20Y' },
  { id: 'DGS30', tenor: '30Y' },
]

async function fetchLatest(seriesId: string): Promise<number | null> {
  const url = `${FRED_BASE}?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=5`
  const res = await fetch(url)
  if (!res.ok) return null
  const json = await res.json()
  const obs = (json.observations ?? []) as { value: string; date: string }[]
  for (const o of obs) {
    const v = parseFloat(o.value)
    if (!isNaN(v)) return v
  }
  return null
}

async function fetchSpreadHistory(): Promise<{ date: string; value: number }[]> {
  const url = `${FRED_BASE}?series_id=T10Y2Y&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=30`
  const res = await fetch(url)
  if (!res.ok) return []
  const json = await res.json()
  const obs = (json.observations ?? []) as { value: string; date: string }[]
  return obs
    .filter((o) => !isNaN(parseFloat(o.value)))
    .map((o) => ({ date: o.date, value: parseFloat(o.value) }))
    .reverse()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data } = await cached('macro:yield-curve:v1', 3_600_000, async () => {
      const [rates, spreadHistory] = await Promise.all([
        Promise.all(TENORS.map(async (t) => ({ tenor: t.tenor, rate: await fetchLatest(t.id) }))),
        fetchSpreadHistory(),
      ])
      return { rates, spreadHistory }
    })
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch yield curve data' })
  }
}
