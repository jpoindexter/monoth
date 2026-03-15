import { useState, useMemo } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime } from '@/lib/panel-utils'

function formatSince(since: string): string {
  const parts = since.split('-')
  const year = parts[0] ?? '2000'
  const month = parts[1] ?? '01'
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const label = `${months[parseInt(month) - 1] ?? month} ${year}`
  const start = new Date(parseInt(year), parseInt(month) - 1, 1)
  const now = new Date()
  const months_diff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  const years = Math.floor(months_diff / 12)
  const rem = months_diff % 12
  const dur = years > 0 ? `${years}+ yr${years > 1 ? 's' : ''}` : `${rem}+ mo`
  return `Since ${label} (${dur})`
}

const ACTIVE_SITUATIONS = [
  { name: 'Russia-Ukraine', status: 'active', since: '2022-02', severity: 'high', impact: 'Energy, grain prices, defense stocks' },
  { name: 'Israel-Palestine', status: 'active', since: '2023-10', severity: 'high', impact: 'Oil supply risk, defense sector' },
  { name: 'China-Taiwan', status: 'monitoring', since: '2022-08', severity: 'medium', impact: 'Semiconductor supply, tech stocks' },
  { name: 'Red Sea / Houthi', status: 'active', since: '2023-11', severity: 'medium', impact: 'Shipping costs, supply chain' },
  { name: 'US-China Trade', status: 'escalating', since: '2018-03', severity: 'medium', impact: 'Tech sector, tariffs, rare earths' },
  { name: 'India-Pakistan', status: 'monitoring', since: '2019-08', severity: 'medium', impact: 'Regional stability, defense stocks' },
  { name: 'BRICS Expansion', status: 'monitoring', since: '2023-08', severity: 'low', impact: 'Dollar dominance, commodity pricing' },
  { name: 'Iran Nuclear', status: 'monitoring', since: '2015-07', severity: 'low', impact: 'Oil prices, sanctions' },
  { name: 'Argentina Dollarization', status: 'monitoring', since: '2023-12', severity: 'low', impact: 'EM currency contagion, bond markets' },
  { name: 'Africa Debt Crisis', status: 'monitoring', since: '2022-01', severity: 'low', impact: 'EM debt, commodity supply chains' },
]

const SEVERITY_COLOR: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  active:        { bg: '#ef4444', text: '#fff' },
  escalating:    { bg: '#f97316', text: '#fff' },
  monitoring:    { bg: '#eab308', text: '#000' },
  'de-escalating': { bg: '#22c55e', text: '#fff' },
}

const REGIONS = [
  { key: 'Middle East', keywords: ['iran', 'israel', 'gaza', 'hamas', 'hezbollah', 'saudi', 'yemen', 'houthi', 'syria', 'iraq', 'middle east'] },
  { key: 'China/Taiwan', keywords: ['china', 'taiwan', 'beijing', 'xi jinping', 'south china sea', 'hong kong', 'pboc'] },
  { key: 'Russia/Ukraine', keywords: ['russia', 'ukraine', 'putin', 'moscow', 'kyiv', 'crimea', 'nato', 'ruble', 'gazprom'] },
  { key: 'India', keywords: ['india', 'modi', 'new delhi', 'rupee', 'reserve bank of india', 'india china', 'india pakistan'] },
  { key: 'Europe', keywords: ['eu', 'european union', 'brexit', 'macron', 'germany', 'france', 'ecb', 'nato'] },
  { key: 'Latin America', keywords: ['brazil', 'mexico', 'argentina', 'colombia', 'chile', 'latin america', 'south america', 'lula', 'bolsonaro'] },
  { key: 'Africa', keywords: ['africa', 'nigeria', 'south africa', 'kenya', 'ethiopia', 'egypt', 'sub-saharan'] },
  { key: 'Asia Pacific', keywords: ['japan', 'south korea', 'north korea', 'australia', 'asean', 'vietnam', 'indonesia', 'thailand', 'boj'] },
  { key: 'Trade/Tariffs', keywords: ['tariff', 'trade war', 'sanctions', 'embargo', 'export control', 'trade deal', 'de-dollarization'] },
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
          <span className="text-[9px] text-muted-foreground">{count} stories</span>
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>{level}</span>
        </div>
      </div>
      <div className="h-1 bg-border/20 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function GeopoliticsPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'risk' | 'news' | 'timeline'>('risk')
  const { data, loading, error, refresh } = useNewsData('geopolitics')

  const risks = useMemo(() => data ? computeRiskScores(data) : [], [data])
  const sorted = useMemo(() => [...risks].sort((a, b) => b.score - a.score), [risks])
  const avgRisk = risks.length > 0 ? risks.reduce((s, r) => s + r.score, 0) / risks.length : 0
  const riskLabel = avgRisk > 8 ? 'CRITICAL' : avgRisk > 6 ? 'HIGH' : avgRisk > 4 ? 'ELEVATED' : avgRisk > 2 ? 'MODERATE' : 'LOW'
  const riskColor = avgRisk > 8 ? '#ef4444' : avgRisk > 6 ? '#f97316' : avgRisk > 4 ? '#f59e0b' : avgRisk > 2 ? '#eab308' : '#22c55e'

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Geopolitics" loading={loading} error={error} onRetry={refresh}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          <button className={tabCls(tab === 'risk')} onClick={() => setTab('risk')}>Risk Map</button>
          <button className={tabCls(tab === 'timeline')} onClick={() => setTab('timeline')}>Timeline</button>
          <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground">Global Risk</span>
          <span className={`text-[10px] font-bold ${avgRisk >= 5 ? 'text-red-500' : avgRisk >= 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {avgRisk.toFixed(1)}/10
          </span>
        </div>
      </div>

      {tab === 'risk' && (
        <div>
          <div className="space-y-0.5 mb-3">
            {sorted.map((r) => (
              <RiskBar key={r.region} label={r.region} score={r.score} count={r.count} />
            ))}
          </div>
          <div className="border-t border-border/20 pt-2 flex items-center justify-between">
            <div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Global Risk Index</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums" style={{ color: riskColor }}>{avgRisk.toFixed(1)}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: riskColor }}>{riskLabel}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="space-y-1.5">
          {ACTIVE_SITUATIONS.map((s) => {
            const dot = SEVERITY_COLOR[s.severity] ?? '#888'
            const badge = STATUS_STYLE[s.status] ?? { bg: '#888', text: '#fff' }
            return (
              <div key={s.name} className="border-l-2 pl-2 py-0.5" style={{ borderColor: dot }}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                  <span className="text-[11px] font-semibold text-foreground leading-none">{s.name}</span>
                  <span className="text-[9px] font-bold uppercase px-1 py-px rounded-sm leading-none"
                    style={{ backgroundColor: badge.bg, color: badge.text }}>
                    {s.status}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground">{formatSince(s.since)}</div>
                <div className="text-[10px] text-muted-foreground italic">{s.impact}</div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'news' && (
        <div className="space-y-0">
          {(expanded ? data : data?.slice(0, 8))?.map((item) => {
            const cls = classifyHeadline(item.title)
            return (
              <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-1 px-1 rounded-sm transition-colors">
                <div className="flex-1 min-w-0">
                  {cls && (
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                      style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}>
                      {CATEGORY_LABELS[cls.category]}
                    </span>
                  )}
                  <span className={`font-medium leading-snug text-foreground ${expanded ? 'text-[13px]' : 'text-[11px] line-clamp-2'}`}>{item.title}</span>
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
