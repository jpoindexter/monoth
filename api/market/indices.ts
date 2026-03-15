import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'
import { wmGet } from '../_wm.js'

const INDICES = [
  { symbol: 'SPY', name: 'S&P 500' },
  { symbol: 'QQQ', name: 'NASDAQ' },
  { symbol: 'DIA', name: 'Dow Jones' },
  { symbol: 'EFA', name: 'Intl Developed' },
  { symbol: 'EEM', name: 'Emerging Markets' },
  { symbol: 'IWM', name: 'Russell 2000' },
  { symbol: 'VTI', name: 'Total Market' },
]

const NAMES: Record<string, string> = Object.fromEntries(INDICES.map(i => [i.symbol, i.name]))

interface WmQuote {
  symbol: string
  name: string
  price: number
  change: number // percent change
  sparkline: number[]
}

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
}

async function fetchYF(symbol: string, name: string) {
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
  return { symbol, name, price, change, changePercent, sparkline: [], timestamp: Date.now(), source: 'yahoo' }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('indices', 30_000, async () => {
      // Primary: worldmonitor (Finnhub + Yahoo + relay fallback, all cached server-side)
      try {
        const symbols = INDICES.map(i => i.symbol)
        const resp = await wmGet<{ quotes: WmQuote[] }>(
          '/api/market/v1/list-market-quotes',
          { symbols },
        )
        if (resp.quotes?.length) {
          return resp.quotes.map(q => {
            const changePct = q.change
            const absChange = q.price * changePct / (100 + changePct)
            return {
              symbol: q.symbol,
              name: NAMES[q.symbol] ?? q.name,
              price: q.price,
              change: absChange,
              changePercent: changePct,
              sparkline: q.sparkline ?? [],
              timestamp: Date.now(),
              source: 'wm',
            }
          })
        }
      } catch (e) {
      }
      // Fallback: direct Yahoo Finance (sequential, rate-limit prone)
      return Promise.all(INDICES.map(({ symbol, name }) => fetchYF(symbol, name)))
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch indices' })
  }
}
