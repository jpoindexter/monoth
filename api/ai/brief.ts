import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cached } from '../_cache.js'
import { requireAuth } from '../_auth.js'

const ALLOWED_ORIGINS = [
  /^https?:\/\/.*\.monoth\.app$/,
  /^https?:\/\/monoth\.app$/,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/monoth(-[a-z0-9-]+)?\.vercel\.app$/,
]

function cors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin ?? ''
  const allowed = ALLOWED_ORIGINS.some((re) => re.test(origin))
  if (allowed) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}

const HOUR_MS = 60 * 60 * 1000

async function fetchMarketSnapshot() {
  const [indicesRes, cryptoRes, forexRes] = await Promise.allSettled([
    fetch(`${process.env.VITE_API_BASE ?? ''}/api/market/indices`),
    fetch(`${process.env.VITE_API_BASE ?? ''}/api/crypto`),
    fetch(`${process.env.VITE_API_BASE ?? ''}/api/forex`),
  ])

  const indices = indicesRes.status === 'fulfilled' && indicesRes.value.ok
    ? await indicesRes.value.json().catch(() => [])
    : []
  const crypto = cryptoRes.status === 'fulfilled' && cryptoRes.value.ok
    ? await cryptoRes.value.json().catch(() => [])
    : []
  const forex = forexRes.status === 'fulfilled' && forexRes.value.ok
    ? await forexRes.value.json().catch(() => [])
    : []

  return { indices, crypto, forex }
}

function buildPrompt(market: { indices: unknown[]; crypto: unknown[]; forex: unknown[] }): string {
  const fmt = (arr: unknown[]) => JSON.stringify(arr.slice(0, 5))
  return `You are a concise financial analyst. Based on current market data, provide a brief (3-4 paragraph) market intelligence summary.

Market snapshot:
- Equity indices: ${fmt(market.indices)}
- Crypto (top 5): ${fmt(market.crypto)}
- Forex: ${fmt(market.forex)}

Focus on: key trends, notable movers, cross-asset correlations, and one actionable insight. Be direct and professional. No disclaimers.`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = await requireAuth(req, res)
  if (!userId) return

  const userKey = `ai:brief:${userId}`

  try {
    const { data, stale } = await cached<{ brief: string; generatedAt: number }>(
      userKey,
      HOUR_MS,
      async () => {
        const market = await fetchMarketSnapshot()
        const prompt = buildPrompt(market)

        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 512,
            messages: [{ role: 'user', content: prompt }],
          }),
        })

        if (!aiRes.ok) {
          const body = await aiRes.json().catch(() => ({}))
          throw new Error(body.error?.message ?? `Anthropic error ${aiRes.status}`)
        }

        const aiData = await aiRes.json()
        const brief = aiData.content?.[0]?.text ?? ''
        return { brief, generatedAt: Date.now() }
      }
    )

    return res.status(200).json({ ...data, stale })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
}
