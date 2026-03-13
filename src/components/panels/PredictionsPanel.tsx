import { useCallback, useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'

interface Prediction {
  id: string
  title: string
  yesPct: number
  noPct: number
  volume: number
  endDate: string
}

type Category = 'All' | 'Politics' | 'Finance' | 'Crypto' | 'Sports' | 'Tech'

const CATEGORY_KEYWORDS: Record<Exclude<Category, 'All'>, string[]> = {
  Politics: ['election', 'president', 'congress', 'senate', 'vote', 'trump', 'biden', 'party', 'governor'],
  Finance: ['market', 'stock', 'fed', 'rate', 'gdp', 'recession', 'inflation', 's&p', 'dow', 'nasdaq'],
  Crypto: ['bitcoin', 'ethereum', 'crypto', 'token', 'defi', 'nft', 'blockchain'],
  Sports: ['nba', 'nfl', 'mlb', 'f1', 'champion', 'world cup', 'tournament', 'playoff'],
  Tech: ['ai', 'apple', 'google', 'meta', 'microsoft', 'spacex', 'launch', 'chip'],
}

function getCategory(title: string): Exclude<Category, 'All'> | null {
  const lower = title.toLowerCase()
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat as Exclude<Category, 'All'>
  }
  return null
}

function fmtVol(n: number): string {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K'
  return '$' + n.toFixed(0)
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

const TABS: Category[] = ['All', 'Politics', 'Finance', 'Crypto', 'Sports', 'Tech']

export default function PredictionsPanel() {
  const [activeTab, setActiveTab] = useState<Category>('All')

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/predictions/polymarket')
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<Prediction[]>
  }, [])

  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 300_000 })

  const categorized = (data ?? []).map((p) => ({ ...p, category: getCategory(p.title) }))

  const counts: Record<Category, number> = {
    All: categorized.length,
    Politics: categorized.filter((p) => p.category === 'Politics').length,
    Finance: categorized.filter((p) => p.category === 'Finance').length,
    Crypto: categorized.filter((p) => p.category === 'Crypto').length,
    Sports: categorized.filter((p) => p.category === 'Sports').length,
    Tech: categorized.filter((p) => p.category === 'Tech').length,
  }

  const filtered = activeTab === 'All' ? categorized : categorized.filter((p) => p.category === activeTab)

  const maxVolume = filtered.reduce((m, p) => Math.max(m, p.volume), 1)
  const totalVolume = (data ?? []).reduce((s, p) => s + p.volume, 0)

  const tabCls = (tab: Category) =>
    `text-[9px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
      activeTab === tab
        ? 'bg-foreground text-background font-semibold'
        : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <PanelWrapper title="Prediction Markets" loading={loading} error={error} onRetry={refresh}>
      <div>
        {data && data.length > 0 && (
          <div className="text-[9px] text-muted-foreground mb-1.5">
            {data.length} markets | {fmtVol(totalVolume)} total volume
          </div>
        )}

        <div className="flex flex-wrap gap-1 mb-2">
          {TABS.map((tab) => (
            <button key={tab} className={tabCls(tab)} onClick={() => setActiveTab(tab)}>
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
                <div className="text-[11px] font-medium text-foreground leading-snug line-clamp-2 flex-1">
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
                <span className="text-[9px] text-muted-foreground shrink-0">{fmtVol(p.volume)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PanelWrapper>
  )
}
