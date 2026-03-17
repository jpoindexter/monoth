import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'
export interface FuturesStripItem {
  label: string
  symbol: string
  price: number
  change: number
  changePct: number
}

const STRIP = [
  { label: 'S&P 500', symbol: 'ES=F' },
  { label: 'Nasdaq', symbol: 'NQ=F' },
  { label: 'Dow', symbol: 'YM=F' },
  { label: 'Russell', symbol: 'RTY=F' },
  { label: 'Crude Oil', symbol: 'CL=F' },
  { label: 'Nat Gas', symbol: 'NG=F' },
  { label: 'Gold', symbol: 'GC=F' },
  { label: 'Silver', symbol: 'SI=F' },
  { label: '10Y Bond', symbol: 'ZN=F' },
  { label: '30Y Bond', symbol: 'ZB=F' },
  { label: 'VIX', symbol: '^VIX' },
  { label: 'Bitcoin', symbol: 'BTC=F' },
]

async function fetchOne(label: string, symbol: string): Promise<FuturesStripItem> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
  const r = await fetch(url, { signal: AbortSignal.timeout(6_000) })
  if (!r.ok) throw new Error(`YF ${r.status}`)
  const json = await r.json()
  const meta = json.chart?.result?.[0]?.meta
  if (!meta) throw new Error('no meta')
  const price: number = meta.regularMarketPrice
  const prevClose: number = meta.regularMarketPreviousClose ?? meta.chartPreviousClose ?? price
  const change = price - prevClose
  const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0
  return { label, symbol, price, change, changePct }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data } = await cached<FuturesStripItem[]>('futures-strip:v3', 60_000, async () => {
      const results = await Promise.allSettled(STRIP.map(({ label, symbol }) => fetchOne(label, symbol)))
      return results
        .filter((r): r is PromiseFulfilledResult<FuturesStripItem> => r.status === 'fulfilled')
        .map(r => r.value)
    })
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch futures strip' })
  }
}
