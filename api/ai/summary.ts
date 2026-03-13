import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) {
    return res.status(200).json({ summary: null, reason: 'no_api_key' })
  }

  try {
    const { data, stale } = await cached('ai:market-summary', 1800_000, async () => {
      const [newsRes, cryptoRes] = await Promise.allSettled([
        fetch(`http://localhost:${process.env.PORT ?? 3000}/api/news/rss?category=markets`),
        fetch(`http://localhost:${process.env.PORT ?? 3000}/api/crypto/prices`),
      ])

      const headlines = newsRes.status === 'fulfilled' && newsRes.value.ok
        ? (await newsRes.value.json().catch(() => [])).slice(0, 10).map((n: any) => n.title)
        : []
      const crypto = cryptoRes.status === 'fulfilled' && cryptoRes.value.ok
        ? (await cryptoRes.value.json().catch(() => [])).slice(0, 5)
        : []

      const prompt = `You are a Bloomberg terminal market analyst. Summarize the current market in 3-4 bullet points. Be extremely concise and data-driven. No fluff.

Headlines: ${JSON.stringify(headlines)}
Top Crypto: ${JSON.stringify(crypto.map((c: any) => ({ name: c.name, price: c.current_price, change24h: c.price_change_percentage_24h })))}

Format: bullet points only, each under 20 words.`

      const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 256,
          temperature: 0.3,
        }),
      })

      if (!aiRes.ok) throw new Error(`Groq error: ${aiRes.status}`)
      const aiData = await aiRes.json()
      return {
        summary: aiData.choices?.[0]?.message?.content ?? '',
        generatedAt: Date.now(),
      }
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.json(data)
  } catch {
    res.status(200).json({ summary: null, reason: 'error' })
  }
}
