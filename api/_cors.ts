import type { VercelRequest, VercelResponse } from '@vercel/node'

const ALLOWED_ORIGINS = [
  /^https:\/\/(www\.monoth\.app|app\.monoth\.app)$/,
  /^https:\/\/monoth\.app$/,
  /^https:\/\/monoth(-[a-z0-9-]+)?\.vercel\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
]

export function cors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin ?? ''
  const allowed = ALLOWED_ORIGINS.some((re) => re.test(origin))
  if (allowed) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}
