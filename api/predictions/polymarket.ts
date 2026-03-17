import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

export interface PredictionItem {
  id: string
  title: string
  yesPct: number
  noPct: number
  volume: number
  volume24h: number
  endDate: string
  source: 'polymarket' | 'kalshi'
  url: string
}

async function fetchPolymarket(): Promise<PredictionItem[]> {
  const r = await fetch(
    'https://gamma-api.polymarket.com/events?closed=false&order=volume&ascending=false&limit=40',
    { signal: AbortSignal.timeout(8_000) }
  )
  if (!r.ok) throw new Error(`Polymarket ${r.status}`)
  const events: any[] = await r.json()

  const items: PredictionItem[] = []
  for (const ev of events) {
    const markets: any[] = ev.markets ?? []
    // For binary single-outcome events use top market; for multi-outcome use event-level
    if (markets.length === 0) continue
    // For multi-outcome events (election races etc.) pick the leading market
    const parsedMarkets = markets.map((m: any) => {
      let prices: number[] = []
      try { prices = JSON.parse(m.outcomePrices ?? '[]').map(Number) } catch {}
      return { ...m, yesPct: Math.round((prices[0] ?? 0) * 100) }
    })
    const isBinary = markets.length <= 2
    // Binary: use first market; multi-outcome: use highest-probability market as headline
    const top = isBinary
      ? parsedMarkets[0]
      : parsedMarkets.sort((a: any, b: any) => b.yesPct - a.yesPct)[0]
    const yesPct = top.yesPct || 1
    const vol = Number(ev.volume ?? 0)
    if (vol < 5_000) continue
    items.push({
      id: String(ev.id),
      // For multi-outcome: prefix with leading candidate's question
      title: !isBinary && top.question ? `${ev.title}: ${top.question}` : ev.title ?? top.question ?? 'Unknown',
      yesPct,
      noPct: 100 - yesPct,
      volume: vol,
      volume24h: Number(ev.volume24hr ?? 0),
      endDate: ev.endDate ?? '',
      source: 'polymarket',
      url: `https://polymarket.com/event/${ev.slug ?? ev.id}`,
    })
  }
  return items
}

async function fetchKalshi(): Promise<PredictionItem[]> {
  const r = await fetch(
    'https://api.elections.kalshi.com/trade-api/v2/events?status=open&with_nested_markets=true&limit=50',
    { signal: AbortSignal.timeout(8_000) }
  )
  if (!r.ok) throw new Error(`Kalshi ${r.status}`)
  const json = await r.json()
  const events: any[] = json.events ?? []

  const items: PredictionItem[] = []
  for (const ev of events) {
    const markets: any[] = ev.markets ?? []
    if (markets.length === 0) continue
    // Sum volume across all child markets (volume_fp = volume in dollars fixed-point)
    const vol = markets.reduce((s: number, m: any) => s + Number(m.volume_fp ?? m.volume ?? 0), 0)
    if (vol < 500) continue
    // Use market with highest yes bid for display
    const top = markets.sort((a: any, b: any) => Number(b.yes_bid_dollars ?? 0) - Number(a.yes_bid_dollars ?? 0))[0]
    // yes_bid_dollars is a decimal probability (0.09 = 9%)
    const yesBid = Number(top.yes_bid_dollars ?? top.last_price_dollars ?? 0.5)
    const yesPct = Math.min(99, Math.max(1, Math.round(yesBid * 100)))
    items.push({
      id: `kalshi-${ev.event_ticker}`,
      title: ev.title ?? ev.event_ticker,
      yesPct,
      noPct: 100 - yesPct,
      volume: vol,
      volume24h: 0,
      endDate: ev.end_date ?? '',
      source: 'kalshi',
      url: `https://kalshi.com/markets/${ev.event_ticker}`,
    })
  }
  return items
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached<PredictionItem[]>('predictions:v4', 300_000, async () => {
      const [poly, kalshi] = await Promise.allSettled([fetchPolymarket(), fetchKalshi()])
      const polyItems = poly.status === 'fulfilled' ? poly.value : []
      const kalshiItems = kalshi.status === 'fulfilled' ? kalshi.value : []
      return [...polyItems, ...kalshiItems].sort((a, b) => b.volume - a.volume)
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch predictions' })
  }
}
