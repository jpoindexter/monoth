import { useState, useCallback } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'

type Tab = 'latest' | 'shows' | 'trending' | 'learn'

const CHANNELS = [
  { id: 'bloomberg', name: 'Bloomberg TV', channelId: 'UCIALMKvObZNtJ6AmdCLP7Lg', color: 'border-blue-500', desc: '24/7 markets & business' },
  { id: 'cnbc', name: 'CNBC', channelId: 'UCvJJ_dzjViJCoLf5uKUTwoA', color: 'border-yellow-500', desc: 'Markets & investing' },
  { id: 'yahoo-finance', name: 'Yahoo Finance', channelId: 'UCEAZeUIeJs0IjQiqTCdVSIg', color: 'border-purple-500', desc: 'Real-time coverage' },
  { id: 'fox-business', name: 'Fox Business', channelId: 'UCF9IOB2TExg3QIBupFtBDxg', color: 'border-red-500', desc: 'Business news' },
  { id: 'real-vision', name: 'Real Vision', channelId: 'UCXgqMEMGRMcQNStdYCBgPaA', color: 'border-emerald-500', desc: 'Macro & deep dives' },
  { id: 'tasty-trades', name: 'tastylive', channelId: 'UCv1HRYS9_A9NI1xAiUnJGcA', color: 'border-orange-500', desc: 'Options & trading' },
]

const SHOWS = [
  { id: 1, name: 'Real Vision', host: 'Real Vision', topic: 'Macro & markets', freq: 'Daily', freqOrder: 0 },
  { id: 2, name: 'The Compound', host: 'Josh Brown & Michael Batnick', topic: 'Market commentary', freq: 'Daily', freqOrder: 0 },
  { id: 3, name: 'Bankless', host: 'Ryan & David', topic: 'Crypto & DeFi', freq: '3x/week', freqOrder: 1 },
  { id: 4, name: 'Odd Lots', host: 'Bloomberg', topic: 'Economics deep dives', freq: '2x/week', freqOrder: 2 },
  { id: 5, name: 'All-In Podcast', host: 'Chamath & friends', topic: 'Tech & investing', freq: 'Weekly', freqOrder: 3 },
  { id: 6, name: 'The Prof G Pod', host: 'Scott Galloway', topic: 'Markets & tech', freq: 'Weekly', freqOrder: 3 },
  { id: 7, name: 'Invest Like the Best', host: 'Patrick OShaughnessy', topic: 'Investing frameworks', freq: 'Weekly', freqOrder: 3 },
  { id: 8, name: 'Chat With Traders', host: 'Aaron Fifield', topic: 'Trading strategies', freq: 'Weekly', freqOrder: 3 },
]

const TRENDING = [
  { id: 1, title: 'AI stocks surge as Nvidia beats on data center revenue', channel: 'Bloomberg TV', views: '312K views', time: '1h ago', topic: 'Earnings' },
  { id: 2, title: 'Trump tariffs on China: how markets are pricing the risk', channel: 'CNBC', views: '278K views', time: '2h ago', topic: 'Macro' },
  { id: 3, title: 'Fed holds rates — Powell signals no cuts until inflation cools', channel: 'Yahoo Finance', views: '201K views', time: '3h ago', topic: 'Macro' },
  { id: 4, title: 'Bitcoin breaks $100K again: what drives this rally', channel: 'Real Vision', views: '165K views', time: '4h ago', topic: 'Crypto' },
  { id: 5, title: 'DeepSeek vs OpenAI: what the AI war means for US tech stocks', channel: 'Bloomberg TV', views: '143K views', time: '5h ago', topic: 'Analysis' },
  { id: 6, title: 'Options expiry this Friday: key levels for S&P 500', channel: 'tastylive', views: '98K views', time: '6h ago', topic: 'Trading' },
  { id: 7, title: 'Solana ETF filing: next crypto domino to fall?', channel: 'Bankless', views: '87K views', time: '8h ago', topic: 'Crypto' },
  { id: 8, title: 'Recession watch: yield curve, PMI, and what the data says', channel: 'Odd Lots', views: '74K views', time: '10h ago', topic: 'Macro' },
  { id: 9, title: 'Energy stocks lagging despite oil spike — buy the dip?', channel: 'Fox Business', views: '52K views', time: '1d ago', topic: 'Commodities' },
  { id: 10, title: 'Buffett sells more Apple — what Berkshire is positioning for', channel: 'Invest Like the Best', views: '41K views', time: '1d ago', topic: 'Analysis' },
]

const TRACKS = [
  { id: 1, name: 'Options Trading 101', videos: 12, difficulty: 'Beginner', progress: 0 },
  { id: 2, name: 'Technical Analysis', videos: 8, difficulty: 'Intermediate', progress: 25 },
  { id: 3, name: 'Macro Economics', videos: 10, difficulty: 'Intermediate', progress: 40 },
  { id: 4, name: 'Crypto & DeFi', videos: 15, difficulty: 'Beginner', progress: 60 },
  { id: 5, name: 'Portfolio Management', videos: 9, difficulty: 'Advanced', progress: 10 },
  { id: 6, name: 'Risk Management', videos: 7, difficulty: 'Advanced', progress: 0 },
]

const freqColors: Record<string, string> = {
  'Daily': 'bg-emerald-500/20 text-emerald-500',
  '3x/week': 'bg-blue-500/20 text-blue-400',
  '2x/week': 'bg-blue-500/15 text-blue-300',
  'Weekly': 'bg-muted text-muted-foreground',
}

const topicColors: Record<string, string> = {
  'Macro': 'bg-blue-500/20 text-blue-400',
  'Earnings': 'bg-yellow-500/20 text-yellow-500',
  'Crypto': 'bg-purple-500/20 text-purple-400',
  'Trading': 'bg-orange-500/20 text-orange-400',
  'Analysis': 'bg-emerald-500/20 text-emerald-500',
  'Commodities': 'bg-amber-500/20 text-amber-400',
}

const diffColors: Record<string, string> = {
  'Beginner': 'bg-emerald-500/20 text-emerald-500',
  'Intermediate': 'bg-yellow-500/20 text-yellow-500',
  'Advanced': 'bg-red-500/20 text-red-400',
}

interface Video {
  id: string
  title: string
  published: string
  url: string
}

function timeAgo(published: string): string {
  const ms = Date.now() - new Date(published).getTime()
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function ChannelVideos({ channelId, channelName, expanded }: { channelId: string; channelName: string; expanded: boolean }) {
  const fetcher = useCallback(
    () => fetch(`/api/market/youtube-feed?channelId=${channelId}`).then((r) => r.json() as Promise<{ videos: Video[] }>),
    [channelId]
  )
  const { data, loading, error } = usePolling({ fetcher, interval: 900_000 })

  const limit = expanded ? 3 : 2

  if (loading) {
    return (
      <div className="space-y-1 mt-1">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-3 bg-muted/50 rounded animate-pulse w-full" />
        ))}
      </div>
    )
  }

  if (error || !data?.videos?.length) {
    return (
      <a
        href={`https://www.youtube.com/channel/${channelId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[9px] text-blue-400 hover:text-blue-300 mt-1 block"
      >
        Latest on YouTube →
      </a>
    )
  }

  const videos = data.videos.slice(0, limit)

  return (
    <div className="mt-1 space-y-1">
      {videos.map((v) => (
        <div key={v.id}>
          <a
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-foreground hover:text-blue-400 line-clamp-1 block leading-snug"
          >
            {v.title}
          </a>
          <span className="text-[8px] text-muted-foreground">{timeAgo(v.published)}</span>
          {expanded && (
            <div className="mt-1 mb-1">
              <iframe
                src={`https://www.youtube.com/embed/${v.id}`}
                className="w-full rounded-sm"
                height={160}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function MarketVideoPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('latest')

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const sortedShows = [...SHOWS].sort((a, b) => a.freqOrder - b.freqOrder)

  return (
    <PanelWrapper title="Market Video">
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'latest')} onClick={() => setTab('latest')}>Latest</button>
        <button className={tabCls(tab === 'shows')} onClick={() => setTab('shows')}>Shows</button>
        <button className={tabCls(tab === 'trending')} onClick={() => setTab('trending')}>Trending</button>
        <button className={tabCls(tab === 'learn')} onClick={() => setTab('learn')}>Learn</button>
      </div>

      {tab === 'latest' && (
        <div className="space-y-2">
          {CHANNELS.map((ch) => (
            <div key={ch.id} className={`border-l-2 ${ch.color} pl-2 py-1`}>
              <div className="flex items-start justify-between gap-1">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium text-foreground leading-tight">{ch.name}</div>
                  <div className="text-[9px] text-muted-foreground">{ch.desc}</div>
                </div>
                <a
                  href={`https://www.youtube.com/channel/${ch.channelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-blue-400 hover:text-blue-300 shrink-0"
                >
                  Channel
                </a>
              </div>
              <ChannelVideos channelId={ch.channelId} channelName={ch.name} expanded={expanded} />
            </div>
          ))}
        </div>
      )}

      {tab === 'shows' && (
        <div className="space-y-1.5">
          {sortedShows.map((show) => (
            <div key={show.id} className="flex items-start justify-between gap-1">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-foreground leading-tight">{show.name}</div>
                <div className="text-[9px] text-muted-foreground truncate">{show.host}</div>
                <div className="text-[9px] text-muted-foreground">{show.topic}</div>
              </div>
              <span className={`text-[8px] font-medium px-1 py-0.5 rounded-sm shrink-0 ${freqColors[show.freq] ?? 'bg-muted text-muted-foreground'}`}>
                {show.freq}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'trending' && (
        <div className="space-y-1.5">
          {TRENDING.map((v) => (
            <div key={v.id} className="border-t border-border/20 pt-1.5 first:border-t-0 first:pt-0">
              <div className={`text-[10px] font-medium text-foreground leading-snug ${expanded ? '' : 'line-clamp-2'}`}>{v.title}</div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`text-muted-foreground ${expanded ? 'text-[10px] font-medium' : 'text-[9px]'}`}>{v.channel}</span>
                <span className="text-[9px] text-muted-foreground">{v.views}</span>
                <span className="text-[9px] text-muted-foreground">{v.time}</span>
                <span className={`text-[8px] px-1 py-0 rounded-sm ${topicColors[v.topic] ?? 'bg-muted text-muted-foreground'}`}>
                  {v.topic}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'learn' && (
        <div className="space-y-2">
          {TRACKS.map((track) => (
            <div key={track.id}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-medium text-foreground">{track.name}</span>
                <span className={`text-[8px] font-medium px-1 py-0 rounded-sm ${diffColors[track.difficulty]}`}>
                  {track.difficulty}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${track.progress}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground shrink-0">{track.videos} videos</span>
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">{track.progress}% complete</div>
            </div>
          ))}
        </div>
      )}
    </PanelWrapper>
  )
}
