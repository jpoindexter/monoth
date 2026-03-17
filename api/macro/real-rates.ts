import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'
import { wmPost } from '../_wm.js'

// FRED series for TIPS real yields and breakeven inflation rates
const SERIES = {
  DFII5:  { maturity: '5Y',  type: 'real' },
  DFII10: { maturity: '10Y', type: 'real' },
  DFII30: { maturity: '30Y', type: 'real' },
  T5YIE:  { maturity: '5Y',  type: 'breakeven' },
  T10YIE: { maturity: '10Y', type: 'breakeven' },
  DGS5:   { maturity: '5Y',  type: 'nominal' },
  DGS10:  { maturity: '10Y', type: 'nominal' },
  DGS30:  { maturity: '30Y', type: 'nominal' },
}

async function fetchFredSeries(seriesId: string, apiKey: string): Promise<number | null> {
  const r = await fetch(
    `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=5`,
    { signal: AbortSignal.timeout(8_000) }
  )
  if (!r.ok) return null
  const json = await r.json()
  const obs: { value: string }[] = json.observations ?? []
  for (const o of obs) {
    const v = parseFloat(o.value)
    if (!isNaN(v)) return v
  }
  return null
}

// Yahoo Finance fallback for treasury yields when no FRED key
const YF_FALLBACK: Record<string, string> = {
  DGS5: '^FVX',
  DGS10: '^TNX',
  DGS30: '^TYX',
}

async function fetchYF(ticker: string): Promise<number | null> {
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`,
      { headers: { 'User-Agent': 'Mozilla/5.0', Accept: '*/*' }, signal: AbortSignal.timeout(6_000) }
    )
    if (!r.ok) return null
    const json = await r.json()
    const closes: number[] = json.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
    const valid = closes.filter((v): v is number => v != null && !isNaN(v))
    return valid[valid.length - 1] ?? null
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    const { data } = await cached('real-rates:v1', 3_600_000, async () => {
      const seriesIds = Object.keys(SERIES)
      const values: Record<string, number | null> = {}

      // Primary: proxy batch endpoint
      try {
        const resp = await wmPost<{ results: Record<string, { observations: { date: string; value: number }[] }>; fetched: number }>(
          '/api/economic/v1/get-fred-series-batch',
          { seriesIds, limit: 5 },
        )
        if (resp.fetched > 0) {
          for (const id of seriesIds) {
            const obs = resp.results[id]?.observations ?? []
            for (let i = obs.length - 1; i >= 0; i--) {
              const v = obs[i]?.value
              if (v != null && !isNaN(v)) { values[id] = v; break }
            }
            if (values[id] == null) values[id] = null
          }
        }
      } catch (e) {
      }

      // Fallback: local FRED key
      if (!Object.values(values).some(v => v != null)) {
        const apiKey = process.env.FRED_API_KEY
        if (apiKey) {
          await Promise.allSettled(
            seriesIds.map(async (id) => { values[id] = await fetchFredSeries(id, apiKey) })
          )
        } else {
          for (const id of seriesIds) {
            const yfTicker = YF_FALLBACK[id]
            values[id] = yfTicker ? await fetchYF(yfTicker) : null
          }
        }
      }

      // Assemble per maturity
      const maturities = ['5Y', '10Y', '30Y'] as const
      return maturities.map((mat) => {
        const nomId = Object.entries(SERIES).find(([, v]) => v.maturity === mat && v.type === 'nominal')?.[0]
        const realId = Object.entries(SERIES).find(([, v]) => v.maturity === mat && v.type === 'real')?.[0]
        const beId   = Object.entries(SERIES).find(([, v]) => v.maturity === mat && v.type === 'breakeven')?.[0]

        const nominal    = nomId  ? values[nomId]  ?? null : null
        const real       = realId ? values[realId] ?? null : null
        // If FRED real yield unavailable, approximate: nominal - breakeven
        const breakeven  = beId   ? values[beId]   ?? null : null
        const realFinal  = real ?? (nominal != null && breakeven != null ? +(nominal - breakeven).toFixed(2) : null)

        return { maturity: mat, nominal, real: realFinal, breakeven }
      })
    })

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch real rates' })
  }
}
