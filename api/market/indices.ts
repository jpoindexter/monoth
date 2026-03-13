import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const INDICES = [
  { symbol: 'SPY', name: 'S&P 500' },
  { symbol: 'QQQ', name: 'NASDAQ' },
  { symbol: 'DIA', name: 'Dow Jones' },
  { symbol: 'EFA', name: 'Intl Developed' },
  { symbol: 'EEM', name: 'Emerging Markets' },
  { symbol: 'IWM', name: 'Russell 2000' },
  { symbol: 'VTI', name: 'Total Market' },
]

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
}

async function fetchV8Meta(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
  const r = await fetch(url, { headers: YF_HEADERS })
  if (!r.ok) throw new Error(`Yahoo Finance error: ${r.status}`)
  const json = await r.json()
  const meta = json.chart?.result?.[0]?.meta
  if (!meta) throw new Error('No data')
  return meta
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('indices', 30_000, async () => {
      return Promise.all(INDICES.map(async ({ symbol, name }) => {
        const meta = await fetchV8Meta(symbol)
        const price = meta.regularMarketPrice
        const prevClose = meta.regularMarketPreviousClose ?? meta.chartPreviousClose
        const change = price - prevClose
        const changePercent = (change / prevClose) * 100
        return {
          symbol, name,
          price: price ?? null,
          change,
          changePercent,
          high: meta.regularMarketDayHigh,
          low: meta.regularMarketDayLow,
          open: meta.regularMarketOpen,
          previousClose: prevClose,
          timestamp: Date.now(),
          source: 'yahoo',
        }
      }))
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch indices' })
  }
}
