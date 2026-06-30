import { useState, useMemo, useEffect, useRef } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime } from '@/lib/panel-utils'

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function readingTime(title: string): string {
  return title.length > 80 ? '2 min' : '1 min'
}

type FilterTab = 'All' | 'Markets' | 'Crypto' | 'Geopolitics' | 'Tech' | 'Economy'

const TABS: FilterTab[] = ['All', 'Markets', 'Crypto', 'Geopolitics', 'Tech', 'Economy']

function matchesFilter(title: string, tab: FilterTab): boolean {
  if (tab === 'All') return true
  const cls = classifyHeadline(title)
  const lower = title.toLowerCase()
  if (tab === 'Markets') return cls?.category === 'economic'
  if (tab === 'Crypto') return cls?.category === 'tech' && /crypto|bitcoin|ethereum|blockchain/.test(lower)
  if (tab === 'Geopolitics') return ['conflict', 'diplomatic', 'military'].includes(cls?.category ?? '')
  if (tab === 'Tech') return ['tech', 'cyber'].includes(cls?.category ?? '')
  if (tab === 'Economy') return cls?.category === 'economic' && /fed|gdp|inflation|unemployment/.test(lower)
  return false
}

export interface NewsFeedPanelProps {
  category: string
  title: string
}

export function NewsFeedPanel({ category, title }: NewsFeedPanelProps) {
  const expanded = useIsExpanded()
  const { data, loading, error, refresh } = useNewsData(category)
  const [activeTab, setActiveTab] = useState<FilterTab>('All')
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())
  const prevIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!data) return
    const currentIds = new Set(data.map((item) => item.id))
    const newIds = [...currentIds].filter((id) => !prevIdsRef.current.has(id))
    if (newIds.length > 0 && prevIdsRef.current.size > 0) {
      // New items on a refresh — intentionally left out of seenIds so they render as unread.
    } else if (prevIdsRef.current.size === 0) {
      setSeenIds(new Set(data.map((item) => item.id)))
    }
    prevIdsRef.current = currentIds
  }, [data])

  const tabCounts = useMemo(() => {
    if (!data) return {} as Record<FilterTab, number>
    return Object.fromEntries(
      TABS.map((tab) => [tab, data.filter((item) => matchesFilter(item.title, tab)).length])
    ) as Record<FilterTab, number>
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    return data.filter((item) => matchesFilter(item.title, activeTab))
  }, [data, activeTab])

  const tabCls = (tab: FilterTab) =>
    `text-[10px] px-2 py-0.5 rounded-sm cursor-pointer transition-colors whitespace-nowrap ${
      activeTab === tab
        ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
        : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <PanelWrapper title={title} loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 flex-wrap mb-2 -mx-1 px-1">
        {TABS.map((tab) => (
          <button key={tab} className={tabCls(tab)} onClick={() => setActiveTab(tab)}>
            {tab}
            {tabCounts[tab] > 0 && (
              <span className="text-[9px] bg-muted/50 px-1 rounded-full ml-0.5">{tabCounts[tab]}</span>
            )}
          </button>
        ))}
      </div>
      <div className="space-y-0">
        {(expanded ? filtered : filtered.slice(0, 10)).map((item) => {
          const cls = classifyHeadline(item.title)
          const domain = extractDomain(item.url)
          const isUnread = !seenIds.has(item.id)
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setSeenIds((prev) => new Set([...prev, item.id]))}
              className="flex items-start gap-2 py-1.5 border-b border-border/20 last:border-0 hover:bg-muted/30 -mx-1 px-1 rounded-sm transition-colors"
            >
              {isUnread && (
                <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0 mt-1.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap mb-0.5">
                  {cls && (
                    <span
                      className="inline-block text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm"
                      style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}
                    >
                      {CATEGORY_LABELS[cls.category]}
                    </span>
                  )}
                  {domain && (
                    <span className="text-[9px] text-muted-foreground bg-muted/50 px-1 rounded-sm">
                      {domain}
                    </span>
                  )}
                  <span className="text-[9px] text-muted-foreground">{readingTime(item.title)}</span>
                </div>
                <span className={`font-medium leading-snug text-foreground ${expanded ? 'text-[13px]' : 'text-[11px] line-clamp-2'}`}>
                  {item.title}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                {relTime(item.published)}
              </span>
            </a>
          )
        })}
      </div>
    </PanelWrapper>
  )
}
