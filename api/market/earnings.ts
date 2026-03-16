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
  'AAPL', 'MSFT', 'NVDA', 'META', 'GOOGL', 'AMZN', 'TSLA', 'JPM', 'V', 'MA',
  'JNJ', 'WMT', 'BAC', 'XOM', 'UNH', 'GS', 'NFLX', 'COST', 'AVGO', 'AMD',
  'ORCL', 'CSCO', 'ADBE', 'CRM', 'INTC', 'MU', 'QCOM', 'PYPL', 'UBER', 'DIS',
  'KO', 'PEP', 'MCD', 'SBUX', 'NKE', 'HD', 'LOW', 'TGT', 'AMGN', 'LLY',
  'PFE', 'ABBV', 'TMO', 'DHR', 'COIN', 'PLTR', 'SNOW', 'PANW', 'ARM', 'TSM',
]

interface EarningsEntry {
  symbol: string
  reportDate: string
  epsEstimate: number | null
  epsActual: number | null
  revenueEstimate: number | null
  revenueActual: number | null
  hour: string
}

function earningsHour(dates: Date[]): string {
  if (!dates.length) return 'dmh'
  const h = dates[0].getUTCHours()
  if (h < 14) return 'bmo'
  if (dates[1] && dates[1].getUTCHours() >= 20) return 'amc'
  return 'dmh'
}

async function fetchOne(sym: string): Promise<EarningsEntry | null> {
  try {
    const result = await yf.quoteSummary(sym, { modules: ['calendarEvents'] })
    const cal = result.calendarEvents
    if (!cal?.earnings?.earningsDate?.length) return null
    const dates = cal.earnings.earningsDate as Date[]
    return {
      symbol: sym,
      reportDate: dates[0].toISOString().slice(0, 10),
      epsEstimate: null,
      epsActual: null,
      revenueEstimate: null,
      revenueActual: null,
      hour: earningsHour(dates),
    }
  } catch {
    return null
  }
}

async function fetchPerSymbol(): Promise<EarningsEntry[]> {
  // Concurrency 3 to avoid rate limits
  const results = await pLimit(SYMBOLS.map(sym => () => fetchOne(sym)), 3)
  return results.filter((r): r is EarningsEntry => r !== null)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const from = req.query.from as string | undefined
  const to = req.query.to as string | undefined

  try {
    const { data, stale } = await cached('market:earnings:v2', 600_000, fetchPerSymbol)

    let result = data as EarningsEntry[]
    if (from) result = result.filter((e) => e.reportDate >= from)
    if (to) result = result.filter((e) => e.reportDate <= to)
    result = result.sort((a, b) => a.reportDate.localeCompare(b.reportDate))

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')
    res.json(result)
  } catch {
    res.json([])
  }
}
