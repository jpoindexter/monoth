import {
  RESERVES,
  RESERVE_COLORS,
  RESERVE_LABELS,
  reserveQualityScore,
  qualityLabel,
} from '@/components/panels/stablecoins-data'
import type { ReserveSegmentType } from '@/components/panels/stablecoins-data'

export function StablecoinsReservesTab() {
  const overallScore = Math.round(
    RESERVES.reduce((s, r) => s + reserveQualityScore(r), 0) / RESERVES.length
  )
  const { label: overallLabel, cls: overallCls } = qualityLabel(overallScore)

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Reserve Quality Score</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${overallCls}`}>
          {overallLabel} — {overallScore}% T-Bills avg
        </span>
      </div>

      <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1">
        {(Object.keys(RESERVE_LABELS) as ReserveSegmentType[]).map((type) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: RESERVE_COLORS[type] }} />
            <span className="text-[10px] text-muted-foreground">{RESERVE_LABELS[type]}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {RESERVES.map((entry) => {
          const score = reserveQualityScore(entry)
          const { label, cls } = qualityLabel(score)
          return (
            <div key={entry.symbol}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-foreground w-10">{entry.symbol}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">${entry.totalBn}B</span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-px rounded-full ${cls}`}>
                  {label}
                </span>
              </div>
              <div className="h-3 rounded-sm overflow-hidden flex">
                {entry.segments.map((seg) => (
                  <div
                    key={seg.type}
                    style={{ width: `${seg.pct}%`, backgroundColor: RESERVE_COLORS[seg.type] }}
                    title={`${RESERVE_LABELS[seg.type]}: ${seg.pct}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-2 mt-0.5">
                {entry.segments.map((seg) => (
                  <span key={seg.type} className="text-[10px] text-muted-foreground">
                    {RESERVE_LABELS[seg.type]} {seg.pct}%
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
