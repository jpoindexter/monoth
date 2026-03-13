import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors'
import { cached } from '../_cache'

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  if (d.getDay() === 0) d.setDate(d.getDate() - 2)
  if (d.getDay() === 6) d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('forex-rates', 300_000, async () => {
      const [latest, yesterday] = await Promise.all([
        fetch('https://api.frankfurter.app/latest?from=USD').then((r) => r.json()),
        fetch(`https://api.frankfurter.app/${getYesterday()}?from=USD`).then((r) => r.json()),
      ])
      return Object.entries(latest.rates).map(([currency, rate]) => {
        const prevRate = (yesterday.rates as Record<string, number>)[currency] ?? rate
        const change = (rate as number) - prevRate
        return {
          pair: `USD/${currency}`,
          rate: rate as number,
          change,
          changePercent: prevRate ? (change / prevRate) * 100 : 0,
          timestamp: Date.now(),
        }
      })
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch forex rates' })
  }
}
