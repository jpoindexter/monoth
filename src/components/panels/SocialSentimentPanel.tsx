import { useState, useCallback } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { tabCls, relTime, fmtVol } from '@/lib/panel-utils'
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'

type Tab = 'tickers' | 'hot' | 'wsb'

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

const SUB_COLORS: Record<string, string> = {
  wallstreetbets: 'bg-red-500/20 text-red-400',
  stocks: 'bg-sky-500/20 text-sky-400',
  investing: 'bg-emerald-500/20 text-emerald-400',
}

function SubBadge({ sub }: { sub: string }) {
  const cls = SUB_COLORS[sub] ?? 'bg-muted text-muted-foreground'
  const label = sub === 'wallstreetbets' ? 'WSB' : sub
  return <span className={`text-[8px] font-bold px-1 py-0.5 rounded-sm shrink-0 ${cls}`}>{label}</span>
}

function PostRow({ post }: { post: RedditPost }) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-0.5 border-b border-border/15 py-1.5 hover:bg-muted/30 rounded-sm px-1 -mx-1 group"
    >
      <div className="flex items-start gap-1.5">
        <SubBadge sub={post.subreddit} />
        <span className="text-[10px] text-foreground line-clamp-2 flex-1 leading-tight">{post.title}</span>
        <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 mt-0.5" />
      </div>
      <div className="flex items-center gap-2 pl-[28px]">
        <span className="text-[9px] text-muted-foreground tabular-nums">▲ {fmtVol(post.score)}</span>
        <span className="text-[9px] text-muted-foreground tabular-nums">💬 {fmtVol(post.comments)}</span>
        <span className="text-[9px] text-muted-foreground/50 ml-auto">{relTime(post.created)}</span>
      </div>
    </a>
  )
}

function TickerRow({ item, rank, maxScore }: { item: TickerMention; rank: number; maxScore: number }) {
  const [open, setOpen] = useState(false)
  const barPct = maxScore > 0 ? (item.score / maxScore) * 100 : 0

  return (
    <div>
      <button
        className="w-full flex items-center gap-2 py-1 hover:bg-muted/30 rounded-sm px-1 -mx-1 border-b border-border/15"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-[9px] text-muted-foreground/50 w-4 tabular-nums text-right shrink-0">{rank}</span>
        <span className="text-[11px] font-bold text-foreground w-12 shrink-0 text-left tabular-nums">{item.ticker}</span>
        <div className="flex-1 h-1 bg-border/20 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500/50 rounded-full" style={{ width: `${barPct}%` }} />
        </div>
        <span className="text-[9px] text-muted-foreground tabular-nums w-12 text-right shrink-0">
          {item.mentions}× · {fmtVol(item.score)}
        </span>
        {open ? <ChevronDown className="w-2.5 h-2.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-2.5 h-2.5 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="pl-6 pb-1 space-y-1">
          {item.posts.slice(0, 3).map((p, i) => (
            <a
              key={i}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-1 group"
            >
              <span className="text-[9px] text-muted-foreground line-clamp-2 flex-1 leading-tight group-hover:text-foreground">{p.title}</span>
              <ExternalLink className="w-2 h-2 text-muted-foreground/40 shrink-0 mt-0.5" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SocialSentimentPanel() {
  const [tab, setTab] = useState<Tab>('tickers')

  const fetcher = useCallback(async (): Promise<SocialData> => {
    const res = await fetch('/api/market/social')
    if (!res.ok) throw new Error('social API error')
    return res.json()
  }, [])

  const { data, loading, error, refresh } = usePolling<SocialData>({
    fetcher,
    interval: 300_000,
  })

  const tickers = data?.tickers ?? []
  const hotPosts = data?.hotPosts ?? []
  const wsbPosts = data?.wsbPosts ?? []
  const maxScore = tickers[0]?.score ?? 1

  return (
    <PanelWrapper
      title="Social Sentiment"
      loading={loading}
      error={error}
      onRetry={refresh}
    >
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'tickers')} onClick={() => setTab('tickers')}>Trending</button>
        <button className={tabCls(tab === 'hot')} onClick={() => setTab('hot')}>Hot Posts</button>
        <button className={tabCls(tab === 'wsb')} onClick={() => setTab('wsb')}>WSB</button>
      </div>

      {tab === 'tickers' && (
        <div className="space-y-0">
          {tickers.length === 0 && (
            <p className="text-[10px] text-muted-foreground py-4 text-center">No data available.</p>
          )}
          {tickers.map((item, i) => (
            <TickerRow key={item.ticker} item={item} rank={i + 1} maxScore={maxScore} />
          ))}
        </div>
      )}

      {tab === 'hot' && (
        <div className="space-y-0">
          {hotPosts.length === 0 && (
            <p className="text-[10px] text-muted-foreground py-4 text-center">No posts available.</p>
          )}
          {hotPosts.map((post, i) => (
            <PostRow key={i} post={post} />
          ))}
        </div>
      )}

      {tab === 'wsb' && (
        <div className="space-y-0">
          {wsbPosts.length === 0 && (
            <p className="text-[10px] text-muted-foreground py-4 text-center">No WSB posts available.</p>
          )}
          {wsbPosts.map((post, i) => (
            <PostRow key={i} post={post} />
          ))}
        </div>
      )}
    </PanelWrapper>
  )
}
