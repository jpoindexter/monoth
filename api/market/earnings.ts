import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const FALLBACK_SYMBOLS = [
  'AAPL', 'MSFT', 'NVDA', 'META', 'GOOGL', 'AMZN', 'TSLA', 'JPM', 'V', 'BRK-B',
  'JNJ', 'WMT', 'BAC', 'XOM', 'UNH', 'GS', 'NFLX', 'COST', 'AVGO', 'AMD',
]

const YF_HEADERS = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }

interface EarningsEntry {
  symbol: string
  reportDate: string
  epsEstimate: number | null
  epsActual: number | null
  revenueEstimate: number | null
  revenueActual: number | null
  hour: string
}

function earningsHour(ts: number | undefined, tsEnd: number | undefined): string {
  if (!ts) return 'dmh'
  const h = new Date(ts * 1000).getUTCHours()
  // YF uses start/end timestamps; start < 14 UTC (pre-market) = bmo, end > 20 UTC = amc
  if (h < 14) return 'bmo'
  if (tsEnd && new Date(tsEnd * 1000).getUTCHours() >= 20) return 'amc'
  return 'dmh'
}

async function fetchScreener(): Promise<EarningsEntry[]> {
  const r = await fetch(
    'https://query2.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=upcoming_earnings&start=0&count=50',
    { headers: YF_HEADERS }
  )
  if (!r.ok) throw new Error(`Yahoo screener error: ${r.status}`)
  const json = await r.json()
  const rows: Record<string, unknown>[] = json?.finance?.result?.[0]?.quotes ?? []
  if (!rows.length) throw new Error('empty screener')
  return rows.map((q) => {
    const tsStart = q.earningsTimestampStart != null ? Number(q.earningsTimestampStart) : undefined
    const tsEnd = q.earningsTimestampEnd != null ? Number(q.earningsTimestampEnd) : undefined
    return {
      symbol: String(q.symbol ?? ''),
      reportDate: String(tsStart
        ? new Date(tsStart * 1000).toISOString().slice(0, 10)
        : q.reportDate ?? ''),
      epsEstimate: q.epsForward != null ? Number(q.epsForward) : null,
      epsActual: null,
      revenueEstimate: null,
      revenueActual: null,
      hour: earningsHour(tsStart, tsEnd),
    }
  })
}

async function fetchPerSymbol(): Promise<EarningsEntry[]> {
  const results = await Promise.allSettled(
    FALLBACK_SYMBOLS.map(async (sym) => {
      const r = await fetch(
        `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${sym}?modules=calendarEvents`,
        { headers: YF_HEADERS }
      )
      if (!r.ok) return null
      const json = await r.json()
      const cal = json?.quoteSummary?.result?.[0]?.calendarEvents
      if (!cal) return null
      const dates: number[] = cal.earnings?.earningsDate ?? []
      if (!dates.length) return null
      const ts = dates[0]
      const reportDate = new Date(ts * 1000).toISOString().slice(0, 10)
      return {
        symbol: sym,
        reportDate,
        epsEstimate: cal.earnings?.epsEstimate?.raw ?? null,
        epsActual: null,
        revenueEstimate: cal.earnings?.revenueEstimate?.raw ?? null,
        revenueActual: null,
        hour: earningsHour(ts, dates[1]),
      } as EarningsEntry
    })
  )
  return results
    .filter((r): r is PromiseFulfilledResult<EarningsEntry | null> => r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value!)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const from = req.query.from as string | undefined
  const to = req.query.to as string | undefined

  try {
    const { data, stale } = await cached('market:earnings', 600_000, async () => {
      try {
        const entries = await fetchScreener()
        return entries.slice(0, 50)
      } catch {
        try {
          return await fetchPerSymbol()
        } catch {
          return []
        }
      }
    })

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
