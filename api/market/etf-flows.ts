import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const ETF_LIST = [
  { ticker: 'IBIT', issuer: 'BlackRock' },
  { ticker: 'FBTC', issuer: 'Fidelity' },
  { ticker: 'GBTC', issuer: 'Grayscale' },
  { ticker: 'ARKB', issuer: 'ARK' },
  { ticker: 'BITB', issuer: 'Bitwise' },
  { ticker: 'EZBC', issuer: 'Franklin' },
  { ticker: 'HODL', issuer: 'VanEck' },
]

const YF_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

async function fetchEtf(ticker: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=5d&interval=1d`
  const res = await fetch(url, {
    headers: { 'User-Agent': YF_UA },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const json = await res.json()
  return json?.chart?.result?.[0] ?? null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    const { data } = await cached('etf-flows', 600_000, async () => {
      const etfs = []
      let misses = 0

      for (const { ticker, issuer } of ETF_LIST) {
        try {
          const result = await fetchEtf(ticker)
          if (!result) { misses++; continue }

          const closes: number[] = result.indicators?.quote?.[0]?.close ?? []
          const volumes: number[] = result.indicators?.quote?.[0]?.volume ?? []

          if (closes.length < 2 || volumes.length < 2) { misses++; continue }

          const latestPrice = closes[closes.length - 1]
          const prevPrice = closes[closes.length - 2]
          const priceChange = ((latestPrice - prevPrice) / prevPrice) * 100

          const latestVolume = volumes[volumes.length - 1]
          const priorVolumes = volumes.slice(0, -1)
          const avgVolume = priorVolumes.reduce((a, b) => a + b, 0) / priorVolumes.length

          const direction =
            priceChange > 0.1 ? 'inflow' : priceChange < -0.1 ? 'outflow' : 'neutral'

          const estFlow = latestVolume * latestPrice * (priceChange > 0 ? 1 : -1) * 0.1

          etfs.push({
            ticker,
            issuer,
            price: latestPrice,
            priceChange,
            volume: latestVolume,
            avgVolume,
            volumeRatio: latestVolume / avgVolume,
            direction,
            estFlow,
          })
        } catch {
          misses++
        }
      }

      if (misses >= 3 && etfs.length === 0) {
        return {
          timestamp: new Date().toISOString(),
          summary: {
            etfCount: 0,
            totalVolume: 0,
            totalEstFlow: 0,
            netDirection: 'UNAVAILABLE' as const,
            inflowCount: 0,
            outflowCount: 0,
          },
          etfs: [],
          rateLimited: true,
        }
      }

      etfs.sort((a, b) => b.volume - a.volume)

      const totalVolume = etfs.reduce((s, e) => s + e.volume, 0)
      const totalEstFlow = etfs.reduce((s, e) => s + e.estFlow, 0)
      const inflowCount = etfs.filter(e => e.direction === 'inflow').length
      const outflowCount = etfs.filter(e => e.direction === 'outflow').length

      const netDirection =
        totalEstFlow > 0 ? 'NET INFLOW' : totalEstFlow < 0 ? 'NET OUTFLOW' : 'NEUTRAL'

      return {
        timestamp: new Date().toISOString(),
        summary: {
          etfCount: etfs.length,
          totalVolume,
          totalEstFlow,
          netDirection,
          inflowCount,
          outflowCount,
        },
        etfs,
        rateLimited: false,
      }
    })

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed' })
  }
}
