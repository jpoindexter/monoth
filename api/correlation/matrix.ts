import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

interface CorrelationEntry {
  indicator: string
  symbol: string
  beatDirection: number
  missDirection: number
  confidence: number
}

const MATRIX: CorrelationEntry[] = [
  // CPI beat = hot inflation
  { indicator: 'CPI', symbol: 'SPY', beatDirection: -0.6, missDirection: 0.5, confidence: 0.82 },
  { indicator: 'CPI', symbol: 'GLD', beatDirection: 0.4, missDirection: -0.3, confidence: 0.71 },
  { indicator: 'CPI', symbol: 'TLT', beatDirection: -0.7, missDirection: 0.6, confidence: 0.88 },
  { indicator: 'CPI', symbol: 'DXY', beatDirection: 0.5, missDirection: -0.4, confidence: 0.75 },
  { indicator: 'CPI', symbol: 'BTC-USD', beatDirection: -0.3, missDirection: 0.2, confidence: 0.52 },

  // NFP beat = strong jobs
  { indicator: 'NFP', symbol: 'SPY', beatDirection: 0.5, missDirection: -0.5, confidence: 0.78 },
  { indicator: 'NFP', symbol: 'GLD', beatDirection: -0.3, missDirection: 0.2, confidence: 0.60 },
  { indicator: 'NFP', symbol: 'TLT', beatDirection: -0.5, missDirection: 0.4, confidence: 0.80 },
  { indicator: 'NFP', symbol: 'DXY', beatDirection: 0.6, missDirection: -0.5, confidence: 0.77 },
  { indicator: 'NFP', symbol: 'BTC-USD', beatDirection: 0.1, missDirection: -0.1, confidence: 0.35 },

  // FOMC rate hike
  { indicator: 'FOMC_RATE', symbol: 'SPY', beatDirection: -0.7, missDirection: 0.6, confidence: 0.85 },
  { indicator: 'FOMC_RATE', symbol: 'GLD', beatDirection: -0.4, missDirection: 0.3, confidence: 0.68 },
  { indicator: 'FOMC_RATE', symbol: 'TLT', beatDirection: -0.8, missDirection: 0.7, confidence: 0.90 },
  { indicator: 'FOMC_RATE', symbol: 'DXY', beatDirection: 0.7, missDirection: -0.6, confidence: 0.83 },
  { indicator: 'FOMC_RATE', symbol: 'BTC-USD', beatDirection: -0.5, missDirection: 0.4, confidence: 0.65 },

  // GDP beat
  { indicator: 'GDP', symbol: 'SPY', beatDirection: 0.6, missDirection: -0.5, confidence: 0.72 },
  { indicator: 'GDP', symbol: 'GLD', beatDirection: -0.2, missDirection: 0.1, confidence: 0.45 },
  { indicator: 'GDP', symbol: 'TLT', beatDirection: -0.3, missDirection: 0.3, confidence: 0.58 },
  { indicator: 'GDP', symbol: 'DXY', beatDirection: 0.4, missDirection: -0.3, confidence: 0.60 },
  { indicator: 'GDP', symbol: 'BTC-USD', beatDirection: 0.2, missDirection: -0.2, confidence: 0.40 },

  // PCE (Fed's preferred inflation gauge)
  { indicator: 'PCE', symbol: 'SPY', beatDirection: -0.5, missDirection: 0.4, confidence: 0.76 },
  { indicator: 'PCE', symbol: 'GLD', beatDirection: 0.3, missDirection: -0.2, confidence: 0.62 },
  { indicator: 'PCE', symbol: 'TLT', beatDirection: -0.6, missDirection: 0.5, confidence: 0.80 },
  { indicator: 'PCE', symbol: 'DXY', beatDirection: 0.4, missDirection: -0.3, confidence: 0.68 },
  { indicator: 'PCE', symbol: 'BTC-USD', beatDirection: -0.2, missDirection: 0.1, confidence: 0.42 },

  // Retail Sales beat = consumer strength
  { indicator: 'RETAIL_SALES', symbol: 'SPY', beatDirection: 0.4, missDirection: -0.3, confidence: 0.65 },
  { indicator: 'RETAIL_SALES', symbol: 'GLD', beatDirection: -0.1, missDirection: 0.1, confidence: 0.35 },
  { indicator: 'RETAIL_SALES', symbol: 'TLT', beatDirection: -0.3, missDirection: 0.2, confidence: 0.55 },
  { indicator: 'RETAIL_SALES', symbol: 'DXY', beatDirection: 0.3, missDirection: -0.2, confidence: 0.58 },
  { indicator: 'RETAIL_SALES', symbol: 'BTC-USD', beatDirection: 0.1, missDirection: -0.1, confidence: 0.30 },

  // ISM Manufacturing PMI
  { indicator: 'ISM_MFG', symbol: 'SPY', beatDirection: 0.5, missDirection: -0.4, confidence: 0.70 },
  { indicator: 'ISM_MFG', symbol: 'GLD', beatDirection: -0.2, missDirection: 0.2, confidence: 0.48 },
  { indicator: 'ISM_MFG', symbol: 'TLT', beatDirection: -0.3, missDirection: 0.3, confidence: 0.55 },
  { indicator: 'ISM_MFG', symbol: 'DXY', beatDirection: 0.3, missDirection: -0.3, confidence: 0.60 },
  { indicator: 'ISM_MFG', symbol: 'BTC-USD', beatDirection: 0.2, missDirection: -0.2, confidence: 0.38 },
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const { data, stale } = await cached('correlation:matrix', 3_600_000, async () => MATRIX)

  if (stale) res.setHeader('X-Cache', 'STALE')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
  res.json(data)
}
