import { useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'

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
        target="_blank" rel="noopener noreferrer"
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
          <a href={v.url} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-foreground hover:text-blue-400 line-clamp-1 block leading-snug">
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

interface LatestChannel {
  id: string
  name: string
  channelId?: string
  color: string
  desc: string
}

interface Props {
  channels: LatestChannel[]
  expanded: boolean
}

export function VideoLatestTab({ channels, expanded }: Props) {
  return (
    <div className="space-y-2 flex-1 overflow-y-auto">
      {channels.map((ch) => (
        <div key={ch.id} className={`border-l-2 ${ch.color} pl-2 py-1`}>
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium text-foreground">{ch.name}</div>
              <div className="text-[10px] text-muted-foreground">{ch.desc}</div>
            </div>
            <a
              href={`https://www.youtube.com/channel/${ch.channelId}`}
              target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-blue-400 hover:text-blue-300 shrink-0"
            >
              Channel
            </a>
          </div>
          <ChannelVideos channelId={ch.channelId!} expanded={expanded} />
        </div>
      ))}
    </div>
  )
}
