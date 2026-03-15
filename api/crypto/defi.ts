import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const TOP_PROTOCOLS = ['Lido', 'EigenLayer', 'Aave', 'MakerDAO', 'Uniswap', 'Curve', 'Compound', 'Pendle']

interface Protocol {
  name: string
  tvl: number
  change24h: number | null
  category: string
  chain: string
}

interface Chain {
  name: string
  tvl: number
  pct: number
}

async function fetchProtocols(): Promise<Protocol[]> {
  const r = await fetch('https://api.llama.fi/protocols', {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!r.ok) throw new Error(`DeFi Llama error: ${r.status}`)
  const data = await r.json() as {
    name: string
    tvl: number
    change_1d?: number
    category?: string
    chain?: string
  }[]

  // Filter to top protocols by name match, then sort by TVL
  const matched = data
    .filter((p) => TOP_PROTOCOLS.some((n) => p.name.toLowerCase().includes(n.toLowerCase())))
    .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
    .slice(0, 8)

  return matched.map((p) => ({
    name: p.name,
    tvl: p.tvl ?? 0,
    change24h: p.change_1d ?? null,
    category: p.category ?? 'DeFi',
    chain: p.chain ?? 'Multi',
  }))
}

async function fetchChains(): Promise<Chain[]> {
  const r = await fetch('https://api.llama.fi/v2/chains', {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!r.ok) throw new Error(`DeFi Llama chains error: ${r.status}`)
  const data = await r.json() as { name: string; tvl: number }[]

  const sorted = [...data].sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0)).slice(0, 8)
  const total = sorted.reduce((s, c) => s + (c.tvl ?? 0), 0)

  return sorted.map((c) => ({
    name: c.name,
    tvl: c.tvl ?? 0,
    pct: total > 0 ? Math.round(((c.tvl ?? 0) / total) * 100) : 0,
  }))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    const { data } = await cached('defi:llama:v1', 300_000, async () => {
      const [protocols, chains] = await Promise.allSettled([fetchProtocols(), fetchChains()])
      return {
        protocols: protocols.status === 'fulfilled' ? protocols.value : [],
        chains: chains.status === 'fulfilled' ? chains.value : [],
      }
    })

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch DeFi data' })
  }
}
