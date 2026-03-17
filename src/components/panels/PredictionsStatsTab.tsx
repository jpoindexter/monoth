import { fmtDolVol as fmtVol } from '@/lib/panel-utils'

type Category = 'Finance' | 'Crypto'

interface Props {
  totalMarkets: number
  totalVolume: number
  avgYesPct: number
  avgSpread: number
  volumeByCategory: Record<string, number>
  maxCatVolume: number
  expanded: boolean
}

const STAT_CATEGORIES: Category[] = ['Finance', 'Crypto']

export function PredictionsStatsTab({
  totalMarkets, totalVolume, avgYesPct, avgSpread,
  volumeByCategory, maxCatVolume, expanded,
}: Props) {
  const conviction =
    avgSpread > 30 ? { label: 'HIGH', cls: 'text-emerald-500' }
    : avgSpread > 15 ? { label: 'MODERATE', cls: 'text-amber-400' }
    : { label: 'LOW', cls: 'text-red-400' }

  return (
    <div className="space-y-3">
      <div className={`grid gap-2 ${expanded ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <div className="rounded-md border border-border/30 p-2 text-center">
          <div className="text-[18px] font-bold text-foreground">{totalMarkets}</div>
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
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground w-10 text-right shrink-0">{fmtVol(vol)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
