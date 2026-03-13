import type { VercelRequest, VercelResponse } from '@vercel/node'

let cache: { result: Record<string, unknown>; expires: number } | null = null

async function ping(url: string): Promise<'up' | 'down'> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) })
    return r.ok ? 'up' : 'down'
  } catch {
    return 'down'
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (cache && Date.now() < cache.expires) {
    return res.json(cache.result)
  }

  const [finnhub, coingecko, fred, frankfurter] = await Promise.all([
    ping('https://finnhub.io/api/v1/quote?symbol=AAPL'),
    ping('https://api.coingecko.com/api/v3/ping'),
    ping('https://api.stlouisfed.org/fred/series?series_id=GDP&api_key=public&file_type=json'),
    ping('https://api.frankfurter.app/latest?from=USD&to=EUR'),
  ])

  const result = {
    status: 'ok',
    services: { finnhub, coingecko, fred, frankfurter },
    timestamp: new Date().toISOString(),
  }

  cache = { result, expires: Date.now() + 5 * 60 * 1000 }
  res.json(result)
}
