import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
}

interface YFContract {
  strike: number
  lastPrice: number
  bid: number
  ask: number
  volume: number
  openInterest: number
  impliedVolatility: number
  inTheMoney: boolean
  expiration: number
  contractSymbol: string
}

async function fetchOptions(symbol: string, expiry?: string) {
  let url = `https://query1.finance.yahoo.com/v7/finance/options/${encodeURIComponent(symbol)}`
  if (expiry) url += `?date=${expiry}`
  const r = await fetch(url, { headers: YF_HEADERS })
  if (!r.ok) throw new Error(`Yahoo Finance error: ${r.status}`)
  const json = await r.json()
  const result = json?.optionChain?.result?.[0]
  if (!result) throw new Error('No options data')
  const opts = result.options?.[0] ?? {}
  return {
    symbol: result.underlyingSymbol as string,
    underlyingPrice: result.quote?.regularMarketPrice as number,
    expirationDates: (result.expirationDates ?? []) as number[],
    expiry: opts.expirationDate as number | undefined,
    calls: (opts.calls ?? []) as YFContract[],
    puts: (opts.puts ?? []) as YFContract[],
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  const symbol = (req.query.symbol as string)?.toUpperCase()
  if (!symbol) return res.status(400).json({ error: 'symbol param required' })
  const expiry = req.query.expiry as string | undefined
  const cacheKey = `options:${symbol}:${expiry ?? 'nearest'}`
  try {
    const result = await cached(cacheKey, 120_000, () => fetchOptions(symbol, expiry))
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300')
    res.json(result.data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch options' })
  }
}
