import type { VercelRequest, VercelResponse } from '@vercel/node'
import YahooFinance from 'yahoo-finance2'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

// Single shared instance — handles crumb/cookie lifecycle internally
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

async function fetchOptions(symbol: string, expiry?: string) {
  const queryOpts = expiry ? { date: new Date(Number(expiry) * 1000) } : {}
  const result = await yf.options(symbol, queryOpts)
  const chain = result.options?.[0] ?? {}
  return {
    symbol: result.underlyingSymbol,
    underlyingPrice: result.quote?.regularMarketPrice,
    expirationDates: (result.expirationDates ?? []).map((d: Date) => Math.floor(new Date(d).getTime() / 1000)),
    expiry: chain.expirationDate ? Math.floor(new Date(chain.expirationDate).getTime() / 1000) : undefined,
    calls: chain.calls ?? [],
    puts: chain.puts ?? [],
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
    res.status(500).json({ error: `Failed to fetch options for ${symbol}` })
  }
}
