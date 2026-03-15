import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

// EIA Open Data API — weekly spot prices for WTI and Brent crude
// Provides official government data vs Yahoo Finance real-time futures
const EIA_BASE = 'https://api.eia.gov/v2/petroleum/pri/spt/data/'

interface EiaObs {
  period: string
  value: string | null
  'product-name': string
  'area-name': string
  units: string
}

async function fetchEia(apiKey: string) {
  const params = new URLSearchParams([
    ['api_key', apiKey],
    ['frequency', 'weekly'],
    ['data[0]', 'value'],
    ['facets[product][]', 'EPCWTI'],
    ['facets[product][]', 'EPCBRENT'],
    ['sort[0][column]', 'period'],
    ['sort[0][direction]', 'desc'],
    ['length', '10'],
  ])
  const r = await fetch(`${EIA_BASE}?${params}`)
  if (!r.ok) throw new Error(`EIA ${r.status}`)
  const json = await r.json()
  return (json.response?.data ?? []) as EiaObs[]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const apiKey = process.env.EIA_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'EIA_API_KEY not configured' })
    return
  }

  try {
    const result = await cached('eia:energy-prices', 3_600_000, async () => {
      const rows = await fetchEia(apiKey)

      // Group by product, take latest 2 observations each for change calc
      const byProduct: Record<string, EiaObs[]> = {}
      for (const row of rows) {
        const key = row['product-name']
        if (!byProduct[key]) byProduct[key] = []
        byProduct[key].push(row)
      }

      return Object.entries(byProduct).map(([name, obs]) => {
        const latest = obs[0]
        const prev = obs[1]
        const price = parseFloat(latest.value ?? '0')
        const prevPrice = parseFloat(prev?.value ?? String(price))
        const change = prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0
        const commodity = name.includes('WTI') ? 'WTI' : name.includes('Brent') ? 'BRENT' : name
        return {
          commodity,
          name: name.includes('WTI') ? 'WTI Crude' : name.includes('Brent') ? 'Brent Crude' : name,
          price,
          unit: latest.units ?? '/bbl',
          change: parseFloat(change.toFixed(2)),
          date: latest.period,
        }
      })
    })

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    res.json(result.data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch EIA energy prices' })
  }
}
