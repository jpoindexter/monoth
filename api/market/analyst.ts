import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
}

// Top symbols to pull rating history for
const SYMBOLS = [
  'AAPL', 'MSFT', 'NVDA', 'META', 'GOOGL', 'AMZN', 'TSLA',
  'JPM', 'V', 'BAC', 'XOM', 'JNJ', 'WMT', 'UNH', 'AMD',
  'NFLX', 'DIS', 'COIN', 'SHOP', 'PLTR',
]

interface RatingEntry {
  ticker: string
  firm: string
  fromGrade: string
  toGrade: string
  action: 'up' | 'down' | 'init' | 'reit'
  date: string // YYYY-MM-DD
}

async function fetchHistory(symbol: string): Promise<RatingEntry[]> {
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=upgradeDowngradeHistory`
  const r = await fetch(url, { headers: YF_HEADERS })
  if (!r.ok) return []
  const json = await r.json()
  const history: Record<string, unknown>[] = json?.quoteSummary?.result?.[0]?.upgradeDowngradeHistory?.history ?? []

  return history
    .filter((h) => {
      // Only last 30 days
      const epochMs = Number(h.epochGradeDate) * 1000
      return Date.now() - epochMs < 30 * 86_400_000
    })
    .map((h) => {
      const from = String(h.fromGrade ?? '')
      const to = String(h.toGrade ?? '')
      const actionStr = String(h.action ?? '').toLowerCase()
      let action: RatingEntry['action'] = 'reit'
      if (actionStr.includes('up')) action = 'up'
      else if (actionStr.includes('down')) action = 'down'
      else if (actionStr.includes('init') || actionStr.includes('new') || actionStr.includes('start')) action = 'init'
      return {
        ticker: symbol,
        firm: String(h.firm ?? ''),
        fromGrade: from,
        toGrade: to,
        action,
        date: new Date(Number(h.epochGradeDate) * 1000).toISOString().slice(0, 10),
      }
    })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data } = await cached('analyst:ratings', 600_000, async () => {
      const results = await Promise.allSettled(SYMBOLS.map(fetchHistory))
      const all: RatingEntry[] = []
      for (const r of results) {
        if (r.status === 'fulfilled') all.push(...r.value)
      }
      return all.sort((a, b) => b.date.localeCompare(a.date))
    })
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch analyst ratings' })
  }
}
