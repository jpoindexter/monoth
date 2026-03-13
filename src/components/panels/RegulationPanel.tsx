import { useState, useMemo } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime } from '@/lib/panel-utils'

const CATEGORIES = [
  { key: 'SEC', keywords: ['sec ', 'securities', 'gensler', 'enforcement', 'filing', 'registration'], icon: 'S' },
  { key: 'Fed', keywords: ['fed ', 'federal reserve', 'fomc', 'powell', 'rate cut', 'rate hike', 'monetary policy'], icon: 'F' },
  { key: 'Tariffs', keywords: ['tariff', 'trade war', 'import duty', 'customs', 'export ban', 'trade deal'], icon: 'T' },
  { key: 'Crypto', keywords: ['crypto reg', 'stablecoin', 'defi regulation', 'bitcoin etf', 'digital asset', 'cbdc'], icon: 'C' },
  { key: 'Antitrust', keywords: ['antitrust', 'monopoly', 'merger block', 'ftc', 'doj', 'competition'], icon: 'A' },
  { key: 'Banking', keywords: ['basel', 'capital requirement', 'stress test', 'fdic', 'bank regulation', 'dodd-frank'], icon: 'B' },
] as const

type ImpactLevel = 'HIGH' | 'MED' | 'LOW'

interface RegEvent {
  id: string
  title: string
  agency: string
  date: Date
  impact: ImpactLevel
  description: string
}

const TIMELINE_EVENTS: RegEvent[] = [
  {
    id: '1',
    title: 'SEC Climate Disclosure Rules Effective',
    agency: 'SEC',
    date: new Date('2026-03-28'),
    impact: 'HIGH',
    description: 'Public companies required to disclose material climate-related risks in annual filings.',
  },
  {
    id: '2',
    title: 'Basel III Endgame Comment Period Closes',
    agency: 'Fed/OCC/FDIC',
    date: new Date('2026-04-15'),
    impact: 'HIGH',
    description: 'Final comment period on revised capital requirements for large U.S. banks.',
  },
  {
    id: '3',
    title: 'CFPB Open Banking Rule Takes Effect',
    agency: 'CFPB',
    date: new Date('2026-04-30'),
    impact: 'MED',
    description: 'Banks must allow customers to share financial data with third-party apps via secure APIs.',
  },
  {
    id: '4',
    title: 'EU MiCA Phase 2 Implementation',
    agency: 'ESMA',
    date: new Date('2026-05-20'),
    impact: 'HIGH',
    description: 'Full Markets in Crypto-Assets regulation applies to all crypto-asset service providers in EU.',
  },
  {
    id: '5',
    title: 'Fed Rate Decision (FOMC)',
    agency: 'Federal Reserve',
    date: new Date('2026-06-11'),
    impact: 'HIGH',
    description: 'FOMC meeting rate decision and updated economic projections (dot plot).',
  },
  {
    id: '6',
    title: 'SEC Crypto Custody Rule Final',
    agency: 'SEC',
    date: new Date('2026-06-30'),
    impact: 'HIGH',
    description: 'Investment advisers must use qualified custodians for all crypto assets under management.',
  },
  {
    id: '7',
    title: 'FDIC Annual Stress Test Results',
    agency: 'FDIC',
    date: new Date('2026-07-15'),
    impact: 'MED',
    description: 'Stress test results for banks with $100B+ in assets released publicly.',
  },
  {
    id: '8',
    title: 'G20 Crypto Regulatory Framework',
    agency: 'G20/FSB',
    date: new Date('2026-08-05'),
    impact: 'MED',
    description: 'G20 member states report on progress implementing FSB cross-border crypto standards.',
  },
  {
    id: '9',
    title: 'EU AI Act Financial Services Provisions',
    agency: 'EU Commission',
    date: new Date('2026-09-01'),
    impact: 'MED',
    description: 'AI Act provisions covering high-risk AI systems in credit scoring and trading go live.',
  },
  {
    id: '10',
    title: 'CFTC Digital Asset Derivatives Rule',
    agency: 'CFTC',
    date: new Date('2026-10-01'),
    impact: 'LOW',
    description: 'New reporting and margin requirements for digital asset derivatives on U.S. platforms.',
  },
].sort((a, b) => a.date.getTime() - b.date.getTime())

const IMPACT_SECTORS = [
  {
    sector: 'Banking',
    keywords: ['bank', 'basel', 'fdic', 'capital requirement', 'stress test', 'dodd-frank', 'federal reserve'],
  },
  {
    sector: 'Crypto',
    keywords: ['crypto', 'bitcoin', 'ethereum', 'stablecoin', 'defi', 'digital asset', 'cbdc', 'mica', 'blockchain'],
  },
  {
    sector: 'Tech',
    keywords: ['antitrust', 'ftc', 'doj', 'monopoly', 'ai regulation', 'data privacy', 'tech regulation'],
  },
  {
    sector: 'Energy',
    keywords: ['energy regulation', 'epa', 'climate', 'carbon', 'emissions', 'clean energy', 'oil regulation'],
  },
  {
    sector: 'Healthcare',
    keywords: ['healthcare', 'fda', 'drug', 'pharmaceutical', 'health regulation', 'medicare', 'medicaid'],
  },
  {
    sector: 'Finance',
    keywords: ['sec', 'securities', 'cfpb', 'fintech', 'trading', 'derivatives', 'hedge fund', 'investment'],
  },
]

function categorizeNews(headlines: { title: string; published: number; id: string }[]) {
  const counts: Record<string, number> = {}
  const now = Date.now()

  for (const cat of CATEGORIES) counts[cat.key] = 0

  for (const h of headlines) {
    const lower = h.title.toLowerCase()
    for (const cat of CATEGORIES) {
      if (cat.keywords.some((kw) => lower.includes(kw))) {
        const ageHours = (now - h.published) / 3_600_000
        counts[cat.key] += ageHours < 6 ? 2 : 1
      }
    }
  }

  return CATEGORIES.map((cat) => ({
    ...cat,
    activity: Math.min(counts[cat.key], 10),
  })).sort((a, b) => b.activity - a.activity)
}

function computeImpactScores(headlines: { title: string; published: number; id: string }[]) {
  const now = Date.now()
  return IMPACT_SECTORS.map(({ sector, keywords }) => {
    let score = 0
    for (const h of headlines) {
      const lower = h.title.toLowerCase()
      if (keywords.some((kw) => lower.includes(kw))) {
        const ageHours = (now - h.published) / 3_600_000
        score += ageHours < 6 ? 2 : 1
      }
    }
    return { sector, score: Math.min(score, 10) }
  })
}

function daysUntil(date: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86_400_000)
}

function ActivityDot({ level }: { level: number }) {
  const color = level >= 7 ? 'bg-red-500' : level >= 4 ? 'bg-amber-500' : level >= 2 ? 'bg-yellow-500' : 'bg-zinc-300 dark:bg-zinc-600'
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />
}

function ImpactBadge({ level }: { level: ImpactLevel }) {
  const cls =
    level === 'HIGH'
      ? 'bg-red-500/20 text-red-500 border border-red-500/30'
      : level === 'MED'
      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
      : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
  return (
    <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm ${cls}`}>
      {level}
    </span>
  )
}

export default function RegulationPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'tracker' | 'news' | 'timeline' | 'impact'>('tracker')
  const [filter, setFilter] = useState<string>('All')
  const { data, loading, error, refresh } = useNewsData('regulation')

  const categories = useMemo(() => data ? categorizeNews(data) : [], [data])
  const impactScores = useMemo(() => data ? computeImpactScores(data) : IMPACT_SECTORS.map(s => ({ sector: s.sector, score: 0 })), [data])

  const avgPressure = useMemo(() => {
    if (!impactScores.length) return 0
    return impactScores.reduce((sum, s) => sum + s.score, 0) / impactScores.length
  }, [impactScores])

  const climate: { label: string; cls: string } = avgPressure >= 6
    ? { label: 'RESTRICTIVE', cls: 'text-red-500' }
    : avgPressure >= 3
    ? { label: 'NEUTRAL', cls: 'text-amber-500' }
    : { label: 'PERMISSIVE', cls: 'text-emerald-500' }

  const filtered = useMemo(() => {
    if (!data) return []
    if (filter === 'All') return data
    const cat = CATEGORIES.find((c) => c.key === filter)
    if (!cat) return data
    return data.filter((item) =>
      cat.keywords.some((kw) => item.title.toLowerCase().includes(kw))
    )
  }, [data, filter])

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Regulation" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'tracker')} onClick={() => setTab('tracker')}>Tracker</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
        <button className={tabCls(tab === 'timeline')} onClick={() => setTab('timeline')}>Timeline</button>
        <button className={tabCls(tab === 'impact')} onClick={() => setTab('impact')}>Impact</button>
      </div>

      {tab === 'tracker' && (
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setFilter(cat.key); setTab('news') }}
              className="w-full flex items-center gap-2 py-1.5 px-1.5 rounded-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
            >
              <div className="w-5 h-5 rounded-sm bg-foreground/5 flex items-center justify-center text-[9px] font-bold text-foreground/60">
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-foreground">{cat.key}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-px">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={`w-1 h-3 rounded-sm ${
                        i < cat.activity / 2
                          ? cat.activity >= 7 ? 'bg-red-500' : cat.activity >= 4 ? 'bg-amber-500' : 'bg-emerald-500'
                          : 'bg-border/30'
                      }`}
                    />
                  ))}
                </div>
                <ActivityDot level={cat.activity} />
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === 'news' && (
        <>
          <div className="flex gap-1 mb-1.5 flex-wrap">
            {['All', ...CATEGORIES.map((c) => c.key)].map((f) => (
              <button key={f} className={tabCls(filter === f)} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
          <div className="space-y-0">
            {(expanded ? filtered : filtered.slice(0, 8)).map((item) => {
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
                    <span className={`font-medium leading-snug text-foreground ${expanded ? 'text-[13px]' : 'text-[11px] line-clamp-2'}`}>{item.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">{relTime(item.published)}</span>
                </a>
              )
            })}
          </div>
        </>
      )}

      {tab === 'timeline' && (
        <div className="space-y-1.5">
          {(expanded ? TIMELINE_EVENTS : TIMELINE_EVENTS.slice(0, 5)).map((ev) => {
            const days = daysUntil(ev.date)
            const isPast = days < 0
            const isUrgent = days >= 0 && days <= 14
            return (
              <div key={ev.id} className="border border-border/30 rounded-sm px-2 py-1.5">
                <div className="flex items-start justify-between gap-1 mb-0.5">
                  <span className={`font-semibold text-foreground leading-tight flex-1 min-w-0 pr-1 ${expanded ? 'text-[12px]' : 'text-[10px]'}`}>
                    {ev.title}
                  </span>
                  <ImpactBadge level={ev.impact} />
                </div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] text-muted-foreground">
                    {ev.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-[8px] px-1 py-px rounded-sm bg-foreground/5 text-muted-foreground font-medium">
                    {ev.agency}
                  </span>
                  <span className={`text-[9px] font-bold ml-auto ${isPast ? 'text-zinc-400 dark:text-zinc-600' : isUrgent ? 'text-red-500' : 'text-foreground/70'}`}>
                    {isPast ? `${Math.abs(days)}d ago` : days === 0 ? 'TODAY' : `${days}d`}
                  </span>
                </div>
                <p className={`text-muted-foreground leading-snug ${expanded ? 'text-[11px]' : 'text-[9px] line-clamp-2'}`}>{ev.description}</p>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'impact' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Regulatory Climate</span>
            <span className={`text-[10px] font-bold tracking-wider ${climate.cls}`}>{climate.label}</span>
          </div>
          {impactScores.map(({ sector, score }) => {
            const barColor = score >= 7 ? 'bg-red-500' : score >= 4 ? 'bg-amber-500' : 'bg-emerald-500'
            const pct = Math.round((score / 10) * 100)
            return (
              <div key={sector}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-medium text-foreground">{sector}</span>
                  <span className="text-[9px] text-muted-foreground tabular-nums">{score.toFixed(1)}/10</span>
                </div>
                <div className="h-1.5 w-full bg-border/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
          <p className="text-[9px] text-muted-foreground mt-2 leading-snug">
            Scores derived from recent news volume. Higher = more regulatory activity.
          </p>
        </div>
      )}
    </PanelWrapper>
  )
}
