import { useIsExpanded } from '@/components/layout/PanelWrapper'
import type { FredSeries } from '@/services/api/macro'

const KNOWN_RANGES: Record<string, { min: number; max: number; avgLabel: string }> = {
  UNRATE:           { min: 3.4, max: 14.7, avgLabel: 'avg ~5%' },
  CPIAUCSL:         { min: -0.5, max: 9.1,  avgLabel: 'avg ~2%' },
  CPILFESL:         { min: 0.5, max: 6.6,   avgLabel: 'avg ~2%' },
  A191RL1Q225SBEA:  { min: -32, max: 7.4,   avgLabel: 'avg ~2.5%' },
  GDPC1:            { min: 14000, max: 23000, avgLabel: 'growth trend' },
  DGS10:            { min: 0.5, max: 5.0,   avgLabel: 'avg ~3%' },
  DGS2:             { min: 0.1, max: 5.3,   avgLabel: 'avg ~2.5%' },
  FEDFUNDS:         { min: 0, max: 5.5,     avgLabel: 'avg ~2%' },
  PAYEMS:           { min: 128000, max: 160000, avgLabel: 'growth trend' },
}

function getRange(s: FredSeries): { min: number; max: number; avg: number } {
  const known = KNOWN_RANGES[s.seriesId]
  if (known) return { min: known.min, max: known.max, avg: (known.min + known.max) / 2 }
  const lo = Math.min(s.value, s.previous) * 0.85
  const hi = Math.max(s.value, s.previous) * 1.15
  return { min: lo, max: hi, avg: (lo + hi) / 2 }
}

function rangePosition(value: number, min: number, max: number): number {
  if (max === min) return 50
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
}

function aboveAvgLabel(value: number, avg: number, seriesId: string): { text: string; cls: string } {
  const isInverted = seriesId === 'UNRATE'
  if (value > avg) {
    return isInverted
      ? { text: 'Above Avg', cls: 'text-red-500' }
      : { text: 'Above Avg', cls: 'text-emerald-500' }
  } else if (value < avg) {
    return isInverted
      ? { text: 'Below Avg', cls: 'text-emerald-500' }
      : { text: 'Below Avg', cls: 'text-red-500' }
  }
  return { text: 'At Avg', cls: 'text-muted-foreground' }
}

function computeHealthScore(data: FredSeries[]): { score: number; label: 'EXPANSION' | 'SLOWDOWN' | 'CONTRACTION' } {
  let score = 50

  const gdp = data.find((s) =>
    s.seriesId === 'A191RL1Q225SBEA' || s.seriesId === 'GDPC1' || s.name.toLowerCase().includes('gdp')
  )
  if (gdp) {
    if (gdp.value > 3) score += 20
    else if (gdp.value > 1.5) score += 12
    else if (gdp.value > 0) score += 5
    else score -= 10
  }

  const unrate = data.find((s) => s.seriesId === 'UNRATE' || s.name.toLowerCase().includes('unemployment'))
  if (unrate) {
    if (unrate.value < 4) score += 20
    else if (unrate.value < 5) score += 10
    else if (unrate.value < 6) score += 2
    else score -= 10
  }

  const cpi = data.find((s) =>
    s.seriesId === 'CPIAUCSL' || s.seriesId === 'CPILFESL' ||
    s.name.toLowerCase().includes('cpi') || s.name.toLowerCase().includes('inflation')
  )
  if (cpi) {
    const dist = Math.abs(cpi.value - 2)
    if (dist < 0.5) score += 20
    else if (dist < 1) score += 10
    else if (dist < 2) score += 2
    else score -= 8
  }

  const clamped = Math.max(0, Math.min(100, score))
  const label = clamped >= 65 ? 'EXPANSION' : clamped >= 40 ? 'SLOWDOWN' : 'CONTRACTION'
  return { score: clamped, label }
}

export function EconomicDataTrends({ data }: { data: FredSeries[] }) {
  const expanded = useIsExpanded()

  if (!data.length) {
    return (
      <div className="py-4 text-center text-[10px] text-muted-foreground">
        No data available for trends.
      </div>
    )
  }

  const { score, label } = computeHealthScore(data)
  const scoreColor = label === 'EXPANSION' ? 'text-emerald-500' : label === 'SLOWDOWN' ? 'text-amber-400' : 'text-red-500'
  const barColor   = label === 'EXPANSION' ? 'bg-emerald-500'  : label === 'SLOWDOWN' ? 'bg-amber-400'   : 'bg-red-500'

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border/30 bg-muted/20 px-3 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Economic Health</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${scoreColor}`}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-border/40 overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
          </div>
          <span className={`text-[11px] font-bold tabular-nums ${scoreColor}`}>{score}</span>
        </div>
      </div>

      <div className="space-y-2">
        {data.map((s) => {
          const range = getRange(s)
          const pos = rangePosition(s.value, range.min, range.max)
          const aa = aboveAvgLabel(s.value, range.avg, s.seriesId)
          return (
            <div key={s.seriesId}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={`font-medium text-foreground ${expanded ? 'text-[12px]' : 'text-[11px] truncate max-w-[120px]'}`}>{s.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-medium ${aa.cls}`}>{aa.text}</span>
                  <span className={`tabular-nums text-foreground ${expanded ? 'text-[13px] font-bold' : 'text-[11px]'}`}>{s.value.toFixed(2)}</span>
                </div>
              </div>
              <div className="relative h-1 rounded-full bg-border/40 overflow-visible">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-foreground border border-background"
                  style={{ left: `calc(${pos}% - 3px)` }}
                />
                <div className="absolute left-1/2 top-0 w-px h-full bg-border/60" />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] text-muted-foreground/60 tabular-nums">{range.min.toFixed(1)}</span>
                <span className="text-[9px] text-muted-foreground/60 tabular-nums">{range.max.toFixed(1)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
