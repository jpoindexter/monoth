import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [volume] }), '*')
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: volume === 0 ? 'mute' : 'unMute', args: [] }),
      '*'
    )
  }, [volume])

  // Channels with channelId get YouTube's native live_stream embed — no server scraping needed.
  // Channels with useFallbackOnly or no channelId use fallbackVideoId.
  const useChannelEmbed = !!channelId && !useFallbackOnly
  const videoId = fallbackVideoId ?? null

  if (!useChannelEmbed && !videoId) {
    return (
      <div className="w-full h-full bg-muted/20 rounded-sm flex items-center justify-center">
        <a
          href={`https://www.youtube.com/@${handle}/live`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-blue-400 hover:text-blue-300"
        >
          Open live stream ↗
        </a>
      </div>
    )
  }

  const mute = volume === 0 ? 1 : 0
  const commonParams = `autoplay=1&mute=${mute}&controls=0&modestbranding=1&rel=0&enablejsapi=1`
  const src = useChannelEmbed
    ? `https://www.youtube.com/embed/live_stream?channel=${channelId}&${commonParams}`
    : `https://www.youtube.com/embed/${videoId}?${commonParams}`

  return (
    <div className="relative w-full h-full rounded-sm overflow-hidden">
      {playing ? (
        <iframe
          ref={iframeRef}
          key={useChannelEmbed ? `live-${channelId}` : videoId}
          src={src}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center">
          {!useChannelEmbed && videoId && (
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              className="w-full h-full object-cover opacity-40"
              alt=""
            />
          )}
          <span className="absolute text-white/40 text-[11px]">Paused</span>
        </div>
      )}
      {playing && useChannelEmbed && (
        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-red-400 flex items-center gap-0.5 bg-black/50 px-1 py-0.5 rounded-sm">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          LIVE
        </span>
      )}
    </div>
  )
}
