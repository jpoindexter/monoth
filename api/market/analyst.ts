import type { VercelRequest, VercelResponse } from '@vercel/node'
import YahooFinance from 'yahoo-finance2'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

async function pLimit<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = []
  let i = 0
  async function worker() {
    while (i < tasks.length) {
      const idx = i++
      results[idx] = await tasks[idx]()
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
  return results
}

const SYMBOLS = [
  'AAPL', 'MSFT', 'NVDA', 'META', 'GOOGL', 'AMZN', 'TSLA',
  'JPM', 'V', 'MA', 'BAC', 'GS', 'XOM', 'CVX', 'JNJ', 'WMT',
  'UNH', 'AMD', 'NFLX', 'DIS', 'COIN', 'SHOP', 'PLTR', 'AVGO',
  'COST', 'ORCL', 'CSCO', 'ADBE', 'CRM', 'INTC', 'MU', 'QCOM',
  'PYPL', 'UBER', 'RIVN', 'BABA', 'TSM', 'ARM', 'SNOW', 'PANW',
]

interface RatingEntry {
  ticker: string
  firm: string
  fromGrade: string
  toGrade: string
  action: 'up' | 'down' | 'init' | 'reit'
  date: string
}

async function fetchHistory(symbol: string): Promise<RatingEntry[]> {
  const result = await yf.quoteSummary(symbol, { modules: ['upgradeDowngradeHistory'] })
  const history = result.upgradeDowngradeHistory?.history ?? []
  const cutoff = Date.now() - 90 * 86_400_000

  return history
    .filter((h) => h.epochGradeDate && new Date(h.epochGradeDate).getTime() > cutoff)
    .map((h) => {
      const actionStr = String(h.action ?? '').toLowerCase()
      let action: RatingEntry['action'] = 'reit'
      if (actionStr.includes('up')) action = 'up'
      else if (actionStr.includes('down')) action = 'down'
      else if (actionStr.includes('init') || actionStr.includes('new') || actionStr.includes('start')) action = 'init'
      return {
        ticker: symbol,
        firm: String(h.firm ?? ''),
        fromGrade: String(h.fromGrade ?? ''),
        toGrade: String(h.toGrade ?? ''),
        action,
        date: new Date(h.epochGradeDate!).toISOString().slice(0, 10),
      }
    })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data } = await cached('analyst:ratings:v2', 21_600_000, async () => {
      // Concurrency 3 to avoid rate limits — 40 symbols at 3 at a time
      const batches = await pLimit(
        SYMBOLS.map(sym => () => fetchHistory(sym).catch(() => [] as RatingEntry[])),
        3
      )
      const all = batches.flat()
      return all.sort((a, b) => b.date.localeCompare(a.date))
    })
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=43200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch analyst ratings' })
  }
}
