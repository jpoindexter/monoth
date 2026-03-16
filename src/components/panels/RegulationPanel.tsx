import { useState, useMemo } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { tabCls } from '@/lib/panel-utils'
import { RegulationTracker } from '@/components/panels/RegulationTracker'
import { RegulationNews } from '@/components/panels/RegulationNews'
import { RegulationTimeline } from '@/components/panels/RegulationTimeline'
import { RegulationImpact } from '@/components/panels/RegulationImpact'

const CATEGORIES = [
  { key: 'SEC', keywords: ['sec ', 'securities', 'gensler', 'enforcement', 'filing', 'registration'], icon: 'S' },
  { key: 'Fed', keywords: ['fed ', 'federal reserve', 'fomc', 'powell', 'rate cut', 'rate hike', 'monetary policy'], icon: 'F' },
  { key: 'Tariffs', keywords: ['tariff', 'trade war', 'import duty', 'customs', 'export ban', 'trade deal'], icon: 'T' },
  { key: 'Crypto', keywords: ['crypto reg', 'stablecoin', 'defi regulation', 'bitcoin etf', 'digital asset', 'cbdc'], icon: 'C' },
  { key: 'Antitrust', keywords: ['antitrust', 'monopoly', 'merger block', 'ftc', 'doj', 'competition'], icon: 'A' },
  { key: 'Banking', keywords: ['basel', 'capital requirement', 'stress test', 'fdic', 'bank regulation', 'dodd-frank'], icon: 'B' },
] as const

const IMPACT_SECTORS = [
  { sector: 'Banking', keywords: ['bank', 'basel', 'fdic', 'capital requirement', 'stress test', 'dodd-frank', 'federal reserve'] },
  { sector: 'Crypto', keywords: ['crypto', 'bitcoin', 'ethereum', 'stablecoin', 'defi', 'digital asset', 'cbdc', 'mica', 'blockchain'] },
  { sector: 'Tech', keywords: ['antitrust', 'ftc', 'doj', 'monopoly', 'ai regulation', 'data privacy', 'tech regulation'] },
  { sector: 'Energy', keywords: ['energy regulation', 'epa', 'climate', 'carbon', 'emissions', 'clean energy', 'oil regulation'] },
  { sector: 'Healthcare', keywords: ['healthcare', 'fda', 'drug', 'pharmaceutical', 'health regulation', 'medicare', 'medicaid'] },
  { sector: 'Finance', keywords: ['sec', 'securities', 'cfpb', 'fintech', 'trading', 'derivatives', 'hedge fund', 'investment'] },
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
        counts[cat.key] = (counts[cat.key] ?? 0) + (ageHours < 6 ? 2 : 1)
      }
    }
  }
  return CATEGORIES.map((cat) => ({
    ...cat,
    activity: Math.min(counts[cat.key] ?? 0, 10),
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

export default function RegulationPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'tracker' | 'news' | 'timeline' | 'impact'>('tracker')
  const [filter, setFilter] = useState<string>('All')
  const { data, loading, error, refresh } = useNewsData('regulation')

  const categories = useMemo(() => data ? categorizeNews(data) : [], [data])
  const impactScores = useMemo(
    () => data ? computeImpactScores(data) : IMPACT_SECTORS.map(s => ({ sector: s.sector, score: 0 })),
    [data]
  )
  const avgPressure = useMemo(() => {
    if (!impactScores.length) return 0
    return impactScores.reduce((sum, s) => sum + s.score, 0) / impactScores.length
  }, [impactScores])

  const filtered = useMemo(() => {
    if (!data) return []
    if (filter === 'All') return data
    const cat = CATEGORIES.find((c) => c.key === filter)
    if (!cat) return data
    return data.filter((item) => cat.keywords.some((kw) => item.title.toLowerCase().includes(kw)))
  }, [data, filter])

  return (
    <PanelWrapper title="Regulation" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'tracker')} onClick={() => setTab('tracker')}>Tracker</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
        <button className={tabCls(tab === 'timeline')} onClick={() => setTab('timeline')}>Timeline</button>
        <button className={tabCls(tab === 'impact')} onClick={() => setTab('impact')}>Impact</button>
      </div>

      {tab === 'tracker' && (
        <RegulationTracker
          categories={categories}
          onCategoryClick={(key) => { setFilter(key); setTab('news') }}
        />
      )}
      {tab === 'news' && (
        <RegulationNews
          filtered={filtered}
          filter={filter}
          expanded={expanded}
          onFilterChange={setFilter}
        />
      )}
      {tab === 'timeline' && <RegulationTimeline expanded={expanded} />}
      {tab === 'impact' && <RegulationImpact impactScores={impactScores} avgPressure={avgPressure} />}
    </PanelWrapper>
  )
}
