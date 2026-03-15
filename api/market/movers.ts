import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

function mapAVMovers(arr: Record<string, string>[]) {
  return arr.slice(0, 10).map((g) => ({
    symbol: g.ticker,
    price: parseFloat(g.price ?? '0'),
    change: parseFloat(g.change_amount ?? '0'),
    changePercent: parseFloat((g.change_percentage ?? '0').replace('%', '')),
    volume: parseInt(g.volume ?? '0', 10),
  }))
}

async function fetchFromAV() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey) throw new Error('No AV key')
  const r = await fetch(
    `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${apiKey}`,
    { signal: AbortSignal.timeout(10_000) }
  )
  if (!r.ok) throw new Error(`AV error: ${r.status}`)
  const json = await r.json()
  if (json.Information || json.Note) throw new Error('AV rate limited')
  if (!json.top_gainers?.length) throw new Error('AV empty response')
  return {
    gainers: mapAVMovers(json.top_gainers ?? []),
    losers: mapAVMovers(json.top_losers ?? []),
    active: mapAVMovers(json.most_actively_traded ?? []),
  }
}

async function fetchFromYF() {
  const YF_H = { 'User-Agent': 'Mozilla/5.0', Accept: '*/*' }
  const [gainersRes, losersRes, activeRes] = await Promise.all([
    fetch('https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=day_gainers&count=10', { headers: YF_H, signal: AbortSignal.timeout(8_000) }),
    fetch('https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=day_losers&count=10', { headers: YF_H, signal: AbortSignal.timeout(8_000) }),
    fetch('https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=most_actives&count=10', { headers: YF_H, signal: AbortSignal.timeout(8_000) }),
  ])
  const mapYF = (r: Response) => r.ok ? r.json().then((j: { finance?: { result?: { quotes?: Record<string, unknown>[] }[] } }) =>
    (j.finance?.result?.[0]?.quotes ?? []).slice(0, 10).map((q) => ({
      symbol: q.symbol as string,
      price: q.regularMarketPrice as number,
      change: q.regularMarketChange as number,
      changePercent: q.regularMarketChangePercent as number,
      volume: q.regularMarketVolume as number,
    }))
  ) : Promise.resolve([])
  const [gainers, losers, active] = await Promise.all([mapYF(gainersRes), mapYF(losersRes), mapYF(activeRes)])
  if (!gainers.length && !losers.length) throw new Error('YF movers empty')
  return { gainers, losers, active }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('movers', 300_000, async () => {
      try { return await fetchFromAV() } catch (e) {
        console.warn('[movers] AV failed:', (e as Error).message)
      }
      return fetchFromYF()
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch movers' })
  }
}
