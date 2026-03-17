import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const FRED_KEY = process.env.FRED_API_KEY
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'

const SERIES = [
  { id: 'M2SL', name: 'US M2 Money Supply', unit: 'B USD' },
  { id: 'WRESBAL', name: 'Reserve Balances', unit: 'B USD' },
  { id: 'RRPONTSYD', name: 'Overnight RRP', unit: 'B USD' },
  { id: 'H41RESPPALBNWW', name: 'Fed Balance Sheet', unit: 'M USD' },
]

async function fetchSeries(seriesId: string, limit = 24): Promise<{ date: string; value: number }[]> {
  const url = `${FRED_BASE}?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=${limit}`
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
    const { data } = await cached('macro:m2:v1', 3_600_000, async () => {
      const results = await Promise.all(
        SERIES.map(async (s) => {
          const values = await fetchSeries(s.id, 24)
          return { id: s.id, name: s.name, unit: s.unit, values }
        })
      )
      return results
    })
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch M2 liquidity data' })
  }
}
