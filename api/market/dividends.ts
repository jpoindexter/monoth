import type { VercelRequest, VercelResponse } from '@vercel/node'
import YahooFinance from 'yahoo-finance2'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

const SYMBOLS = [
  'AAPL', 'MSFT', 'JNJ', 'KO', 'PEP', 'T', 'VZ', 'XOM', 'CVX', 'JPM',
  'BAC', 'V', 'HD', 'WMT', 'PG', 'MCD', 'DIS', 'ABBV', 'PFE', 'MRK',
  'O', 'MAIN', 'JEPI', 'JEPQ', 'SCHD', 'VYM', 'DVY', 'SPY', 'QQQ',
]

interface DividendEntry {
  symbol: string
  name: string
  exDivDate: string | null
  payDate: string | null
  dividendRate: number | null
  dividendYield: number | null
  payoutRatio: number | null
}

function pLimit<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = []
  let i = 0
  async function worker() {
    while (i < tasks.length) {
      const idx = i++
      results[idx] = await tasks[idx]()
    }
  }
  return Promise.all(Array.from({ length: concurrency }, worker)).then(() => results)
}

async function fetchOne(symbol: string): Promise<DividendEntry | null> {
  try {
    const result = await yf.quoteSummary(symbol, {
      modules: ['calendarEvents', 'defaultKeyStatistics', 'summaryDetail', 'price'],
    })
    const sd = result.summaryDetail
    const cal = result.calendarEvents
    const price = result.price

    const exDivDate = sd?.exDividendDate
      ? (sd.exDividendDate instanceof Date ? sd.exDividendDate : new Date(sd.exDividendDate as unknown as string)).toISOString().slice(0, 10)
      : null

    const divArr = cal?.dividends
    const payDate = divArr && divArr.length > 0
      ? (divArr[divArr.length - 1] instanceof Date
          ? divArr[divArr.length - 1].toISOString().slice(0, 10)
          : new Date(divArr[divArr.length - 1] as unknown as string).toISOString().slice(0, 10))
      : null

    return {
      symbol,
      name: String(price?.shortName ?? price?.longName ?? symbol),
      exDivDate,
      payDate,
      dividendRate: sd?.dividendRate != null ? Number(sd.dividendRate) : null,
      dividendYield: sd?.dividendYield != null ? Number(sd.dividendYield) : null,
      payoutRatio: sd?.payoutRatio != null ? Number(sd.payoutRatio) : null,
    }
  } catch {
    return null
  }
}

async function fetchAll(): Promise<DividendEntry[]> {
  const results = await pLimit(SYMBOLS.map((s) => () => fetchOne(s)), 3)
  return results
    .filter((r): r is DividendEntry => r !== null && r.exDivDate !== null)
    .sort((a, b) => (a.exDivDate ?? '').localeCompare(b.exDivDate ?? ''))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('market:dividends', 3_600_000, fetchAll)
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch dividend data' })
  }
}
