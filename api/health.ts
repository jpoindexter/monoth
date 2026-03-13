import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      finnhub: 'unchecked',
      coingecko: 'unchecked',
      fred: 'unchecked',
      frankfurter: 'unchecked',
    },
  })
}
