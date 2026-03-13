import { useState, useMemo } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
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

function extractFullDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
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

type MainTab = 'feed' | 'sentiment' | 'sources'

const SOURCE_COLORS = [
  'bg-blue-500/20 text-blue-400',
  'bg-purple-500/20 text-purple-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-orange-500/20 text-orange-400',
  'bg-pink-500/20 text-pink-400',
  'bg-cyan-500/20 text-cyan-400',
  'bg-yellow-500/20 text-yellow-400',
]

const POS_KEYWORDS = ['rally', 'surge', 'gain', 'rise', 'beat', 'upgrade', 'bullish', 'record high', 'growth', 'soar']
const NEG_KEYWORDS = ['crash', 'drop', 'fall', 'decline', 'miss', 'downgrade', 'bearish', 'recession', 'crisis', 'warning']

function scoreSentiment(title: string): number {
  const lower = title.toLowerCase()
  let score = 0
  for (const k of POS_KEYWORDS) if (lower.includes(k)) score++
  for (const k of NEG_KEYWORDS) if (lower.includes(k)) score--
  return score
}

function sentimentLabel(gauge: number): { label: string; color: string } {
  if (gauge < 35) return { label: 'FEAR', color: 'text-red-400' }
  if (gauge < 55) return { label: 'NEUTRAL', color: 'text-yellow-400' }
  return { label: 'GREED', color: 'text-emerald-400' }
}

// gauge color gradient: red 0 -> yellow 50 -> green 100
function gaugeColor(pct: number): string {
  if (pct < 35) return 'bg-red-500'
  if (pct < 55) return 'bg-yellow-500'
  return 'bg-emerald-500'
}

export default function HeadlinesPanel() {
  const expanded = useIsExpanded()
  const [priority, setPriority] = useState<Priority>('All')
  const [tab, setTab] = useState<MainTab>('feed')
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

  // Sentiment tab data
  const sentimentData = useMemo(() => {
    if (!data || data.length === 0) return null
    const scored = data.map((item) => ({ item, score: scoreSentiment(item.title) }))
    const pos = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 3)
    const neg = scored.filter((s) => s.score < 0).sort((a, b) => a.score - b.score).slice(0, 3)

    // gauge: map net sentiment to 0-100
    const totalPos = scored.reduce((acc, s) => acc + Math.max(0, s.score), 0)
    const totalNeg = scored.reduce((acc, s) => acc + Math.max(0, -s.score), 0)
    const total = totalPos + totalNeg
    const gauge = total === 0 ? 50 : Math.round((totalPos / total) * 100)

    // headline velocity: headlines in last hour / 1
    const lastHourCount = data.filter((item) => Date.now() - item.published < 3_600_000).length

    return { pos, neg, gauge, lastHourCount }
  }, [data])

  // Sources tab data
  const sourcesData = useMemo(() => {
    if (!data || data.length === 0) return null
    const counts = new Map<string, number>()
    for (const item of data) {
      const domain = extractFullDomain(item.url)
      counts.set(domain, (counts.get(domain) ?? 0) + 1)
    }
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
    const max = sorted[0]?.[1] ?? 1
    // Shannon entropy diversity score (normalized 0-100)
    const total = data.length
    const entropy = sorted.reduce((acc, [, cnt]) => {
      const p = cnt / total
      return acc - p * Math.log2(p)
    }, 0)
    const maxEntropy = Math.log2(sorted.length || 1)
    const diversity = maxEntropy === 0 ? 0 : Math.round((entropy / maxEntropy) * 100)
    return { sorted, max, diversity }
  }, [data])

  return (
    <PanelWrapper title="Headlines" loading={loading} error={error} onRetry={refresh}>
      {/* Top nav row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          <button className={tabCls(tab === 'feed')} onClick={() => setTab('feed')}>Feed</button>
          <button className={tabCls(tab === 'sentiment')} onClick={() => setTab('sentiment')}>Sentiment</button>
          <button className={tabCls(tab === 'sources')} onClick={() => setTab('sources')}>Sources</button>
        </div>
        <div className="flex items-center gap-2">
          {uniqueSources > 0 && (
            <span className="text-[8px] text-muted-foreground/60">
              {uniqueSources} feed{uniqueSources !== 1 ? 's' : ''}
            </span>
          )}
          {breakingCount > 0 && (
            <span className="text-[8px] font-bold text-red-500 animate-pulse">{breakingCount} NEW</span>
          )}
        </div>
      </div>

      {/* Feed tab: priority sub-tabs */}
      {tab === 'feed' && (
        <>
          <div className="flex gap-1 mb-2">
            {PRIORITIES.map((p) => (
              <button key={p} className={tabCls(priority === p)} onClick={() => setPriority(p)}>
                {p}
              </button>
            ))}
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
                        <span className={`text-[11px] font-medium leading-snug text-foreground ${expanded ? '' : 'line-clamp-2'}`}>
                          {item.title}
                        </span>
                      </div>
                      <div className="text-right shrink-0 ml-1">
                        <span className={`text-muted-foreground whitespace-nowrap block ${expanded ? 'text-[11px]' : 'text-[10px]'}`}>
                          {relTime(item.published)}
                        </span>
                        <span className={`text-muted-foreground/60 whitespace-nowrap block ${expanded ? 'text-[10px]' : 'text-[8px]'}`}>
                          {expanded ? extractFullDomain(item.url) : domain}
                        </span>
                      </div>
                    </a>
                  )
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Sentiment tab */}
      {tab === 'sentiment' && (
        <div className="space-y-3">
          {!sentimentData ? (
            <p className="text-[10px] text-muted-foreground">No data</p>
          ) : (
            <>
              {/* Gauge */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Sentiment Gauge</span>
                  <span className={`text-[10px] font-bold tracking-wider ${sentimentLabel(sentimentData.gauge).color}`}>
                    {sentimentLabel(sentimentData.gauge).label}
                  </span>
                </div>
                <div className="relative h-3 rounded-full bg-zinc-700/40 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${gaugeColor(sentimentData.gauge)}`}
                    style={{ width: `${sentimentData.gauge}%` }}
                  />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[8px] text-red-400">0 Fear</span>
                  <span className="text-[8px] text-muted-foreground/60">{sentimentData.gauge}</span>
                  <span className="text-[8px] text-emerald-400">100 Greed</span>
                </div>
              </div>

              {/* Velocity */}
              <div className="flex items-center justify-between border border-border/30 rounded-sm px-2 py-1">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Headline Velocity</span>
                <span className="text-[10px] font-bold text-foreground">
                  {sentimentData.lastHourCount}<span className="text-[8px] text-muted-foreground font-normal ml-0.5">/hr</span>
                </span>
              </div>

              {/* Top positive */}
              {sentimentData.pos.length > 0 && (
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold mb-1">Most Positive</div>
                  <div className="space-y-1">
                    {sentimentData.pos.map(({ item }) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-1.5 hover:bg-zinc-800/50 -mx-1 px-1 py-0.5 rounded-sm transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        <span className={`text-[10px] text-foreground leading-snug ${expanded ? '' : 'line-clamp-2'}`}>{item.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Top negative */}
              {sentimentData.neg.length > 0 && (
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-red-400 font-bold mb-1">Most Negative</div>
                  <div className="space-y-1">
                    {sentimentData.neg.map(({ item }) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-1.5 hover:bg-zinc-800/50 -mx-1 px-1 py-0.5 rounded-sm transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                        <span className={`text-[10px] text-foreground leading-snug ${expanded ? '' : 'line-clamp-2'}`}>{item.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Sources tab */}
      {tab === 'sources' && (
        <div className="space-y-3">
          {!sourcesData ? (
            <p className="text-[10px] text-muted-foreground">No data</p>
          ) : (
            <>
              {/* Diversity score */}
              <div className="flex items-center justify-between border border-border/30 rounded-sm px-2 py-1">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Source Diversity Score</span>
                <span className="text-[10px] font-bold text-foreground">
                  {sourcesData.diversity}<span className="text-[8px] text-muted-foreground font-normal ml-0.5">/100</span>
                </span>
              </div>

              {/* Source bars */}
              <div className="space-y-1.5">
                {sourcesData.sorted.map(([domain, count]) => (
                  <div key={domain}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-foreground font-medium truncate max-w-[70%]">{domain}</span>
                      <span className="text-[9px] text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-700/40 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500/60"
                        style={{ width: `${Math.round((count / sourcesData.max) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </PanelWrapper>
  )
}
