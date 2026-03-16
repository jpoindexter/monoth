import { useState, useCallback, useEffect, useRef } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'

type Tab = 'live' | 'latest' | 'shows' | 'trending'

const LIVE_CHANNELS = [
  { id: 'bloomberg', name: 'Bloomberg TV', channelId: 'UCIALMKvObZNtJ6AmdCLP7Lg', color: 'border-blue-500', desc: '24/7 markets & business', handle: 'BloombergTV' },
  { id: 'cnbc', name: 'CNBC', channelId: 'UCvJJ_dzjViJCoLf5uKUTwoA', color: 'border-yellow-500', desc: 'Markets, investing & earnings', handle: 'CNBCtelevision' },
  { id: 'fox-business', name: 'Fox Business', channelId: 'UCCXoCcu9Rp7NPbTzIvogpZg', color: 'border-red-500', desc: 'Business & financial news', handle: 'FoxBusiness' },
  { id: 'yahoo-finance', name: 'Yahoo Finance', channelId: 'UCEAZeUIeJs0IjQiqTCdVSIg', color: 'border-purple-500', desc: 'Real-time market coverage', handle: 'YahooFinance' },
  { id: 'msnbc', name: 'MSNBC', channelId: 'UCaXkIU1QidjPwiAYu6GcHjg', color: 'border-sky-500', desc: 'News & political coverage', handle: 'MSNBC' },
  { id: 'cnn', name: 'CNN', channelId: 'UCupvZG-5ko_eiXAupbDfxWw', color: 'border-red-700', desc: 'Breaking news & world events', handle: 'CNN' },
  { id: 'bbc-news', name: 'BBC News', channelId: 'UC16niRr50-MSBwiO3YDb3RA', color: 'border-rose-400', desc: 'Global news coverage', handle: 'BBCNews' },
  { id: 'al-jazeera', name: 'Al Jazeera', channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg', color: 'border-amber-500', desc: 'International news', handle: 'AlJazeeraEnglish' },
  { id: 'sky-news', name: 'Sky News', channelId: 'UCoMdktPbSTixAyNGwb-UYkQ', color: 'border-cyan-500', desc: 'UK & world news', handle: 'SkyNews' },
  { id: 'abc-news', name: 'ABC News', channelId: 'UCBi2mrWuNuyYy4gbM6fU18Q', color: 'border-indigo-400', desc: 'US breaking news', handle: 'ABCNews' },
  { id: 'reuters', name: 'Reuters', channelId: 'UChqUTb7kYRX8-EiaN3XFrSQ', color: 'border-orange-400', desc: 'Wire news & markets', handle: 'Reuters' },
  { id: 'ntd', name: 'NTD', channelId: 'UCjz-4y6ts-VF2KSQX-jsnVg', color: 'border-green-400', desc: 'Independent global news', handle: 'NTDNews' },
  { id: 'oann', name: 'OAN', channelId: 'UCNbIDJNNgaRrXOD7VllIMRQ', color: 'border-blue-300', desc: 'One America News Network', handle: 'OANN' },
  { id: 'cnbc-intl', name: 'CNBC Intl', channelId: 'UCo7a6riBFJ3tkeHjvkXVOGojBQ', color: 'border-yellow-300', desc: 'International markets', handle: 'CNBCi' },
]

// All channels for latest videos feed
const CHANNELS = [
  ...LIVE_CHANNELS,
  { id: 'real-vision', name: 'Real Vision', channelId: 'UCXgqMEMGRMcQNStdYCBgPaA', color: 'border-emerald-500', desc: 'Macro & deep dives' },
  { id: 'tasty-trades', name: 'tastylive', channelId: 'UCv1HRYS9_A9NI1xAiUnJGcA', color: 'border-orange-500', desc: 'Options & trading' },
  { id: 'wsj', name: 'Wall Street Journal', channelId: 'UCK7tptUDHh-RYDsdxO1-5QQ', color: 'border-gray-400', desc: 'Finance & business journalism' },
  { id: 'the-street', name: 'TheStreet', channelId: 'UCp6aBHRM6ZS_kLeC57HV4kg', color: 'border-teal-400', desc: 'Stocks & market analysis' },
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

const freqColors: Record<string, string> = {
  'Daily': 'bg-emerald-500/20 text-emerald-500',
  '3x/week': 'bg-blue-500/20 text-blue-400',
  '2x/week': 'bg-blue-500/15 text-blue-300',
  'Weekly': 'bg-muted text-muted-foreground',
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

function LivePlayer({ channelId, handle, volume, playing }: { channelId: string; handle: string; volume: number; playing: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const liveFetcher = useCallback(
    () => fetch(`/api/market/youtube-live?handle=${handle}`)
      .then(r => r.ok ? r.json() as Promise<{ videoId: string | null }> : Promise.resolve({ videoId: null })),
    [handle]
  )
  const rssFetcher = useCallback(
    () => fetch(`/api/market/youtube-feed?channelId=${channelId}`)
      .then(r => r.ok ? r.json() as Promise<{ videos: Video[] }> : Promise.resolve({ videos: [] })),
    [channelId]
  )
  const { data: liveData, loading } = usePolling({ fetcher: liveFetcher, interval: 300_000 })
  const { data: rssData } = usePolling({ fetcher: rssFetcher, interval: 900_000 })

  const videoId = liveData?.videoId ?? rssData?.videos?.find(v => !v.url.includes('/shorts/'))?.id ?? null
  const isLive = !!liveData?.videoId

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [volume] }), '*')
    if (volume === 0) {
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*')
    } else {
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*')
    }
  }, [volume])

  if (loading && !videoId) {
    return <div className="w-full h-full bg-muted/20 rounded-sm animate-pulse" />
  }

  if (!videoId) {
    return (
      <div className="w-full h-full bg-muted/20 rounded-sm flex items-center justify-center">
        <a href={`https://www.youtube.com/@${handle}/live`} target="_blank" rel="noopener noreferrer"
          className="text-[11px] text-blue-400 hover:text-blue-300">Open live stream ↗</a>
      </div>
    )
  }

  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${volume === 0 ? 1 : 0}&controls=0&modestbranding=1&rel=0&enablejsapi=1`

  return (
    <div className="relative w-full h-full rounded-sm overflow-hidden">
      {playing ? (
        <iframe
          ref={iframeRef}
          key={videoId}
          src={src}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center">
          {videoId && (
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              className="w-full h-full object-cover opacity-40"
              alt=""
            />
          )}
          <span className="absolute text-white/40 text-[11px]">Paused</span>
        </div>
      )}
      {isLive && playing && (
        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-red-400 flex items-center gap-0.5 bg-black/50 px-1 py-0.5 rounded-sm">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          LIVE
        </span>
      )}
    </div>
  )
}

function ChannelVideos({ channelId, expanded }: { channelId: string; expanded: boolean }) {
  const fetcher = useCallback(
    () => fetch(`/api/market/youtube-feed?channelId=${channelId}`).then((r) => {
      if (!r.ok) throw new Error('feed failed')
      return r.json() as Promise<{ videos: Video[] }>
    }),
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
        className="text-[10px] text-blue-400 hover:text-blue-300 mt-1 block"
      >
        Latest on YouTube →
      </a>
    )
  }

  return (
    <div className="mt-1 space-y-1">
      {data.videos.slice(0, limit).map((v) => (
        <div key={v.id}>
          <a
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-foreground hover:text-blue-400 line-clamp-1 block leading-snug"
          >
            {v.title}
          </a>
          <span className="text-[9px] text-muted-foreground">{timeAgo(v.published)}</span>
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

function TrendingFeed({ expanded }: { expanded: boolean }) {
  // Pull latest from Bloomberg + CNBC RSS and merge/sort by date
  const bloombergFetcher = useCallback(
    () => fetch('/api/market/youtube-feed?channelId=UCIALMKvObZNtJ6AmdCLP7Lg').then(r => r.ok ? r.json() as Promise<{ videos: Video[] }> : Promise.resolve({ videos: [] })),
    []
  )
  const cnbcFetcher = useCallback(
    () => fetch('/api/market/youtube-feed?channelId=UCvJJ_dzjViJCoLf5uKUTwoA').then(r => r.ok ? r.json() as Promise<{ videos: Video[] }> : Promise.resolve({ videos: [] })),
    []
  )
  const yahooFetcher = useCallback(
    () => fetch('/api/market/youtube-feed?channelId=UCEAZeUIeJs0IjQiqTCdVSIg').then(r => r.ok ? r.json() as Promise<{ videos: Video[] }> : Promise.resolve({ videos: [] })),
    []
  )
  const { data: bloomberg } = usePolling({ fetcher: bloombergFetcher, interval: 900_000 })
  const { data: cnbc } = usePolling({ fetcher: cnbcFetcher, interval: 900_000 })
  const { data: yahoo } = usePolling({ fetcher: yahooFetcher, interval: 900_000 })

  const all = [
    ...(bloomberg?.videos ?? []).map(v => ({ ...v, channel: 'Bloomberg TV' })),
    ...(cnbc?.videos ?? []).map(v => ({ ...v, channel: 'CNBC' })),
    ...(yahoo?.videos ?? []).map(v => ({ ...v, channel: 'Yahoo Finance' })),
  ].sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())

  if (!all.length) {
    return <div className="text-[10px] text-muted-foreground">Loading trending videos...</div>
  }

  const limit = expanded ? 15 : 8

  return (
    <div className="space-y-1.5">
      {all.slice(0, limit).map((v) => (
        <div key={v.id} className="border-t border-border/20 pt-1.5 first:border-t-0 first:pt-0">
          <a
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[10px] font-medium text-foreground hover:text-blue-400 leading-snug block ${expanded ? '' : 'line-clamp-2'}`}
          >
            {v.title}
          </a>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-muted-foreground">{v.channel}</span>
            <span className="text-[10px] text-muted-foreground">{timeAgo(v.published)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MarketVideoPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('live')
  const [activeChannel, setActiveChannel] = useState(LIVE_CHANNELS[0]!.id)
  const [volume, setVolume] = useState(0)
  const [playing, setPlaying] = useState(true)

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const activeChannelData = LIVE_CHANNELS.find(ch => ch.id === activeChannel) ?? LIVE_CHANNELS[0]!

  const videoControls = tab === 'live' ? (
    <>
      <button
        onClick={() => setPlaying(p => !p)}
        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-0.5"
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? '⏸' : '▶'}
      </button>
      <button
        onClick={() => setVolume(v => v === 0 ? 50 : 0)}
        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-0.5"
        title={volume === 0 ? 'Unmute' : 'Mute'}
      >
        {volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊'}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={e => setVolume(Number(e.target.value))}
        className="w-14 h-1 accent-foreground cursor-pointer"
        title={`Volume: ${volume}%`}
      />
    </>
  ) : null

  return (
    <PanelWrapper title="Market Video" noScroll={tab === 'live'} headerActions={videoControls}>
      <div className="flex gap-1 mb-2 items-center">
        <button className={tabCls(tab === 'live')} onClick={() => setTab('live')}>Live</button>
        <button className={tabCls(tab === 'latest')} onClick={() => setTab('latest')}>Latest</button>
        <button className={tabCls(tab === 'trending')} onClick={() => setTab('trending')}>Trending</button>
        <button className={tabCls(tab === 'shows')} onClick={() => setTab('shows')}>Shows</button>
        {tab === 'live' && (
          <div className="flex items-center gap-1 ml-auto">
            <select
              value={activeChannel}
              onChange={e => setActiveChannel(e.target.value)}
              className="text-[10px] bg-muted/40 border border-border/40 rounded-sm px-1.5 py-0.5 text-foreground focus:outline-none focus:border-border/70 cursor-pointer"
            >
              {LIVE_CHANNELS.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
            <a
              href={`https://www.youtube.com/@${activeChannelData.handle}/live`}
              target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >↗</a>
          </div>
        )}
      </div>

      {tab === 'live' && (
        <div className="flex flex-col h-full gap-2" style={{ minHeight: 0 }}>
          <div className="flex-1 min-h-0">
            <LivePlayer
              key={activeChannel}
              channelId={activeChannelData.channelId}
              handle={activeChannelData.handle}
              volume={volume}
              playing={playing}
            />
          </div>
        </div>
      )}

      {tab === 'latest' && (
        <div className="space-y-2">
          {CHANNELS.map((ch) => (
            <div key={ch.id} className={`border-l-2 ${ch.color} pl-2 py-1`}>
              <div className="flex items-start justify-between gap-1">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium text-foreground">{ch.name}</div>
                  <div className="text-[10px] text-muted-foreground">{ch.desc}</div>
                </div>
                <a
                  href={`https://www.youtube.com/channel/${ch.channelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-300 shrink-0"
                >
                  Channel
                </a>
              </div>
              <ChannelVideos channelId={ch.channelId} expanded={expanded} />
            </div>
          ))}
        </div>
      )}

      {tab === 'trending' && <TrendingFeed expanded={expanded} />}

      {tab === 'shows' && (
        <div className="space-y-1.5">
          {[...SHOWS].sort((a, b) => a.freqOrder - b.freqOrder).map((show) => (
            <div key={show.id} className="flex items-start justify-between gap-1">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-foreground">{show.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{show.host}</div>
                <div className="text-[10px] text-muted-foreground">{show.topic}</div>
              </div>
              <span className={`text-[9px] font-medium px-1 py-0.5 rounded-sm shrink-0 ${freqColors[show.freq] ?? 'bg-muted text-muted-foreground'}`}>
                {show.freq}
              </span>
            </div>
          ))}
        </div>
      )}
    </PanelWrapper>
  )
}
