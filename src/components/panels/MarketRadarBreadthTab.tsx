interface Mover {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
}

interface MoversData {
  gainers: Mover[]
  losers: Mover[]
  active: Mover[]
}

interface Props {
  movers: MoversData | null
}

function BreadthBar({ advances, declines }: { advances: number; declines: number }) {
  const total = advances + declines
  if (total === 0) return null
  const advPct = (advances / total) * 100
  const decPct = (declines / total) * 100
  const ratio = declines > 0 ? (advances / declines).toFixed(2) : advances > 0 ? '∞' : '0'

  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Advance / Decline</span>
          <span className="text-[10px] text-muted-foreground">A/D {ratio}</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden gap-px">
          <div className="bg-emerald-500 rounded-l-full transition-all duration-500" style={{ width: `${advPct}%` }} />
          <div className="bg-red-500 rounded-r-full transition-all duration-500" style={{ width: `${decPct}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-emerald-500">{advances} advancing</span>
          <span className="text-[10px] text-red-500">{declines} declining</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Breadth Meter</span>
        </div>
        <div className="relative h-3 bg-muted/40 rounded-full overflow-hidden">
          <div className="absolute left-0 top-0 h-full bg-red-500/70 rounded-l-full" style={{ width: `${decPct}%` }} />
          <div className="absolute right-0 top-0 h-full bg-emerald-500/70 rounded-r-full" style={{ width: `${advPct}%` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-foreground/80 leading-none">
              {advPct.toFixed(0)}% adv
            </span>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-center text-muted-foreground pt-1">
        {advances > declines ? (
          <span className="text-emerald-500 font-medium">Breadth bullish</span>
        ) : declines > advances ? (
          <span className="text-red-500 font-medium">Breadth bearish</span>
        ) : (
          <span>Breadth neutral</span>
        )}
        <span className="text-muted-foreground"> — A/D ratio {ratio}</span>
      </div>
    </div>
  )
}

function NewHighsLows({ gainers, losers }: { gainers: Mover[]; losers: Mover[] }) {
  const newHighs = gainers.filter((m) => m.changePercent > 5).length
  const newLows = losers.filter((m) => m.changePercent < -5).length
  const total = newHighs + newLows
  const highPct = total > 0 ? (newHighs / total) * 100 : 50

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">New Highs vs Lows</span>
        <span className="text-[10px] text-muted-foreground">&gt;5% move</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        <div className="bg-emerald-500 rounded-l-full transition-all duration-500" style={{ width: `${highPct}%` }} />
        <div className="bg-red-500 rounded-r-full transition-all duration-500" style={{ width: `${100 - highPct}%` }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-emerald-500">{newHighs} new highs</span>
        <span className="text-[10px] text-red-500">{newLows} new lows</span>
      </div>
    </div>
  )
}

export function MarketRadarBreadthTab({ movers }: Props) {
  if (!movers) {
    return (
      <div className="text-[10px] text-muted-foreground text-center pt-6">Loading breadth data...</div>
    )
  }

  return (
    <div className="px-1 space-y-4">
      <BreadthBar advances={movers.gainers.length} declines={movers.losers.length} />
      <NewHighsLows gainers={movers.gainers} losers={movers.losers} />
    </div>
  )
}
