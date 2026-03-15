import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

interface ShippingIndex {
  indexId: string
  name: string
  currentValue: number
  previousValue: number
  changePct: number
  unit: string
  history: Array<{ date: string; value: number }>
  spikeAlert: boolean
}

const SERIES: Record<string, string> = {
  PCU483111483111: 'Deep Sea Freight PPI',
  TSIFRGHT: 'Freight Transportation Services Index',
}

function detectSpike(history: { value: number }[]): boolean {
  if (history.length < 6) return false
  const recent = history.slice(-6).map(h => h.value)
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length
  const stdev = Math.sqrt(recent.map(v => (v - mean) ** 2).reduce((a, b) => a + b, 0) / recent.length)
  const latest = history[history.length - 1]!.value
  return stdev > 0 && latest > mean + 2 * stdev
}

async function fetchSeries(apiKey: string, id: string, name: string): Promise<ShippingIndex> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${apiKey}&file_type=json&frequency=m&sort_order=desc&limit=12`
  const r = await fetch(url, { signal: AbortSignal.timeout(8_000) })
  if (!r.ok) throw new Error(`FRED error: ${r.status}`)
  const json = await r.json()
  const obs: { date: string; value: string }[] = (json.observations ?? []).filter(
    (o: { value: string }) => o.value !== '.' && !isNaN(parseFloat(o.value))
  )
  const history = obs
    .slice()
    .reverse()
    .map(o => ({ date: o.date, value: parseFloat(o.value) }))
  const currentValue = history[history.length - 1]?.value ?? 0
  const previousValue = history[history.length - 2]?.value ?? currentValue
  const changePct = previousValue !== 0
    ? Math.round(((currentValue - previousValue) / previousValue) * 1000) / 10
    : 0
  return {
    indexId: id,
    name,
    currentValue,
    previousValue,
    changePct,
    unit: 'index',
    history,
    spikeAlert: detectSpike(history),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    return res.json([])
  }

  try {
    const { data } = await cached('shipping-rates:all', 3_600_000, async () => {
      const results = await Promise.allSettled(
        Object.entries(SERIES).map(([id, name]) => fetchSeries(apiKey, id, name))
      )
      return results
        .filter((r): r is PromiseFulfilledResult<ShippingIndex> => r.status === 'fulfilled')
        .map(r => r.value)
    })
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch shipping rates' })
  }
}
