import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const SKIP = new Set([
  'THE', 'FOR', 'AND', 'NOT', 'ARE', 'THIS', 'WITH', 'WHAT', 'FROM', 'HAVE', 'THAT', 'WILL',
  'BEEN', 'MORE', 'WHEN', 'YOUR', 'THEY', 'NEWS', 'JUST', 'INTO', 'OVER', 'ALSO', 'MAKE',
  'LIKE', 'TIME', 'THAN', 'THEM', 'SOME', 'VERY', 'THEN', 'BOTH', 'EACH', 'MUCH', 'SUCH',
  'EVEN', 'MOST', 'WELL', 'ONLY', 'BACK', 'NEED', 'TAKE', 'WORK', 'LONG', 'HERE', 'DOWN',
  'SIDE', 'HIGH', 'KEEP', 'HOLD', 'SELL', 'CALL', 'PUTS', 'YOLO', 'GAIN', 'LOSS', 'BULL',
  'BEAR', 'MOON', 'PUMP', 'DUMP', 'FOMO', 'STOCK', 'TRADE', 'MARKET', 'MONEY', 'SHARE',
  'PRICE', 'WEEK', 'YEAR', 'MONTH', 'RATE', 'FUND', 'CASH', 'DEBT', 'RISK', 'PLAN', 'IDEA',
  'GOOD', 'BEST', 'NEXT', 'SAME', 'LAST', 'REAL', 'USED', 'SAID', 'PART', 'DOES', 'SAYS',
  'IPO', 'ETF', 'GDP', 'CPI', 'FED', 'SEC', 'CEO', 'CFO', 'USA', 'USD', 'DCA', 'ATH', 'ATL',
])

interface RedditPost {
  title: string
  url: string
  score: number
  comments: number
  subreddit: string
  created: number
}

interface TickerMention {
  ticker: string
  mentions: number
  score: number
  posts: { title: string; url: string; score: number; comments: number; subreddit: string }[]
}

interface SocialData {
  tickers: TickerMention[]
  hotPosts: RedditPost[]
  wsbPosts: RedditPost[]
}

function extractTickers(text: string): string[] {
  const matches = text.match(/\b[A-Z]{1,5}\b/g) ?? []
  return matches.filter((m) => !SKIP.has(m))
}

async function fetchSubreddit(sub: string, limit: number): Promise<RedditPost[]> {
  const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=${limit}`, {
    headers: { 'User-Agent': 'MonothFinance/1.0' },
    signal: AbortSignal.timeout(8_000),
  })
  if (!res.ok) throw new Error(`Reddit ${sub}: ${res.status}`)
  const json = await res.json()
  const children = json?.data?.children ?? []
  return children.map((c: { data: Record<string, unknown> }) => ({
    title: String(c.data.title ?? ''),
    url: String(c.data.url ?? ''),
    score: Number(c.data.score ?? 0),
    comments: Number(c.data.num_comments ?? 0),
    subreddit: sub,
    created: Number(c.data.created_utc ?? 0) * 1000,
  }))
}

async function fetchAll(): Promise<SocialData> {
  const [wsb, stocks, investing] = await Promise.allSettled([
    fetchSubreddit('wallstreetbets', 50),
    fetchSubreddit('stocks', 25),
    fetchSubreddit('investing', 25),
  ])

  const wsbPosts = wsb.status === 'fulfilled' ? wsb.value : []
  const stocksPosts = stocks.status === 'fulfilled' ? stocks.value : []
  const investingPosts = investing.status === 'fulfilled' ? investing.value : []

  const allPosts = [...wsbPosts, ...stocksPosts, ...investingPosts]

  const tickerMap = new Map<string, { mentions: number; score: number; posts: RedditPost[] }>()

  for (const post of allPosts) {
    const tickers = new Set(extractTickers(post.title + ' ' + (post.subreddit === 'wallstreetbets' ? '' : '')))
    const weight = post.score + post.comments
    for (const ticker of tickers) {
      const existing = tickerMap.get(ticker) ?? { mentions: 0, score: 0, posts: [] }
      existing.mentions++
      existing.score += weight
      if (existing.posts.length < 3) existing.posts.push(post)
      tickerMap.set(ticker, existing)
    }
  }

  const tickers: TickerMention[] = Array.from(tickerMap.entries())
    .map(([ticker, data]) => ({ ticker, ...data }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)

  const hotPosts = [...allPosts]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  const wsbTop = wsbPosts
    .sort((a, b) => b.score - a.score)

  return { tickers, hotPosts, wsbPosts: wsbTop }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('market:social', 300_000, fetchAll)
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch social data' })
  }
}
