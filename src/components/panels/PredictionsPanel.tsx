import { useCallback, useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'

interface Prediction {
  id: string
  title: string
  yesPct: number
  noPct: number
  volume: number
  endDate: string
}


type Category = 'All' | 'Finance' | 'Crypto'
type TopTab = 'Markets' | 'Trending' | 'Stats'

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

function fmtVol(n: number | string): string {
  const v = typeof n === 'string' ? Number(n) : n
  if (!isFinite(v)) return '$0'
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K'
  return '$' + v.toFixed(0)
}

function TrendingBadge({ volume }: { volume: number }) {
  if (volume > 500_000)
    return <span className="text-[7px] font-bold bg-orange-500 text-white px-1 rounded-sm">HOT</span>
  if (volume > 100_000)
    return <span className="text-[7px] font-bold text-muted-foreground">ACTIVE</span>
  if (volume < 10_000)
    return <span className="text-[7px] font-bold text-blue-400">NEW</span>
  return null
}

function getMomentum(yesPct: number): { label: string; cls: string } {
  if (yesPct > 60) return { label: 'Strong Yes', cls: 'text-emerald-500 font-bold' }
  if (yesPct < 40) return { label: 'Strong No', cls: 'text-red-400 font-bold' }
  return { label: 'Contested', cls: 'text-yellow-400 font-bold' }
}

const CATEGORY_TABS: Category[] = ['All', 'Finance', 'Crypto']
const TOP_TABS: TopTab[] = ['Markets', 'Trending', 'Stats']

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

  // Only show Finance + Crypto markets — no sports, politics, entertainment
  const moneyMarkets = (data ?? [])
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

  const conviction =
    avgSpread > 30 ? { label: 'HIGH', cls: 'text-emerald-500' }
    : avgSpread > 15 ? { label: 'MODERATE', cls: 'text-yellow-400' }
    : { label: 'LOW', cls: 'text-red-400' }

  const STAT_CATEGORIES: Exclude<Category, 'All'>[] = ['Finance', 'Crypto']
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

  const catTabCls = (tab: Category) =>
    `text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
      activeCategory === tab
        ? 'bg-foreground text-background font-semibold'
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
          <div>
            {data && data.length > 0 && (
              <div className="text-[10px] text-muted-foreground mb-1.5">
                {data.length} markets | {fmtVol(totalVolume)} total volume
              </div>
            )}
            <div className="flex flex-wrap gap-1 mb-2">
              {CATEGORY_TABS.map((tab) => (
                <button key={tab} className={catTabCls(tab)} onClick={() => setActiveCategory(tab)}>
                  {tab}
                  {counts[tab] > 0 && (
                    <span className="ml-0.5 opacity-60">{counts[tab]}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="space-y-0">
              {filtered.length === 0 && !loading && (
                <div className="py-4 text-center text-[10px] text-muted-foreground">
                  {data && data.length > 0 ? 'No markets in this category.' : 'No prediction markets available. Data refreshes every 5 minutes.'}
                </div>
              )}
              {filtered.map((p) => (
                <div key={p.id} className="py-1.5 border-b border-border/20 last:border-0">
                  <div className="flex items-start gap-1 mb-1">
                    <div className={`text-[11px] font-medium text-foreground leading-snug flex-1 ${expanded ? '' : 'line-clamp-2'}`}>
                      {p.title}
                    </div>
                    <TrendingBadge volume={p.volume} />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="flex-1 h-3 rounded-sm overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex">
                      <div
                        className="h-full bg-emerald-500 flex items-center justify-center"
                        style={{ width: `${p.yesPct}%` }}
                      >
                        {p.yesPct >= 20 && (
                          <span className="text-[7px] font-bold text-white">Yes {p.yesPct}%</span>
                        )}
                      </div>
                      <div
                        className="h-full bg-red-400 flex items-center justify-center"
                        style={{ width: `${p.noPct}%` }}
                      >
                        {p.noPct >= 20 && (
                          <span className="text-[7px] font-bold text-white">No {p.noPct}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-foreground/20">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{ width: `${(p.volume / maxVolume) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{fmtVol(p.volume)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {topTab === 'Trending' && (
          <div className="space-y-3">
            {topFive.length === 0 && !loading && (
              <div className="py-4 text-center text-[10px] text-muted-foreground">No data available.</div>
            )}
            {topFive.map((p, i) => {
              const momentum = getMomentum(p.yesPct)
              return (
                <div key={p.id} className="rounded-md border border-border/30 p-2.5 bg-background/50">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-[11px] font-bold text-muted-foreground shrink-0 mt-0.5">#{i + 1}</span>
                    <div className="text-[13px] font-semibold text-foreground leading-snug flex-1">
                      {p.title}
                    </div>
                  </div>
                  <div className="flex-1 h-4 rounded-sm overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex mb-2">
                    <div
                      className="h-full bg-emerald-500 flex items-center justify-center"
                      style={{ width: `${p.yesPct}%` }}
                    >
                      {p.yesPct >= 15 && (
                        <span className="text-[9px] font-bold text-white">Yes {p.yesPct}%</span>
                      )}
                    </div>
                    <div
                      className="h-full bg-red-400 flex items-center justify-center"
                      style={{ width: `${p.noPct}%` }}
                    >
                      {p.noPct >= 15 && (
                        <span className="text-[9px] font-bold text-white">No {p.noPct}%</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-foreground/20">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{ width: `${(p.volume / topFiveMaxVol) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{fmtVol(p.volume)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Momentum</span>
                    <span className={`text-[10px] ${momentum.cls}`}>{momentum.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {topTab === 'Stats' && (
          <div className="space-y-3">
            <div className={`grid gap-2 ${expanded ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <div className="rounded-md border border-border/30 p-2 text-center">
                <div className="text-[18px] font-bold text-foreground">{data?.length ?? 0}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Markets</div>
              </div>
              <div className="rounded-md border border-border/30 p-2 text-center">
                <div className="text-[18px] font-bold text-foreground">{fmtVol(totalVolume)}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Volume</div>
              </div>
              <div className="rounded-md border border-border/30 p-2 text-center">
                <div className="text-[18px] font-bold text-emerald-500">{avgYesPct.toFixed(0)}%</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Avg Yes</div>
              </div>
              {expanded && (
                <div className="rounded-md border border-border/30 p-2 text-center">
                  <div className="text-[18px] font-bold text-indigo-400">{avgSpread.toFixed(1)}%</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Avg Spread</div>
                </div>
              )}
            </div>

            <div className="rounded-md border border-border/30 p-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Market Conviction</span>
                <span className={`text-[11px] font-bold ${conviction.cls}`}>{conviction.label}</span>
              </div>
              <div className="text-[9px] text-muted-foreground">
                Avg yes/no spread: {avgSpread.toFixed(1)}%
              </div>
            </div>

            <div className="rounded-md border border-border/30 p-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Volume by Category</div>
              <div className="space-y-1.5">
                {STAT_CATEGORIES.map((cat) => {
                  const vol = volumeByCategory[cat] ?? 0
                  const pct = maxCatVolume > 0 ? (vol / maxCatVolume) * 100 : 0
                  return (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-12 shrink-0">{cat}</span>
                      <div className="flex-1 h-2 rounded-full bg-foreground/10">
                        <div
                          className="h-2 rounded-full bg-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-10 text-right shrink-0">{fmtVol(vol)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </PanelWrapper>
  )
}
