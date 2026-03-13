import { useState, useMemo } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function extractDomain(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return host.split('.')[0]
  } catch {
    return '?'
  }
}

function timeGroup(ts: number): 'Last Hour' | 'Today' | 'Yesterday' | 'Older' {
  const diff = Date.now() - ts
  if (diff < 3_600_000) return 'Last Hour'
  if (diff < 86_400_000) return 'Today'
  if (diff < 172_800_000) return 'Yesterday'
  return 'Older'
}

type Priority = 'All' | 'Breaking' | 'Important'
const PRIORITIES: Priority[] = ['All', 'Breaking', 'Important']

const SOURCE_COLORS = [
  'bg-blue-500/20 text-blue-400',
  'bg-purple-500/20 text-purple-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-orange-500/20 text-orange-400',
  'bg-pink-500/20 text-pink-400',
  'bg-cyan-500/20 text-cyan-400',
  'bg-yellow-500/20 text-yellow-400',
]

export default function HeadlinesPanel() {
  const [priority, setPriority] = useState<Priority>('All')
  const { data, loading, error, refresh } = useNewsData('markets')

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const sourceColorMap = useMemo(() => {
    const map = new Map<string, string>()
    let i = 0
    data?.forEach((item) => {
      const domain = extractDomain(item.url)
      if (!map.has(domain)) {
        map.set(domain, SOURCE_COLORS[i % SOURCE_COLORS.length])
        i++
      }
    })
    return map
  }, [data])

  const uniqueSources = sourceColorMap.size

  const filtered = useMemo(() => {
    if (!data) return []
    return data.filter((item) => {
      if (priority === 'All') return true
      const cls = classifyHeadline(item.title)
      if (priority === 'Breaking') return cls && (cls.level === 'critical' || cls.level === 'high')
      if (priority === 'Important') return cls && cls.level === 'medium'
      return true
    })
  }, [data, priority])

  const grouped = useMemo(() => {
    const order: Array<'Last Hour' | 'Today' | 'Yesterday' | 'Older'> = ['Last Hour', 'Today', 'Yesterday', 'Older']
    const map = new Map<string, typeof filtered>()
    for (const g of order) map.set(g, [])
    for (const item of filtered) {
      const g = timeGroup(item.published)
      map.get(g)!.push(item)
    }
    return order.filter((g) => map.get(g)!.length > 0).map((g) => ({ label: g, items: map.get(g)! }))
  }, [filtered])

  const breakingCount = useMemo(
    () => data?.filter((item) => Date.now() - item.published < 1_800_000).length ?? 0,
    [data]
  )

  return (
    <PanelWrapper title="Headlines" loading={loading} error={error} onRetry={refresh}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          {PRIORITIES.map((p) => (
            <button key={p} className={tabCls(priority === p)} onClick={() => setPriority(p)}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {uniqueSources > 0 && (
            <span className="text-[8px] text-muted-foreground/60">
              Sources: {uniqueSources} feed{uniqueSources !== 1 ? 's' : ''}
            </span>
          )}
          {breakingCount > 0 && (
            <span className="text-[8px] font-bold text-red-500 animate-pulse">{breakingCount} NEW</span>
          )}
        </div>
      </div>

      <div className="space-y-0">
        {grouped.map(({ label, items }) => (
          <div key={label}>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold py-1 border-b border-border/30">
              {label}
            </div>
            {items.map((item) => {
              const cls = classifyHeadline(item.title)
              const isBreaking = cls && (cls.level === 'critical' || cls.level === 'high')
              const isImportant = cls && cls.level === 'medium'
              const domain = extractDomain(item.url)
              const srcColor = sourceColorMap.get(domain) ?? SOURCE_COLORS[0]

              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    'flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-1 px-1 rounded-sm transition-colors',
                    isBreaking ? 'border-l-2 border-red-500 pl-1.5' : '',
                    isImportant ? 'border-l-2 border-amber-500 pl-1.5' : '',
                  ].join(' ')}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0 mt-0.5 ${srcColor}`}>
                    {domain.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    {Date.now() - item.published < 1_800_000 && (
                      <span className="inline-flex items-center gap-0.5 mr-1 align-middle">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                        <span className="text-[7px] font-bold uppercase tracking-wider text-red-500">New</span>
                      </span>
                    )}
                    {cls && (
                      <span
                        className="inline-block text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                        style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}
                      >
                        {CATEGORY_LABELS[cls.category]}
                      </span>
                    )}
                    <span className="text-[11px] font-medium leading-snug text-foreground line-clamp-2">
                      {item.title}
                    </span>
                  </div>
                  <div className="text-right shrink-0 ml-1">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap block">
                      {relTime(item.published)}
                    </span>
                    <span className="text-[8px] text-muted-foreground/60 whitespace-nowrap block">
                      {domain}
                    </span>
                  </div>
                </a>
              )
            })}
          </div>
        ))}
      </div>
    </PanelWrapper>
  )
}
