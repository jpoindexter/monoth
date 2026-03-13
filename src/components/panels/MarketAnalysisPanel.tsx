import { useState, useCallback } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'

interface CorrelationEvent {
  event: string
  actual: number
  estimate: number
  surprise: number
  date: string
}

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function MarketAnalysisPanel() {
  const [tab, setTab] = useState<'events' | 'news'>('news')
  const { data: newsData, loading: newsLoading, error, refresh } = useNewsData('analysis')
  const { data: events, loading: evLoading } = usePolling<CorrelationEvent[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/correlation/events')
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      return res.json()
    }, []),
    interval: 600_000,
    enabled: tab === 'events',
  })

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Market Analysis" loading={newsLoading && evLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'events')} onClick={() => setTab('events')}>Surprises</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'events' && (
        <div className="space-y-0">
          {events?.slice(0, 15).map((ev, i) => {
            const isPositive = ev.surprise > 0
            return (
              <div key={`${ev.event}-${i}`} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium truncate block">{ev.event}</span>
                  <span className="text-[9px] text-muted-foreground">{ev.date}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    Est {ev.estimate.toFixed(2)} / Act {ev.actual.toFixed(2)}
                  </span>
                  <span className={`ml-1.5 text-[10px] tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{ev.surprise.toFixed(2)}
                  </span>
                </div>
              </div>
            )
          })}
          {!events?.length && !evLoading && (
            <p className="text-[10px] text-muted-foreground">No recent economic events</p>
          )}
        </div>
      )}

      {tab === 'news' && (
        <div className="space-y-0">
          {newsData?.map((item) => {
            const cls = classifyHeadline(item.title)
            return (
              <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-1 px-1 rounded-sm transition-colors">
                <div className="flex-1 min-w-0">
                  {cls && (
                    <span className="inline-block text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                      style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}>
                      {CATEGORY_LABELS[cls.category]}
                    </span>
                  )}
                  <span className="text-[11px] font-medium leading-snug text-foreground line-clamp-2">{item.title}</span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">{relTime(item.published)}</span>
              </a>
            )
          })}
        </div>
      )}
    </PanelWrapper>
  )
}
