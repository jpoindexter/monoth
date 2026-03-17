import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'
import { wmPost } from '../_wm.js'

const DEFAULT_SERIES = ['CPIAUCSL', 'GDP', 'UNRATE', 'FEDFUNDS', 'DGS10', 'DGS2', 'DGS30', 'DTWEXBGS']

const SERIES_NAMES: Record<string, string> = {
  CPIAUCSL: 'CPI',
  GDP: 'GDP',
  UNRATE: 'Unemployment Rate',
  FEDFUNDS: 'Fed Funds Rate',
  DGS10: '10Y Treasury',
  DGS2: '2Y Treasury',
  DGS30: '30Y Treasury',
  DGS5: '5Y Treasury',
  DGS3MO: '3M Treasury',
  DGS6MO: '6M Treasury',
  DGS1MO: '1M Treasury',
  DGS1: '1Y Treasury',
  DTWEXBGS: 'Dollar Index',
  WALCL: 'Fed Balance Sheet',
  T10Y2Y: 'Yield Curve (10Y-2Y)',
  VIXCLS: 'VIX',
  M2SL: 'M2 Money Supply',
}

// Yahoo Finance tickers that map to FRED treasury series (local fallback)
const YF_FALLBACK: Record<string, string> = {
  DGS10: '^TNX',
  DGS30: '^TYX',
  DGS5: '^FVX',
  DGS3MO: '^IRX',
}

const YF_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'Accept': '*/*' }

interface WmFredSeries {
  seriesId: string
  title: string
  units: string
  frequency: string
  observations: { date: string; value: number }[]
}

async function fetchSeriesYF(seriesId: string, yfTicker: string) {
  const r = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfTicker)}?interval=1d&range=5d`,
    { headers: YF_HEADERS, signal: AbortSignal.timeout(6_000) }
  )
  if (!r.ok) throw new Error(`YF error: ${r.status}`)
  const json = await r.json()
  const closes: number[] = json.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
  const valid = closes.filter((v): v is number => v != null && !isNaN(v))
  const latest = valid[valid.length - 1] ?? 0
  const prev = valid[valid.length - 2] ?? latest
  return {
    seriesId,
    name: SERIES_NAMES[seriesId] ?? seriesId,
    value: Math.round(latest * 100) / 100,
    previous: Math.round(prev * 100) / 100,
    date: new Date().toISOString().slice(0, 10),
    change: Math.round((latest - prev) * 100) / 100,
  }
}

async function fetchSeriesFRED(seriesId: string) {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) throw new Error('No FRED key')
  const r = await fetch(
    `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`,
    { signal: AbortSignal.timeout(8_000) }
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
  if (seriesIds.length > 20) return res.status(400).json({ error: 'Too many series (max 20)' })

  try {
    const { data, stale } = await cached(`fred:${seriesIds.join(',')}`, 3_600_000, async () => {
      // Primary: proxy batch endpoint
      try {
        const resp = await wmPost<{ results: Record<string, WmFredSeries>; fetched: number }>(
          '/api/economic/v1/get-fred-series-batch',
          { seriesIds, limit: 2 },
        )
        if (resp.fetched > 0) {
          return seriesIds
            .filter(id => resp.results[id])
            .map(id => {
              const s = resp.results[id]!
              const obs = s.observations
              const latest = obs[obs.length - 1]
              const previous = obs.length >= 2 ? obs[obs.length - 2] : latest
              return {
                seriesId: id,
                name: SERIES_NAMES[id] ?? s.title,
                value: latest?.value ?? 0,
                previous: previous?.value ?? 0,
                date: latest?.date ?? '',
                change: (latest?.value ?? 0) - (previous?.value ?? 0),
              }
            })
        }
      } catch (e) {
      }

      // Fallback: local FRED key or Yahoo Finance for treasury series
      const results = await Promise.allSettled(seriesIds.map(async (id) => {
        try {
          return await fetchSeriesFRED(id)
        } catch {
          const yfTicker = YF_FALLBACK[id]
          if (yfTicker) return fetchSeriesYF(id, yfTicker)
          return { seriesId: id, name: SERIES_NAMES[id] ?? id, value: 0, previous: 0, date: '', change: 0 }
        }
      }))
      return results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value)
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch FRED data' })
  }
}
