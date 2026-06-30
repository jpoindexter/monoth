import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'
import { wmPost } from '../_wm.js'

interface BalanceSheet {
  name: string
  currency: string
  current: number | null
  peak: number | null
  unit: string
  usdEq: number | null
  qtPace: string | null
  estimated: boolean
}

async function fetchFredSeries(seriesId: string): Promise<{ value: number; date: string } | null> {
  const key = process.env.FRED_API_KEY
  if (!key) return null
  const r = await fetch(
    `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${key}&file_type=json&sort_order=desc&limit=1`,
    { signal: AbortSignal.timeout(8_000) }
  )
  if (!r.ok) return null
  const json = await r.json()
  const obs = json.observations?.[0]
  if (!obs || obs.value === '.') return null
  return { value: parseFloat(obs.value), date: obs.date }
}

async function fetchBalanceSheets(): Promise<BalanceSheet[]> {
  let walclValue: number | null = null
  let ecbValue: number | null = null

  // Primary: proxy batch endpoint
  try {
    const resp = await wmPost<{ results: Record<string, { observations: { date: string; value: number }[] }>; fetched: number }>(
      '/api/economic/v1/get-fred-series-batch',
      { seriesIds: ['WALCL', 'ECBASSETS'], limit: 1 },
    )
    if (resp.fetched > 0) {
      const walclObs = resp.results['WALCL']?.observations
      const ecbObs = resp.results['ECBASSETS']?.observations
      if (walclObs?.length) walclValue = walclObs[walclObs.length - 1]?.value ?? null
      if (ecbObs?.length) ecbValue = ecbObs[ecbObs.length - 1]?.value ?? null
    }
  } catch {
    // Fallback: local FRED key
    const [walcl, ecb] = await Promise.allSettled([
      fetchFredSeries('WALCL'),
      fetchFredSeries('ECBASSETS'),
    ])
    if (walcl.status === 'fulfilled' && walcl.value) walclValue = walcl.value.value
    if (ecb.status === 'fulfilled' && ecb.value) ecbValue = ecb.value.value
  }

  // WALCL is in millions USD -> trillions
  const fedCurrent = walclValue ? Math.round((walclValue / 1_000_000) * 100) / 100 : null

  // ECBASSETS is in billions EUR -> trillions
  const ecbCurrent = ecbValue ? Math.round((ecbValue / 1_000) * 100) / 100 : null
  const estimated = fedCurrent == null && ecbCurrent == null

  return [
    {
      name: 'Fed',
      currency: 'USD',
      current: fedCurrent,
      peak: 8.9,
      unit: 'T',
      usdEq: fedCurrent,
      qtPace: '-$60B/mo',
      estimated: false,
    },
    {
      name: 'ECB',
      currency: 'EUR',
      current: ecbCurrent,
      peak: 8.8,
      unit: 'T',
      usdEq: ecbCurrent ? Math.round(ecbCurrent * 1.08 * 100) / 100 : null,
      qtPace: '-€15B/mo',
      estimated,
    },
    {
      name: 'BoJ',
      currency: 'JPY',
      current: 760,
      peak: 760,
      unit: 'T',
      usdEq: Math.round((760e12 / 150) / 1e12 * 100) / 100,
      qtPace: null,
      estimated: true,
    },
    {
      name: 'BoE',
      currency: 'GBP',
      current: 0.85,
      peak: 1.0,
      unit: 'T',
      usdEq: Math.round(0.85 * 1.27 * 100) / 100,
      qtPace: '-£100B/yr',
      estimated: true,
    },
  ]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('balance-sheets', 3_600_000, fetchBalanceSheets)
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch balance sheet data' })
  }
}
