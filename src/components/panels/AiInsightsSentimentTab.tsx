import { useMemo } from 'react'
import { useIsExpanded } from '@/components/layout/PanelWrapper'
import { useNewsData } from '@/hooks/use-news-data'
import { classifyHeadline, CATEGORY_LABELS } from '@/lib/news-classifier'
import type { ThreatCategory } from '@/lib/news-classifier'

const LEVEL_SCORE: Record<string, number> = {
  critical: -2,
  high: -1,
  medium: 0,
}

export const CATEGORY_COLORS: Partial<Record<ThreatCategory, string>> = {
  conflict: '#ef4444',
  military: '#f97316',
  terrorism: '#dc2626',
  economic: '#eab308',
  diplomatic: '#3b82f6',
  disaster: '#f97316',
  protest: '#a855f7',
  cyber: '#06b6d4',
  health: '#10b981',
  environmental: '#22c55e',
  infrastructure: '#6b7280',
  tech: '#8b5cf6',
  general: '#9ca3af',
  crime: '#f43f5e',
}

function sentimentLabel(score: number): string {
  if (score < 25) return 'FEAR'
  if (score < 40) return 'CAUTIOUS'
  if (score < 60) return 'NEUTRAL'
  if (score < 75) return 'OPTIMISTIC'
  return 'GREED'
}

function sentimentColor(score: number): string {
  if (score < 25) return '#ef4444'
  if (score < 40) return '#f97316'
  if (score < 60) return '#eab308'
  if (score < 75) return '#86efac'
  return '#22c55e'
}

export default function AiInsightsSentimentTab() {
  const expanded = useIsExpanded()
  const { data: headlines } = useNewsData('markets')
  const { score, categoryBreakdown, topThreats } = useMemo(() => {
    const items = headlines ?? []
    if (items.length === 0) return { score: 50, categoryBreakdown: [], topThreats: [] }

    let total = 0
    const catCount: Partial<Record<ThreatCategory, number>> = {}
    const threats: { title: string; level: string; category: ThreatCategory }[] = []

    for (const item of items) {
      const cls = classifyHeadline(item.title)
      if (cls) {
        total += LEVEL_SCORE[cls.level] ?? 0
        catCount[cls.category] = (catCount[cls.category] ?? 0) + 1
        if (cls.level === 'critical' || cls.level === 'high') {
          threats.push({ title: item.title, level: cls.level, category: cls.category })
        }
      } else {
        total += 0.5
      }
    }

    const min = items.length * -2
    const max = items.length * 0.5
    const normalized = Math.round(((total - min) / (max - min)) * 100)
    const clamped = Math.max(0, Math.min(100, normalized))
    const breakdown = Object.entries(catCount)
      .map(([cat, count]) => ({ cat: cat as ThreatCategory, count: count ?? 0 }))
      .sort((a, b) => b.count - a.count)

    const top3 = threats
      .sort((a, b) => (a.level === 'critical' ? -1 : b.level === 'critical' ? 1 : 0))
      .slice(0, 3)

    return { score: clamped, categoryBreakdown: breakdown, topThreats: top3 }
  }, [headlines])

  const totalCats = categoryBreakdown.reduce((s, c) => s + c.count, 0)
  const label = sentimentLabel(score)
  const color = sentimentColor(score)

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center py-2">
        <span className={`font-bold tabular-nums ${expanded ? 'text-5xl' : 'text-3xl'}`} style={{ color }}>{score}</span>
        <span className={`uppercase tracking-wider font-bold mt-0.5 ${expanded ? 'text-[13px]' : 'text-[10px]'}`} style={{ color }}>{label}</span>
        <span className="text-[10px] text-muted-foreground mt-0.5">{(headlines ?? []).length} headlines analyzed</span>
      </div>

      {categoryBreakdown.length > 0 && (
        <div>
          <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Category breakdown</div>
          <div className="flex h-2 w-full rounded-sm overflow-hidden">
            {categoryBreakdown.map(({ cat, count }) => (
              <div
                key={cat}
                style={{
                  width: `${(count / totalCats) * 100}%`,
                  backgroundColor: CATEGORY_COLORS[cat] ?? '#6b7280',
                }}
                title={`${CATEGORY_LABELS[cat]}: ${count}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
            {categoryBreakdown.slice(0, 6).map(({ cat, count }) => (
              <div key={cat} className="flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 rounded-[1px]" style={{ backgroundColor: CATEGORY_COLORS[cat] ?? '#6b7280' }} />
                <span className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[cat]} {count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topThreats.length > 0 && (
        <div>
          <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Top threats</div>
          <div className="space-y-1">
            {(expanded ? topThreats : topThreats.slice(0, 3)).map((t, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span
                  className="text-[9px] font-bold uppercase px-1 py-0.5 rounded-[2px] shrink-0 mt-px"
                  style={{
                    backgroundColor: t.level === 'critical' ? '#ef444420' : '#f9731620',
                    color: t.level === 'critical' ? '#ef4444' : '#f97316',
                  }}
                >
                  {t.level}
                </span>
                <span className={`text-foreground/80 leading-tight ${expanded ? 'text-[12px]' : 'text-[10px] line-clamp-2'}`}>{t.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(headlines ?? []).length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center">Loading headlines...</p>
      )}
    </div>
  )
}
