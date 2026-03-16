import { useState, useCallback, useEffect, useRef } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'

type Tab = 'live' | 'latest' | 'shows' | 'trending'
type Region = 'na' | 'eu' | 'latam' | 'asia' | 'me' | 'africa' | 'oc'

type LiveChannel = {
  id: string
  name: string
  handle: string         // YouTube @handle without the @
  channelId?: string     // For RSS feed
  color: string
  desc: string
  region: Region
  fallbackVideoId?: string
  useFallbackOnly?: boolean
  defaultEnabled?: boolean
}

const ALL_CHANNELS: LiveChannel[] = [
  // North America
  { id: 'bloomberg', name: 'Bloomberg', handle: 'markets', channelId: 'UCIALMKvObZNtJ6AmdCLP7Lg', color: 'border-blue-500', desc: '24/7 markets & business', region: 'na', fallbackVideoId: 'iEpJwprxDdk', defaultEnabled: true },
  { id: 'cnbc', name: 'CNBC', handle: 'CNBC', channelId: 'UCvJJ_dzjViJCoLf5uKUTwoA', color: 'border-yellow-500', desc: 'Markets, investing & earnings', region: 'na', fallbackVideoId: '9NyxcX3rhQs', defaultEnabled: true },
  { id: 'fox-business', name: 'Fox Business', handle: 'FoxBusiness', channelId: 'UCCXoCcu9Rp7NPbTzIvogpZg', color: 'border-red-500', desc: 'Business & financial news', region: 'na', defaultEnabled: true },
  { id: 'yahoo-finance', name: 'Yahoo Finance', handle: 'YahooFinance', channelId: 'UCEAZeUIeJs0IjQiqTCdVSIg', color: 'border-purple-500', desc: 'Real-time market coverage', region: 'na', fallbackVideoId: 'KQp-e_XQnDE', defaultEnabled: true },
  { id: 'msnbc', name: 'MSNBC', handle: 'MSNBC', channelId: 'UCaXkIU1QidjPwiAYu6GcHjg', color: 'border-sky-500', desc: 'News & political coverage', region: 'na', defaultEnabled: true },
  { id: 'cnn', name: 'CNN', handle: 'CNN', channelId: 'UCupvZG-5ko_eiXAupbDfxWw', color: 'border-red-700', desc: 'Breaking news & world events', region: 'na', fallbackVideoId: 'w_Ma8oQLmSM', defaultEnabled: true },
  { id: 'abc-news', name: 'ABC News', handle: 'ABCNews', channelId: 'UCBi2mrWuNuyYy4gbM6fU18Q', color: 'border-indigo-400', desc: 'US breaking news', region: 'na', defaultEnabled: true },
  { id: 'reuters', name: 'Reuters', handle: 'Reuters', channelId: 'UChqUTb7kYRX8-EiaN3XFrSQ', color: 'border-orange-400', desc: 'Wire news & markets', region: 'na', defaultEnabled: true },
  { id: 'ntd', name: 'NTD', handle: 'NTDNews', channelId: 'UCjz-4y6ts-VF2KSQX-jsnVg', color: 'border-green-400', desc: 'Independent global news', region: 'na', defaultEnabled: true },
  { id: 'oann', name: 'OAN', handle: 'OANN', channelId: 'UCNbIDJNNgaRrXOD7VllIMRQ', color: 'border-blue-300', desc: 'One America News', region: 'na', defaultEnabled: true },
  { id: 'cnbc-intl', name: 'CNBC Intl', handle: 'CNBCi', channelId: 'UCo7a6riBFJ3tkeHjvkXVOGojBQ', color: 'border-yellow-300', desc: 'International markets', region: 'na', defaultEnabled: true },
  { id: 'fox-news', name: 'Fox News', handle: 'FoxNews', color: 'border-red-400', desc: 'US news & politics', region: 'na', fallbackVideoId: 'QaftgYkG-ek' },
  { id: 'cbs-news', name: 'CBS News', handle: 'CBSNews', color: 'border-slate-400', desc: 'US network news', region: 'na', fallbackVideoId: 'R9L8sDK8iEc' },
  { id: 'nbc-news', name: 'NBC News', handle: 'NBCNews', color: 'border-cyan-400', desc: 'US network news', region: 'na', fallbackVideoId: 'yMr0neQhu6c' },
  { id: 'cbc-news', name: 'CBC News', handle: 'CBCNews', color: 'border-red-300', desc: 'Canadian public news', region: 'na', fallbackVideoId: 'jxP_h3V-Dv8' },
  // Europe
  { id: 'bbc-news', name: 'BBC News', handle: 'BBCNews', channelId: 'UC16niRr50-MSBwiO3YDb3RA', color: 'border-rose-400', desc: 'UK & world news', region: 'eu', fallbackVideoId: 'bjgQzJzCZKs', defaultEnabled: true },
  { id: 'sky-news', name: 'Sky News', handle: 'SkyNews', channelId: 'UCoMdktPbSTixAyNGwb-UYkQ', color: 'border-cyan-500', desc: 'UK & global news', region: 'eu', fallbackVideoId: 'uvviIF4725I', defaultEnabled: true },
  { id: 'euronews', name: 'Euronews', handle: 'euronews', color: 'border-blue-400', desc: 'European & world news', region: 'eu', fallbackVideoId: 'pykpO5kQJ98' },
  { id: 'dw', name: 'DW News', handle: 'DWNews', color: 'border-indigo-300', desc: 'German international', region: 'eu', fallbackVideoId: 'LuKwFajn37U' },
  { id: 'france24', name: 'France 24', handle: 'FRANCE24', color: 'border-sky-300', desc: 'French international news', region: 'eu', fallbackVideoId: 'u9foWyMSETk' },
  { id: 'france24-en', name: 'France 24 EN', handle: 'France24_en', color: 'border-sky-400', desc: 'France 24 in English', region: 'eu', fallbackVideoId: 'Ap-UM1O9RBU' },
  { id: 'trt-world', name: 'TRT World', handle: 'TRTWorld', color: 'border-green-500', desc: 'Turkish international', region: 'eu', fallbackVideoId: 'ABfFhWzWs0s' },
  { id: 'rtve', name: 'RTVE 24H', handle: 'RTVENoticias', color: 'border-amber-400', desc: 'Spanish public news', region: 'eu', fallbackVideoId: '7_srED6k0bE' },
  // Latin America
  { id: 'cnn-brasil', name: 'CNN Brasil', handle: 'CNNbrasil', color: 'border-green-600', desc: 'Brazilian news', region: 'latam', fallbackVideoId: 'qcTn899skkc' },
  { id: 'tn-argentina', name: 'TN', handle: 'todonoticias', color: 'border-sky-600', desc: 'Argentine news', region: 'latam', fallbackVideoId: 'cb12KmMMDJA' },
  { id: 'milenio', name: 'Milenio', handle: 'MILENIO', color: 'border-red-600', desc: 'Mexican news', region: 'latam' },
  { id: 'noticias-caracol', name: 'Caracol', handle: 'NoticiasCaracol', color: 'border-yellow-600', desc: 'Colombian news', region: 'latam' },
  { id: 'ntn24', name: 'NTN24', handle: 'NTN24', color: 'border-orange-600', desc: 'Latin American news', region: 'latam' },
  // Asia
  { id: 'wion', name: 'WION', handle: 'WION', color: 'border-orange-500', desc: 'Indian global news', region: 'asia' },
  { id: 'ndtv', name: 'NDTV', handle: 'NDTV', color: 'border-amber-400', desc: 'Indian news network', region: 'asia' },
  { id: 'cna', name: 'CNA', handle: 'channelnewsasia', color: 'border-red-400', desc: 'Singapore & Asia news', region: 'asia', fallbackVideoId: 'XWq5kBlakcQ' },
  { id: 'nhk-world', name: 'NHK World', handle: 'NHKWORLDJAPAN', color: 'border-rose-500', desc: 'Japan public broadcaster', region: 'asia', fallbackVideoId: 'f0lYfG_vY_U' },
  { id: 'arirang', name: 'Arirang News', handle: 'ArirangCoKrArirangNEWS', color: 'border-blue-600', desc: 'South Korea international', region: 'asia' },
  { id: 'india-today', name: 'India Today', handle: 'indiatoday', color: 'border-orange-400', desc: 'Indian news network', region: 'asia', fallbackVideoId: 'sYZtOFzM78M' },
  { id: 'tbs-news', name: 'TBS NEWS', handle: 'tbsnewsdig', color: 'border-pink-400', desc: 'Japanese news', region: 'asia', fallbackVideoId: 'aUDm173E8k8' },
  // Middle East
  { id: 'al-jazeera', name: 'Al Jazeera', handle: 'AlJazeeraEnglish', channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg', color: 'border-amber-500', desc: 'Qatari international news', region: 'me', fallbackVideoId: 'gCNeDWCI0vo', useFallbackOnly: true, defaultEnabled: true },
  { id: 'al-arabiya', name: 'Al Arabiya', handle: 'AlArabiya', color: 'border-yellow-600', desc: 'Saudi international news', region: 'me', fallbackVideoId: 'n7eQejkXbnM', useFallbackOnly: true },
  { id: 'sky-arabia', name: 'Sky Arabia', handle: 'skynewsarabia', color: 'border-sky-600', desc: 'Sky News Arabia', region: 'me', fallbackVideoId: 'U--OjmpjF5o' },
  { id: 'trt-world-me', name: 'TRT World', handle: 'TRTWorld', color: 'border-green-600', desc: 'Turkish international', region: 'me', fallbackVideoId: 'ABfFhWzWs0s' },
  { id: 'i24-news', name: 'i24 NEWS', handle: 'i24NEWS_HE', color: 'border-blue-700', desc: 'Israeli international', region: 'me', fallbackVideoId: 'myKybZUK0IA' },
  { id: 'iran-intl', name: 'Iran Intl', handle: 'IranIntl', color: 'border-green-700', desc: 'Iran International TV', region: 'me' },
  // Africa
  { id: 'africanews', name: 'Africanews', handle: 'africanews', color: 'border-yellow-500', desc: 'Pan-African news', region: 'africa' },
  { id: 'channels-tv', name: 'Channels TV', handle: 'ChannelsTelevision', color: 'border-green-500', desc: 'Nigerian news', region: 'africa' },
  { id: 'sabc-news', name: 'SABC News', handle: 'SABCDigitalNews', color: 'border-blue-500', desc: 'South African news', region: 'africa' },
  { id: 'ktn-news', name: 'KTN News', handle: 'ktnnews_kenya', color: 'border-red-500', desc: 'Kenyan news', region: 'africa', fallbackVideoId: 'RmHtsdVb3mo' },
  { id: 'arise-news', name: 'Arise News', handle: 'AriseNewsChannel', color: 'border-amber-500', desc: 'African international', region: 'africa', fallbackVideoId: '4uHZdlX-DT4' },
  // Oceania
  { id: 'abc-au', name: 'ABC Australia', handle: 'abcnewsaustralia', color: 'border-purple-400', desc: 'Australian public news', region: 'oc', fallbackVideoId: 'vOTiJkg1voo' },
]

const REGIONS: { id: Region; label: string }[] = [
  { id: 'na', label: 'North America' },
  { id: 'eu', label: 'Europe' },
  { id: 'latam', label: 'Latin America' },
  { id: 'asia', label: 'Asia' },
  { id: 'me', label: 'Middle East' },
  { id: 'africa', label: 'Africa' },
  { id: 'oc', label: 'Oceania' },
]

const DEFAULT_ENABLED = new Set(ALL_CHANNELS.filter(ch => ch.defaultEnabled).map(ch => ch.id))
const STORAGE_KEY = 'market-video-channels'

// All channels for latest videos feed (those with channelId)
const LATEST_EXTRA = [
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

function LivePlayer({ handle, channelId, volume, playing, fallbackVideoId, useFallbackOnly }: {
  handle: string
  channelId?: string
  volume: number
  playing: boolean
  fallbackVideoId?: string
  useFallbackOnly?: boolean
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const liveFetcher = useCallback(
    () => useFallbackOnly
      ? Promise.resolve({ videoId: null as string | null })
      : fetch(`/api/market/youtube-live?handle=${handle}`)
          .then(r => r.ok ? r.json() as Promise<{ videoId: string | null }> : Promise.resolve({ videoId: null })),
    [handle, useFallbackOnly]
  )
  const rssFetcher = useCallback(
    () => channelId
      ? fetch(`/api/market/youtube-feed?channelId=${channelId}`)
          .then(r => r.ok ? r.json() as Promise<{ videos: Video[] }> : Promise.resolve({ videos: [] }))
      : Promise.resolve({ videos: [] as Video[] }),
    [channelId]
  )
  const { data: liveData, loading: liveLoading } = usePolling({ fetcher: liveFetcher, interval: 300_000 })
  const { data: rssData, loading: rssLoading } = usePolling({ fetcher: rssFetcher, interval: 900_000 })

  const videoId = useFallbackOnly
    ? (fallbackVideoId ?? null)
    : (liveData?.videoId ?? fallbackVideoId ?? rssData?.videos?.find(v => !v.url.includes('/shorts/'))?.id ?? null)
  const isLive = useFallbackOnly ? !!fallbackVideoId : !!liveData?.videoId

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

  if ((!useFallbackOnly && (liveLoading || rssLoading)) && !videoId) {
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
    ...(bloomberg?.videos ?? []).map(v => ({ ...v, channel: 'Bloomberg' })),
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
  const [activeChannel, setActiveChannel] = useState(ALL_CHANNELS.find(ch => ch.defaultEnabled)!.id)
  const [volume, setVolume] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const [enabledIds, setEnabledIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return new Set(JSON.parse(stored) as string[])
    } catch {}
    return new Set(DEFAULT_ENABLED)
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...enabledIds]))
  }, [enabledIds])

  const enabledLiveChannels = ALL_CHANNELS.filter(ch => enabledIds.has(ch.id))

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (enabledLiveChannels.length > 0 && !enabledIds.has(activeChannel)) {
      setActiveChannel(enabledLiveChannels[0]!.id)
    }
  }, [enabledIds])

  const toggleChannel = (id: string) => {
    setEnabledIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const activeChannelData = enabledLiveChannels.find(ch => ch.id === activeChannel) ?? enabledLiveChannels[0]

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const btnCls = 'text-[10px] uppercase tracking-wider font-medium text-muted-foreground hover:text-foreground transition-colors leading-none'

  const videoControls = tab === 'live' ? (
    <div className="flex items-center gap-2">
      <button onClick={() => setPlaying(p => !p)} className={btnCls}>
        {playing ? 'pause' : 'play'}
      </button>
      <button onClick={() => setVolume(v => v === 0 ? 50 : 0)} className={btnCls}>
        {volume === 0 ? 'unmute' : 'mute'}
      </button>
      <div className="flex items-center gap-1">
        <button onClick={() => setVolume(v => Math.max(0, v - 10))} className={btnCls}>−</button>
        <span className="text-[10px] text-muted-foreground tabular-nums w-5 text-center leading-none">{volume}</span>
        <button onClick={() => setVolume(v => Math.min(100, v + 10))} className={btnCls}>+</button>
      </div>
    </div>
  ) : null

  // Latest tab channels: enabled live channels with channelId + extra curated channels
  const latestChannels = [
    ...enabledLiveChannels.filter(ch => ch.channelId),
    ...LATEST_EXTRA,
  ]

  return (
    <PanelWrapper title="Market Video" noScroll={tab === 'live'} headerActions={videoControls}>
      <div className="relative h-full flex flex-col">
        {/* Settings overlay */}
        {showSettings && (
          <div className="absolute inset-0 z-10 bg-background flex flex-col">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-[11px] font-semibold">Live Channels</span>
              <button onClick={() => setShowSettings(false)} className={btnCls}>Done</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
              {REGIONS.map(r => {
                const regionChannels = ALL_CHANNELS.filter(ch => ch.region === r.id)
                return (
                  <div key={r.id}>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">{r.label}</div>
                    <div className="flex flex-wrap gap-1">
                      {regionChannels.map(ch => (
                        <button
                          key={ch.id}
                          onClick={() => toggleChannel(ch.id)}
                          className={`text-[10px] px-1.5 py-0.5 rounded-sm border transition-colors ${
                            enabledIds.has(ch.id)
                              ? 'border-foreground/50 text-foreground'
                              : 'border-border/30 text-muted-foreground hover:border-border/60'
                          }`}
                        >
                          {ch.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Main content */}
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
                {enabledLiveChannels.map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                ))}
              </select>
              {activeChannelData && (
                <a
                  href={`https://www.youtube.com/@${activeChannelData.handle}/live`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >↗</a>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className="text-[11px] text-muted-foreground hover:text-foreground px-0.5"
                title="Manage channels"
              >
                channels
              </button>
            </div>
          )}
        </div>

        {tab === 'live' && activeChannelData && (
          <div className="flex flex-col flex-1 gap-2" style={{ minHeight: 0 }}>
            <div className="flex-1 min-h-0">
              <LivePlayer
                key={activeChannel}
                handle={activeChannelData.handle}
                channelId={activeChannelData.channelId}
                fallbackVideoId={activeChannelData.fallbackVideoId}
                useFallbackOnly={activeChannelData.useFallbackOnly}
                volume={volume}
                playing={playing}
              />
            </div>
          </div>
        )}

        {tab === 'latest' && (
          <div className="space-y-2 flex-1 overflow-y-auto">
            {latestChannels.map((ch) => (
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
                <ChannelVideos channelId={ch.channelId!} expanded={expanded} />
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
      </div>
    </PanelWrapper>
  )
}
