import { useCallback, useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { PredictionsMarketsTab } from './PredictionsMarketsTab'
import { PredictionsTrendingTab } from './PredictionsTrendingTab'
import { PredictionsStatsTab } from './PredictionsStatsTab'

interface Prediction {
  id: string
  title: string
  yesPct: number
  noPct: number
  volume: number
  endDate: string
}

export type Category = 'All' | 'Finance' | 'Crypto'
type TopTab = 'Markets' | 'Trending' | 'Stats'

export interface EnrichedPrediction extends Omit<Prediction, 'volume'> {
  volume: number
  category: 'Finance' | 'Crypto' | null
}

const CATEGORY_KEYWORDS: Record<Exclude<Category, 'All'>, string[]> = {
  Finance: ['market', 'stock', 'fed', 'rate', 'gdp', 'recession', 'inflation', 's&p', 'dow', 'nasdaq', 'bond', 'yield', 'dollar', 'euro', 'interest', 'cpi', 'jobs', 'unemployment', 'treasury'],
  Crypto: ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'token', 'defi', 'blockchain', 'solana', 'sol', 'xrp', 'ripple', 'coinbase', 'binance', 'altcoin'],
}

const MONEY_KEYWORDS = [...CATEGORY_KEYWORDS.Finance, ...CATEGORY_KEYWORDS.Crypto]

function getCategory(title: string): Exclude<Category, 'All'> | null {
  const lower = title.toLowerCase()
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat as Exclude<Category, 'All'>
  }
  return null
}

function isMoneyMarket(title: string): boolean {
  const lower = title.toLowerCase()
  return MONEY_KEYWORDS.some((kw) => lower.includes(kw))
}

const TOP_TABS: TopTab[] = ['Markets', 'Trending', 'Stats']
const STAT_CATEGORIES: Exclude<Category, 'All'>[] = ['Finance', 'Crypto']

export default function PredictionsPanel() {
  const expanded = useIsExpanded()
  const [topTab, setTopTab] = useState<TopTab>('Markets')
  const [activeCategory, setActiveCategory] = useState<Category>('All')

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/predictions/polymarket')
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<Prediction[]>
  }, [])

  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 300_000 })

  const moneyMarkets: EnrichedPrediction[] = (data ?? [])
    .map((p) => ({ ...p, volume: Number(p.volume) || 0, category: getCategory(p.title) }))
    .filter((p) => isMoneyMarket(p.title))

  const counts: Record<Category, number> = {
    All: moneyMarkets.length,
    Finance: moneyMarkets.filter((p) => p.category === 'Finance').length,
    Crypto: moneyMarkets.filter((p) => p.category === 'Crypto').length,
  }

  const filtered = activeCategory === 'All' ? moneyMarkets : moneyMarkets.filter((p) => p.category === activeCategory)
  const maxVolume = filtered.reduce((m, p) => Math.max(m, p.volume), 1)
  const totalVolume = moneyMarkets.reduce((s, p) => s + p.volume, 0)

  const topFive = [...moneyMarkets].sort((a, b) => b.volume - a.volume).slice(0, expanded ? undefined : 5)
  const topFiveMaxVol = topFive.reduce((m, p) => Math.max(m, p.volume), 1)

  const avgYesPct = moneyMarkets.length > 0
    ? moneyMarkets.reduce((s, p) => s + p.yesPct, 0) / moneyMarkets.length
    : 0
  const avgSpread = moneyMarkets.length > 0
    ? moneyMarkets.reduce((s, p) => s + Math.abs(p.yesPct - p.noPct), 0) / moneyMarkets.length
    : 0

  const volumeByCategory = STAT_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = moneyMarkets.filter((p) => p.category === cat).reduce((s, p) => s + p.volume, 0)
    return acc
  }, {})
  const maxCatVolume = Math.max(...Object.values(volumeByCategory), 1)

  const topTabCls = (tab: TopTab) =>
    `text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors font-medium ${
      topTab === tab
        ? 'bg-foreground text-background'
        : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <PanelWrapper title="Prediction Markets" loading={loading} error={error} onRetry={refresh}>
      <div>
        <div className="flex gap-1 mb-3 border-b border-border/30 pb-2">
          {TOP_TABS.map((tab) => (
            <button key={tab} className={topTabCls(tab)} onClick={() => setTopTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {topTab === 'Markets' && (
          <PredictionsMarketsTab
            filtered={filtered}
            counts={counts}
            maxVolume={maxVolume}
            totalVolume={totalVolume}
            totalMarkets={data?.length ?? 0}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            loading={loading}
            dataExists={!!data && data.length > 0}
            expanded={expanded}
          />
        )}

        {topTab === 'Trending' && (
          <PredictionsTrendingTab
            topFive={topFive}
            topFiveMaxVol={topFiveMaxVol}
            loading={loading}
          />
        )}

        {topTab === 'Stats' && (
          <PredictionsStatsTab
            totalMarkets={data?.length ?? 0}
            totalVolume={totalVolume}
            avgYesPct={avgYesPct}
            avgSpread={avgSpread}
            volumeByCategory={volumeByCategory}
            maxCatVolume={maxCatVolume}
            expanded={expanded}
          />
        )}
      </div>
    </PanelWrapper>
  )
}
