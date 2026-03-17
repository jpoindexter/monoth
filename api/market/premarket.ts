import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'
const SYMBOLS = ['SPY', 'QQQ', 'IWM', 'DIA', 'AAPL', 'MSFT', 'NVDA', 'META', 'GOOGL', 'AMZN', 'TSLA', 'AMD', 'COIN', 'NFLX']

interface PreMarketEntry {
  symbol: string
  regularPrice: number
  preMarketPrice: number | null
  preMarketChange: number | null
  preMarketChangePct: number | null
  postMarketPrice: number | null
  postMarketChange: number | null
  postMarketChangePct: number | null
}

async function fetchOne(symbol: string): Promise<PreMarketEntry> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) })
  if (!res.ok) throw new Error(`${symbol}: ${res.status}`)
  const json = await res.json()
  const meta = json?.chart?.result?.[0]?.meta ?? {}
  return {
    symbol,
    regularPrice: meta.regularMarketPrice ?? 0,
    preMarketPrice: meta.preMarketPrice ?? null,
    preMarketChange: meta.preMarketChange ?? null,
    preMarketChangePct: meta.preMarketChangePercent ?? null,
    postMarketPrice: meta.postMarketPrice ?? null,
    postMarketChange: meta.postMarketChange ?? null,
    postMarketChangePct: meta.postMarketChangePercent ?? null,
  }
}

async function fetchAll(): Promise<PreMarketEntry[]> {
  const results = await Promise.allSettled(SYMBOLS.map(fetchOne))
  return results
    .filter((r): r is PromiseFulfilledResult<PreMarketEntry> => r.status === 'fulfilled')
    .map((r) => r.value)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('market:premarket:v2', 60_000, fetchAll)
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch pre-market data' })
  }
}
