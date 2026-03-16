import { YIELDS, RISK_CLS } from '@/components/panels/stablecoins-data'

export function StablecoinsYieldTab() {
  const maxApy = Math.max(...YIELDS.map((y) => y.apy))

  return (
    <div className="space-y-2">
      {YIELDS.map((entry) => (
        <div key={`${entry.protocol}-${entry.asset}`}>
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-foreground">{entry.protocol}</span>
              <span className="text-[10px] text-muted-foreground">{entry.asset}</span>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm ${RISK_CLS[entry.risk]}`}>
                {entry.risk}
              </span>
            </div>
            <span className="text-[10px] tabular-nums font-medium text-foreground">
              {entry.apy.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(entry.apy / maxApy) * 100}%`,
                backgroundColor: entry.risk === 'HIGH' ? '#ef4444' : entry.risk === 'MED' ? '#eab308' : '#10b981',
              }}
            />
          </div>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground pt-1">APY sorted descending. Rates indicative, not live.</p>
    </div>
  )
}
