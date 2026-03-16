import { useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'

interface Video {
  id: string
  title: string
  published: string
  url: string
  channel?: string
}

function timeAgo(published: string): string {
  const ms = Date.now() - new Date(published).getTime()
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function VideoTrendingTab({ expanded }: { expanded: boolean }) {
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
            href={v.url} target="_blank" rel="noopener noreferrer"
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
