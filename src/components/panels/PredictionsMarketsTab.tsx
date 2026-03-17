import type { EnrichedPrediction, Category } from './PredictionsPanel'

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

function SourceBadge({ source }: { source?: string }) {
  if (source === 'kalshi') return <span className="text-[7px] font-bold bg-blue-500/15 text-blue-400 px-1 py-0.5 rounded-sm">KALSHI</span>
  return <span className="text-[7px] font-bold bg-purple-500/15 text-purple-400 px-1 py-0.5 rounded-sm">POLY</span>
}

const CATEGORY_TABS: Category[] = ['All', 'Finance', 'Crypto']

interface Props {
  filtered: EnrichedPrediction[]
  counts: Record<Category, number>
  maxVolume: number
  totalVolume: number
  totalMarkets: number
  activeCategory: Category
  setActiveCategory: (c: Category) => void
  loading: boolean
  dataExists: boolean
  expanded: boolean
}

export function PredictionsMarketsTab({
  filtered, counts, maxVolume, totalVolume, totalMarkets,
  activeCategory, setActiveCategory, loading, dataExists, expanded,
}: Props) {
  const catTabCls = (tab: Category) =>
    `text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
      activeCategory === tab
        ? 'bg-foreground text-background font-semibold'
        : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <div>
      {totalMarkets > 0 && (
        <div className="text-[10px] text-muted-foreground mb-1.5">
          {totalMarkets} markets | {fmtVol(totalVolume)} total volume
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
            {dataExists ? 'No markets in this category.' : 'No prediction markets available. Data refreshes every 5 minutes.'}
          </div>
        )}
        {filtered.map((p) => (
          <div key={p.id} className="py-1.5 border-b border-border/20 last:border-0">
            <div className="flex items-start gap-1 mb-1">
              <div className={`text-[11px] font-medium text-foreground leading-snug flex-1 ${expanded ? '' : 'line-clamp-2'}`}>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                    {p.title}
                  </a>
                ) : p.title}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <SourceBadge source={p.source} />
                <TrendingBadge volume={p.volume} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="flex-1 h-3 rounded-sm overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex">
                <div className="h-full bg-emerald-500 flex items-center justify-center" style={{ width: `${p.yesPct}%` }}>
                  {p.yesPct >= 20 && <span className="text-[7px] font-bold text-white">Yes {p.yesPct}%</span>}
                </div>
                <div className="h-full bg-red-400 flex items-center justify-center" style={{ width: `${p.noPct}%` }}>
                  {p.noPct >= 20 && <span className="text-[7px] font-bold text-white">No {p.noPct}%</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-foreground/20">
                <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${(p.volume / maxVolume) * 100}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{fmtVol(p.volume)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
