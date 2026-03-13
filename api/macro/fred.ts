import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const DEFAULT_SERIES = ['CPIAUCSL', 'GDP', 'UNRATE', 'FEDFUNDS', 'DGS10', 'DGS2', 'DGS30', 'DTWEXBGS']

const SERIES_NAMES: Record<string, string> = {
  CPIAUCSL: 'CPI',
  GDP: 'GDP',
  UNRATE: 'Unemployment Rate',
  FEDFUNDS: 'Fed Funds Rate',
  DGS10: '10Y Treasury',
  DGS2: '2Y Treasury',
  DGS30: '30Y Treasury',
  DTWEXBGS: 'Dollar Index',
}

async function fetchSeries(seriesId: string) {
  const r = await fetch(
    `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${process.env.FRED_API_KEY}&file_type=json&sort_order=desc&limit=2`
  )
  if (!r.ok) throw new Error(`FRED error: ${r.status}`)
  const json = await r.json()
  const obs = json.observations ?? []
  const latest = obs[0]
  const previous = obs[1]
  return {
    seriesId,
    name: SERIES_NAMES[seriesId] ?? seriesId,
    value: parseFloat(latest?.value ?? '0'),
    previous: parseFloat(previous?.value ?? '0'),
    date: latest?.date ?? '',
    change: parseFloat(latest?.value ?? '0') - parseFloat(previous?.value ?? '0'),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  const seriesParam = req.query.series as string | undefined
  const seriesIds = seriesParam ? seriesParam.split(',').filter(Boolean) : DEFAULT_SERIES

  try {
    const { data, stale } = await cached(`fred:${seriesIds.join(',')}`, 3_600_000, async () => {
      return Promise.all(seriesIds.map(fetchSeries))
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch FRED data' })
  }
}
