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

export function LiveMarketsBreadth({
  moversData,
  moversLoading,
}: {
  moversData: MoversData | null
  moversLoading: boolean
}) {
  if (moversLoading) {
    return <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
  }

  const gainers = moversData?.gainers ?? []
  const losers = moversData?.losers ?? []
  const advancers = gainers.length
  const decliners = losers.length
  const total = advancers + decliners || 1
  const advPct = (advancers / total) * 100
  const decPct = (decliners / total) * 100
  const adRatio = decliners === 0 ? advancers : advancers / decliners
  const newHighs = gainers.filter((m) => m.changePercent > 3).length
  const newLows = losers.filter((m) => m.changePercent < -3).length

  let thrust: string
  let thrustColor: string
  if (adRatio > 2) {
    thrust = 'STRONG THRUST'
    thrustColor = 'bg-emerald-600 text-white'
  } else if (adRatio > 1.5) {
    thrust = 'BULLISH'
    thrustColor = 'bg-emerald-500/20 text-emerald-500'
  } else if (adRatio < 0.5) {
    thrust = 'OVERSOLD'
    thrustColor = 'bg-red-600 text-white'
  } else if (adRatio < 0.67) {
    thrust = 'BEARISH'
    thrustColor = 'bg-red-500/20 text-red-500'
  } else {
    thrust = 'NEUTRAL'
    thrustColor = 'bg-muted text-muted-foreground'
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Thrust</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${thrustColor}`}>
          {thrust}
        </span>
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>ADV {advancers}</span>
          <span>A/D {adRatio.toFixed(2)}</span>
          <span>DEC {decliners}</span>
        </div>
        <div className="flex h-2 rounded-sm overflow-hidden gap-px">
          <div className="bg-emerald-500 transition-all" style={{ width: `${advPct}%` }} />
          <div className="bg-red-500 transition-all" style={{ width: `${decPct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] mt-0.5">
          <span className="text-emerald-500">{advPct.toFixed(0)}% Adv</span>
          <span className="text-red-500">{decPct.toFixed(0)}% Dec</span>
        </div>
      </div>

      <div className="border-t border-border/20 pt-2 grid grid-cols-2 gap-2">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">New Highs</div>
          <div className="text-[15px] font-bold text-emerald-500">{newHighs}</div>
          <div className="text-[10px] text-muted-foreground">(&gt;3% up)</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">New Lows</div>
          <div className="text-[15px] font-bold text-red-500">{newLows}</div>
          <div className="text-[10px] text-muted-foreground">(&gt;3% dn)</div>
        </div>
      </div>

      {!moversData && (
        <div className="text-center text-[10px] text-muted-foreground pt-1">
          Switch to Gainers/Losers tab to load data
        </div>
      )}
    </div>
  )
}
