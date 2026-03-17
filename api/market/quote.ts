import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'
import { wmGet } from '../_wm.js'

interface WmQuote {
  symbol: string
  name: string
  price: number
  change: number // percent
  sparkline: number[]
}

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
}

async function fetchYFQuote(symbol: string) {
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
  if (symbols.length > 20) return res.status(400).json({ error: 'Too many symbols (max 20)' })
  try {
    const quotes = await cached(`quote:${symbols.join(',')}`, 60_000, async () => {
      // Primary: worldmonitor
      try {
        const resp = await wmGet<{ quotes: WmQuote[] }>(
          '/api/market/v1/list-market-quotes',
          { symbols },
        )
        if (resp.quotes?.length) {
          return resp.quotes.map(q => {
            const changePct = q.change
            const absChange = q.price * changePct / (100 + changePct)
            return { symbol: q.symbol, price: q.price, change: absChange, changePercent: changePct, volume: 0, timestamp: Date.now(), source: 'wm' }
          })
        }
      } catch {}
      // Fallback: direct Yahoo Finance (allSettled so one bad symbol doesn't kill the batch)
      const settled = await Promise.allSettled(symbols.map(fetchYFQuote))
      return settled.flatMap(r => r.status === 'fulfilled' ? [r.value] : [])
    })
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=180')
    res.json(quotes.data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch quotes' })
  }
}
