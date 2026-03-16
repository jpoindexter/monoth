const CARRY_PAIRS = [
  { pair: 'USD/JPY', carry: 4.75, risk: 'LOW' as const },
  { pair: 'AUD/JPY', carry: 4.15, risk: 'LOW' as const },
  { pair: 'NZD/JPY', carry: 5.00, risk: 'LOW' as const },
  { pair: 'USD/CHF', carry: 3.75, risk: 'LOW' as const },
  { pair: 'GBP/JPY', carry: 4.75, risk: 'LOW' as const },
  { pair: 'MXN/JPY', carry: 10.50, risk: 'HIGH' as const },
]

const RISK_COLORS: Record<string, string> = {
  LOW: 'text-emerald-600 bg-emerald-500/10',
  MED: 'text-amber-500 bg-amber-500/10',
  HIGH: 'text-red-500 bg-red-500/10',
}

function getCarryRisk(vix: number): { label: string; color: string } {
  if (vix < 20) return { label: 'SAFE', color: 'text-emerald-600' }
  if (vix <= 30) return { label: 'CAUTION', color: 'text-amber-500' }
  return { label: 'DANGER', color: 'text-red-500' }
}

export function ForexCarryTab({ vixSpot }: { vixSpot: number }) {
  const { label: riskLabel, color: riskColor } = getCarryRisk(vixSpot)
  const maxCarry = Math.max(...CARRY_PAIRS.map(p => p.carry))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Carry Trade Risk</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">VIX ~{vixSpot}</span>
          <span className={`text-[10px] font-bold uppercase ${riskColor}`}>{riskLabel}</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {CARRY_PAIRS.map(({ pair, carry, risk }) => (
          <div key={pair} className="flex items-center gap-2">
            <span className="text-[10px] font-medium w-14 shrink-0">{pair}</span>
            <div className="flex-1 h-2 bg-border/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${(carry / maxCarry) * 100}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-emerald-600 w-10 text-right shrink-0">
              +{carry.toFixed(2)}%
            </span>
            <span className={`text-[9px] uppercase font-bold px-1 py-0.5 rounded-sm shrink-0 ${RISK_COLORS[risk]}`}>
              {risk}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
