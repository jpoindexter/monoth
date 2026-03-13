import { useState, useCallback, useEffect } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'

interface MacroSignal {
  name: string
  value: number
  label: string
  status: 'bullish' | 'bearish' | 'neutral'
  detail: string
}

const STATUS_COLORS: Record<string, string> = {
  bullish: 'text-emerald-600',
  bearish: 'text-red-500',
  neutral: 'text-muted-foreground',
}

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function CentralBanksPanel() {
  const [tab, setTab] = useState<'signals' | 'news'>('signals')
  const { data: newsData, loading: newsLoading, error, refresh } = useNewsData('centralbanks')
  const { data: signals, loading: sigLoading } = usePolling<MacroSignal[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/macro/signals')
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      return res.json()
    }, []),
    interval: 600_000,
    enabled: tab === 'signals',
  })

  useEffect(() => {
    if (!sigLoading && signals != null && !signals.length && tab === 'signals') {
      setTab('news')
    }
  }, [sigLoading, signals, tab])

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Central Bank Watch" loading={newsLoading && sigLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'signals')} onClick={() => setTab('signals')}>Signals</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'signals' && (
        <div className="space-y-1.5">
          {signals?.map((s) => (
            <div key={s.name} className="flex items-center justify-between py-0.5 border-b border-border/20 last:border-0">
              <div>
                <span className="text-[11px] font-medium">{s.name}</span>
                <span className="text-[10px] text-muted-foreground ml-1.5">{s.detail}</span>
              </div>
              <span className={`text-[10px] font-medium uppercase tracking-wider ${STATUS_COLORS[s.status]}`}>
                {s.label}
              </span>
            </div>
          ))}
          {!signals?.length && !sigLoading && (
            <div className="py-4 text-center text-[10px] text-muted-foreground">
              No data available. Refreshes automatically.
            </div>
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
