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

const REGIONS = [
  { key: 'Middle East', keywords: ['iran', 'israel', 'gaza', 'hamas', 'hezbollah', 'saudi', 'yemen', 'houthi', 'syria', 'iraq', 'middle east'] },
  { key: 'China/Taiwan', keywords: ['china', 'taiwan', 'beijing', 'xi jinping', 'south china sea', 'hong kong'] },
  { key: 'Russia/Ukraine', keywords: ['russia', 'ukraine', 'putin', 'moscow', 'kyiv', 'crimea', 'nato'] },
  { key: 'Trade/Tariffs', keywords: ['tariff', 'trade war', 'sanctions', 'embargo', 'export control', 'trade deal'] },
  { key: 'Korea', keywords: ['north korea', 'pyongyang', 'kim jong', 'south korea', 'korean'] },
  { key: 'Europe', keywords: ['eu', 'european union', 'brexit', 'macron', 'germany', 'france'] },
] as const

function computeRiskScores(headlines: { title: string; published: number }[]) {
  const now = Date.now()
  return REGIONS.map((region) => {
    let score = 0
    const matches = headlines.filter((h) => {
      const lower = h.title.toLowerCase()
      return region.keywords.some((kw) => lower.includes(kw))
    })
    for (const m of matches) {
      const ageHours = (now - m.published) / 3_600_000
      const recency = ageHours < 1 ? 3 : ageHours < 6 ? 2 : ageHours < 24 ? 1 : 0.5
      const cls = classifyHeadline(m.title)
      const severity = cls?.level === 'critical' ? 3 : cls?.level === 'high' ? 2 : cls?.level === 'medium' ? 1.5 : 1
      score += recency * severity
    }
    return { region: region.key, score: Math.min(score, 10), count: matches.length }
  })
}

function RiskBar({ label, score, count }: { label: string; score: number; count: number }) {
  const pct = (score / 10) * 100
  const color = score >= 7 ? '#ef4444' : score >= 4 ? '#f59e0b' : score >= 2 ? '#eab308' : '#22c55e'
  const level = score >= 7 ? 'HIGH' : score >= 4 ? 'ELEVATED' : score >= 2 ? 'MODERATE' : 'LOW'

  return (
    <div className="py-1">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-muted-foreground">{count} stories</span>
          <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color }}>{level}</span>
        </div>
      </div>
      <div className="h-1 bg-border/20 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function GeopoliticsPanel() {
  const [tab, setTab] = useState<'risk' | 'news'>('risk')
  const { data, loading, error, refresh } = useNewsData('geopolitics')

  const risks = useMemo(() => data ? computeRiskScores(data) : [], [data])
  const sorted = useMemo(() => [...risks].sort((a, b) => b.score - a.score), [risks])
  const avgRisk = risks.length > 0 ? risks.reduce((s, r) => s + r.score, 0) / risks.length : 0

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Geopolitics" loading={loading} error={error} onRetry={refresh}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          <button className={tabCls(tab === 'risk')} onClick={() => setTab('risk')}>Risk Map</button>
          <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-muted-foreground">Global Risk</span>
          <span className={`text-[10px] font-bold ${avgRisk >= 5 ? 'text-red-500' : avgRisk >= 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {avgRisk.toFixed(1)}/10
          </span>
        </div>
      </div>

      {tab === 'risk' && (
        <div className="space-y-0.5">
          {sorted.map((r) => (
            <RiskBar key={r.region} label={r.region} score={r.score} count={r.count} />
          ))}
        </div>
      )}

      {tab === 'news' && (
        <div className="space-y-0">
          {data?.map((item) => {
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
