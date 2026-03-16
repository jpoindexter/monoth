import { useCallback, useEffect, useRef } from 'react'
import { usePolling } from '@/hooks/use-polling'

interface Video {
  id: string
  title: string
  published: string
  url: string
}

interface Props {
  handle: string
  channelId?: string
  volume: number
  playing: boolean
  fallbackVideoId?: string
  useFallbackOnly?: boolean
}

export function VideoLivePlayer({ handle, channelId, volume, playing, fallbackVideoId, useFallbackOnly }: Props) {
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
