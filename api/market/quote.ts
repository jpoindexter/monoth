import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
}

async function fetchV8Quote(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
  const r = await fetch(url, { headers: YF_HEADERS })
  if (!r.ok) throw new Error(`Yahoo Finance error: ${r.status}`)
  const json = await r.json()
  const meta = json.chart?.result?.[0]?.meta
  if (!meta) throw new Error('No data')
  const price = meta.regularMarketPrice
  const prevClose = meta.regularMarketPreviousClose ?? meta.chartPreviousClose
  const change = price - prevClose
  const changePercent = (change / prevClose) * 100
  return { symbol, price, change, changePercent, volume: meta.regularMarketVolume ?? 0, timestamp: Date.now(), source: 'yahoo' }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  const symbols = (req.query.symbols as string)?.split(',').filter(Boolean) ?? []
  if (!symbols.length) return res.status(400).json({ error: 'symbols param required' })
  try {
    const quotes = await cached(`quote:${symbols.join(',')}`, 30_000, async () => {
      return Promise.all(symbols.map((s) => fetchV8Quote(s)))
    })
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    res.json(quotes.data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch quotes' })
  }
}
