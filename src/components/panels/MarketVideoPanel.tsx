import { useState, useEffect } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { tabClsPill } from '@/lib/panel-utils'
import { ALL_CHANNELS, DEFAULT_ENABLED, STORAGE_KEY, LATEST_EXTRA } from './VideoChannelData'
import { VideoLivePlayer } from './VideoLivePlayer'
import { VideoChannelSettings } from './VideoChannelSettings'
import { VideoLatestTab } from './VideoLatestTab'
import { VideoTrendingTab } from './VideoTrendingTab'
import { VideoShowsTab } from './VideoShowsTab'

type Tab = 'live' | 'latest' | 'shows' | 'trending'

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


  const btnCls = 'text-[10px] uppercase tracking-wider font-medium text-muted-foreground hover:text-foreground transition-colors leading-none'

  const latestChannels = [
    ...enabledLiveChannels.filter(ch => ch.channelId),
    ...LATEST_EXTRA,
  ]

  const videoControls = tab === 'live' ? (
    <div className="flex items-center gap-2">
      <button onClick={() => setPlaying(p => !p)} className={btnCls}>
        {playing ? 'pause' : 'play'}
      </button>
      <button onClick={() => setVolume(v => v === 0 ? 50 : 0)} className={btnCls}>
        {volume === 0 ? 'unmute' : 'mute'}
      </button>
    </div>
  ) : null

  return (
    <PanelWrapper title="Market Video" noScroll={tab === 'live'} headerActions={videoControls}>
      <div className="relative h-full flex flex-col">
        {showSettings && (
          <VideoChannelSettings
            enabledIds={enabledIds}
            toggleChannel={toggleChannel}
            onClose={() => setShowSettings(false)}
            btnCls={btnCls}
          />
        )}

        <div className="flex gap-1 mb-2 items-center">
          <button className={tabClsPill(tab === 'live')} onClick={() => setTab('live')}>Live</button>
          <button className={tabClsPill(tab === 'latest')} onClick={() => setTab('latest')}>Latest</button>
          <button className={tabClsPill(tab === 'trending')} onClick={() => setTab('trending')}>Trending</button>
          <button className={tabClsPill(tab === 'shows')} onClick={() => setTab('shows')}>Shows</button>
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
              <VideoLivePlayer
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

        {tab === 'latest' && <VideoLatestTab channels={latestChannels} expanded={expanded} />}

        {tab === 'trending' && <VideoTrendingTab expanded={expanded} />}

        {tab === 'shows' && <VideoShowsTab />}
      </div>
    </PanelWrapper>
  )
}
