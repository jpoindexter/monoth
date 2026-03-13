import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  const symbols = (req.query.symbols as string)?.split(',').filter(Boolean) ?? []
  if (!symbols.length) return res.status(400).json({ error: 'symbols param required' })
  try {
    const quotes = await cached(`quote:${symbols.join(',')}`, 30_000, async () => {
      const batches: string[][] = []
      for (let i = 0; i < symbols.length; i += 20) batches.push(symbols.slice(i, i + 20))
      const results: object[] = []
      for (const batch of batches) {
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${batch.map(encodeURIComponent).join(',')}&fields=symbol,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume`
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } })
        if (!r.ok) throw new Error(`Yahoo Finance error: ${r.status}`)
        const json = await r.json()
        for (const q of json.quoteResponse?.result ?? []) {
          results.push({
            symbol: q.symbol, price: q.regularMarketPrice, change: q.regularMarketChange,
            changePercent: q.regularMarketChangePercent, volume: q.regularMarketVolume ?? 0,
            timestamp: Date.now(), source: 'yahoo',
          })
        }
      }
      return results
    })
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    res.json(quotes.data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch quotes' })
  }
}
