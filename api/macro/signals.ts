import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

interface MacroSignal {
  name: string
  value: number
  label: string
  status: 'bullish' | 'bearish' | 'neutral'
  detail: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    const { data, stale } = await cached('macro-signals', 600_000, async () => {
      const signals: MacroSignal[] = []

      // 1. Fear & Greed Index (free, no auth)
      try {
        const fng = await fetch('https://api.alternative.me/fng/?limit=1')
        const fngData = await fng.json()
        const val = parseInt(fngData.data?.[0]?.value ?? '50')
        const classification = fngData.data?.[0]?.value_classification ?? 'Neutral'
        signals.push({
          name: 'Fear & Greed',
          value: val,
          label: classification,
          status: val >= 60 ? 'bullish' : val <= 40 ? 'bearish' : 'neutral',
          detail: `Index: ${val}/100`,
        })
      } catch {
        signals.push({ name: 'Fear & Greed', value: 50, label: 'N/A', status: 'neutral', detail: 'Unavailable' })
      }

      // 2. BTC Hash Rate (mempool.space, free, no auth)
      try {
        const hr = await fetch('https://mempool.space/api/v1/mining/hashrate/1m')
        const hrData = await hr.json()
        if (hrData.hashrates && hrData.hashrates.length >= 2) {
          const latest = hrData.hashrates[hrData.hashrates.length - 1].avgHashrate
          const prev = hrData.hashrates[0].avgHashrate
          const change = ((latest - prev) / prev) * 100
          signals.push({
            name: 'BTC Hash Rate',
            value: Math.round(change * 10) / 10,
            label: change > 0 ? 'Growing' : 'Declining',
            status: change > 5 ? 'bullish' : change < -5 ? 'bearish' : 'neutral',
            detail: `30d: ${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
          })
        }
      } catch {
        signals.push({ name: 'BTC Hash Rate', value: 0, label: 'N/A', status: 'neutral', detail: 'Unavailable' })
      }

      // 3. DXY strength (use Frankfurter EUR rate as proxy)
      try {
        const past = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
        const [todayRes, pastRes] = await Promise.all([
          fetch(`https://api.frankfurter.app/latest?from=USD&to=EUR`),
          fetch(`https://api.frankfurter.app/${past}?from=USD&to=EUR`),
        ])
        const todayData = await todayRes.json()
        const pastData = await pastRes.json()
        const eurNow = todayData.rates?.EUR
        const eurPast = pastData.rates?.EUR
        if (eurNow && eurPast) {
          // If EUR weakened vs USD, dollar is strengthening (lower EUR per USD = stronger dollar)
          const change = ((eurPast - eurNow) / eurPast) * 100
          signals.push({
            name: 'USD Strength',
            value: Math.round(change * 10) / 10,
            label: change > 0 ? 'Strengthening' : 'Weakening',
            status: change > 2 ? 'bullish' : change < -2 ? 'bearish' : 'neutral',
            detail: `30d: ${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
          })
        }
      } catch {
        signals.push({ name: 'USD Strength', value: 0, label: 'N/A', status: 'neutral', detail: 'Unavailable' })
      }

      // 4. Yield curve signal from existing FRED data
      const apiKey = process.env.FRED_API_KEY
      if (apiKey) {
        try {
          const [dgs2Res, dgs10Res] = await Promise.all([
            fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=DGS2&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`),
            fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`),
          ])
          const dgs2 = await dgs2Res.json()
          const dgs10 = await dgs10Res.json()
          const y2 = parseFloat(dgs2.observations?.[0]?.value)
          const y10 = parseFloat(dgs10.observations?.[0]?.value)
          if (!isNaN(y2) && !isNaN(y10)) {
            const spread = y10 - y2
            signals.push({
              name: 'Yield Curve',
              value: Math.round(spread * 100) / 100,
              label: spread < 0 ? 'Inverted' : spread < 0.5 ? 'Flat' : 'Normal',
              status: spread < 0 ? 'bearish' : spread > 0.5 ? 'bullish' : 'neutral',
              detail: `10Y-2Y: ${spread > 0 ? '+' : ''}${spread.toFixed(2)}%`,
            })
          }
        } catch {}
      }

      // 5. VIX (Yahoo Finance ^VIX)
      try {
        const vixRes = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        })
        const vixData = await vixRes.json()
        const meta = vixData.chart?.result?.[0]?.meta
        if (meta?.regularMarketPrice != null) {
          const level = meta.regularMarketPrice
          signals.push({
            name: 'Volatility',
            value: Math.round(level * 10) / 10,
            label: level > 30 ? 'Elevated Fear' : level < 15 ? 'Low Volatility' : 'Moderate',
            status: level > 30 ? 'bearish' : level < 15 ? 'bullish' : 'neutral',
            detail: `VIX: ${level.toFixed(1)}`,
          })
        }
      } catch {}

      return signals
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch macro signals' })
  }
}
