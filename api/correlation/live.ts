import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
}

const SYMBOLS = ['SPY', 'GLD', 'TLT', 'UUP', 'BTC-USD']
const ASSET_LABELS = ['SPY', 'GLD', 'TLT', 'DXY', 'BTC']

const WINDOWS = { w1: 5, m1: 21, m3: 63, m6: 126 }

const HISTORY_PAIRS = ['SPY-TLT', 'SPY-GLD', 'BTC-SPY', 'DXY-GLD']

async function fetchDailyCloses(symbol: string): Promise<{ date: string; close: number }[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=6mo`
  const r = await fetch(url, { headers: YF_HEADERS })
  if (!r.ok) throw new Error(`Yahoo Finance ${symbol}: ${r.status}`)
  const json = await r.json()
  const result = json.chart?.result?.[0]
  if (!result) throw new Error(`No data for ${symbol}`)
  const timestamps: number[] = result.timestamp ?? []
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? []
  const out: { date: string; close: number }[] = []
  for (let i = 0; i < timestamps.length; i++) {
    const c = closes[i]
    if (c == null || Number.isNaN(c)) continue
    const date = new Date(timestamps[i] * 1000).toISOString().slice(0, 10)
    out.push({ date, close: c })
  }
  return out
}

function logReturns(closes: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < closes.length; i++) {
    out.push(Math.log(closes[i] / closes[i - 1]))
  }
  return out
}

function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0
  let mx = 0, my = 0
  for (let i = 0; i < n; i++) { mx += x[i]; my += y[i] }
  mx /= n; my /= n
  let num = 0, dx2 = 0, dy2 = 0
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx, b = y[i] - my
    num += a * b; dx2 += a * a; dy2 += b * b
  }
  const denom = Math.sqrt(dx2 * dy2)
  return denom === 0 ? 0 : num / denom
}

function r2(v: number) { return +v.toFixed(2) }

async function computeCorrelations() {
  const results = await Promise.allSettled(SYMBOLS.map(fetchDailyCloses))

  const seriesBySymbol: Record<string, Map<string, number>> = {}
  for (let i = 0; i < SYMBOLS.length; i++) {
    const r = results[i]
    if (r.status === 'fulfilled') {
      const m = new Map<string, number>()
      for (const { date, close } of r.value) m.set(date, close)
      seriesBySymbol[SYMBOLS[i]] = m
    }
  }

  const availableSymbols = SYMBOLS.filter((s) => seriesBySymbol[s])

  // Intersect dates across all available symbols
  let commonDates: string[] | null = null
  for (const sym of availableSymbols) {
    const dates = [...seriesBySymbol[sym].keys()].sort()
    commonDates = commonDates ? commonDates.filter((d) => seriesBySymbol[sym].has(d)) : dates
  }
  commonDates = commonDates ?? []

  // Build aligned close arrays per symbol
  const aligned: Record<string, number[]> = {}
  for (const sym of availableSymbols) {
    aligned[sym] = commonDates.map((d) => seriesBySymbol[sym].get(d)!)
  }

  // Log returns per symbol
  const returns: Record<string, number[]> = {}
  for (const sym of availableSymbols) {
    returns[sym] = logReturns(aligned[sym])
  }

  // Build 5x5 matrix using 6M window (all available data)
  const matrix: number[][] = []
  for (let i = 0; i < SYMBOLS.length; i++) {
    const row: number[] = []
    const si = SYMBOLS[i]
    for (let j = 0; j < SYMBOLS.length; j++) {
      const sj = SYMBOLS[j]
      if (i === j) { row.push(1); continue }
      if (!returns[si] || !returns[sj]) { row.push(0); continue }
      row.push(r2(pearson(returns[si], returns[sj])))
    }
    matrix.push(row)
  }

  // Rolling history for specified pairs
  const labelToSymbol: Record<string, string> = {
    SPY: 'SPY', GLD: 'GLD', TLT: 'TLT', DXY: 'UUP', BTC: 'BTC-USD',
  }

  const history = HISTORY_PAIRS.map((pair) => {
    const [a, b] = pair.split('-')
    const sa = labelToSymbol[a]
    const sb = labelToSymbol[b]
    const ra = returns[sa] ?? []
    const rb = returns[sb] ?? []
    const entry: Record<string, string | number> = { pair }
    for (const [key, days] of Object.entries(WINDOWS)) {
      const xa = ra.slice(-days)
      const xb = rb.slice(-days)
      entry[key] = r2(pearson(xa, xb))
    }
    return entry
  })

  return {
    assets: ASSET_LABELS,
    matrix,
    history,
    asOf: new Date().toISOString().slice(0, 10),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const result = await cached('correlation:live', 3_600_000, computeCorrelations)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300')
    res.json(result.data)
  } catch {
    res.status(500).json({ error: 'Failed to compute correlations' })
  }
}
