import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
}

async function fetchVixRange() {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1y'
  const r = await fetch(url, { headers: YF_HEADERS })
  if (!r.ok) throw new Error(`Yahoo Finance error: ${r.status}`)
  const json = await r.json()
  const result = json.chart?.result?.[0]
  if (!result) throw new Error('No VIX data')
  const closes: number[] = (result.indicators?.quote?.[0]?.close ?? []).filter(
    (v: unknown) => v != null && !Number.isNaN(v)
  )
  if (!closes.length) throw new Error('Empty closes')
  const current = closes[closes.length - 1]
  const low52 = Math.min(...closes)
  const high52 = Math.max(...closes)
  const avg = closes.reduce((s, v) => s + v, 0) / closes.length
  return {
    low52: +low52.toFixed(2),
    high52: +high52.toFixed(2),
    avg: +avg.toFixed(2),
    current: +current.toFixed(2),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const result = await cached('vix-range', 3_600_000, fetchVixRange)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300')
    res.json(result.data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch VIX range' })
  }
}
