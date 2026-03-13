import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const YF_HEADERS = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    const { data, stale } = await cached('market:ipo', 600_000, async () => {
      const r = await fetch(
        'https://query2.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=upcoming_ipos&count=20',
        { headers: YF_HEADERS }
      )
      if (!r.ok) throw new Error(`Yahoo IPO screener error: ${r.status}`)
      const json = await r.json()
      const rows: Record<string, unknown>[] = json?.finance?.result?.[0]?.quotes ?? []
      if (!rows.length) throw new Error('empty')
      return rows.slice(0, 20)
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')
    res.json(data)
  } catch {
    res.json([])
  }
}
