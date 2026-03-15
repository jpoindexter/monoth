import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'
import { wmGet } from '../_wm.js'

const FUTURES = [
  { symbol: 'ES=F', name: 'S&P 500', id: 'ES' },
  { symbol: 'NQ=F', name: 'Nasdaq 100', id: 'NQ' },
  { symbol: 'YM=F', name: 'Dow Jones', id: 'YM' },
  { symbol: 'RTY=F', name: 'Russell 2000', id: 'RTY' },
  { symbol: 'CL=F', name: 'Crude Oil', id: 'CL' },
  { symbol: 'GC=F', name: 'Gold', id: 'GC' },
  { symbol: 'ZB=F', name: '30Y Bond', id: 'ZB' },
]

const META_BY_SYMBOL = Object.fromEntries(FUTURES.map(f => [f.symbol, f]))

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

async function fetchYFFuture(symbol: string, name: string, id: string) {
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
  return { symbol: id, name, price, change, changePercent }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const data = await cached('futures:all', 60_000, async () => {
      // Primary: worldmonitor handles futures/commodities with Yahoo + relay
      try {
        const symbols = FUTURES.map(f => f.symbol)
        const resp = await wmGet<{ quotes: WmQuote[] }>(
          '/api/market/v1/list-market-quotes',
          { symbols },
        )
        if (resp.quotes?.length) {
          return resp.quotes.map(q => {
            const meta = META_BY_SYMBOL[q.symbol]
            const changePct = q.change
            const absChange = q.price * changePct / (100 + changePct)
            return {
              symbol: meta?.id ?? q.symbol,
              name: meta?.name ?? q.name,
              price: q.price,
              change: absChange,
              changePercent: changePct,
            }
          })
        }
      } catch (e) {
      }

      // Fallback: direct Yahoo Finance
      const results = await Promise.allSettled(
        FUTURES.map(f => fetchYFFuture(f.symbol, f.name, f.id))
      )
      return results
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchYFFuture>>> => r.status === 'fulfilled')
        .map(r => r.value)
    })
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    res.json(data.data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch futures' })
  }
}
