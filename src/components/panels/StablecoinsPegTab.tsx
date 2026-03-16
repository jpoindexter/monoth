import { pegColor } from '@/components/panels/stablecoins-data'
import type { Stablecoin } from '@/components/panels/stablecoins-data'

interface Props {
  data: Stablecoin[]
  expanded: boolean
}

export function StablecoinsPegTab({ data, expanded }: Props) {
  if (!data.length) {
    return (
      <div className="py-4 text-center text-[10px] text-muted-foreground">No data available.</div>
    )
  }

  const avgDev = data.reduce((s, c) => s + c.pegDeviation, 0) / data.length
  const healthLabel = avgDev < 0.0005 ? 'STRONG' : avgDev < 0.002 ? 'MODERATE' : 'WEAK'
  const healthCls =
    avgDev < 0.0005
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
      : avgDev < 0.002
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'

  return (
    <div>
      <div className="mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${healthCls}`}>
          Peg Health: {healthLabel}
        </span>
      </div>
      <div className="space-y-2">
        {data.map((coin) => {
          const dev = coin.pegDeviation
          const barColor = dev < 0.001 ? '#10b981' : dev < 0.005 ? '#eab308' : '#ef4444'
          const above = coin.price >= 1.0
          const pct = Math.min(dev * 10000, 100)

          return (
            <div key={coin.id} className="flex items-center gap-2">
              <div className="shrink-0 w-10">
                <div className={`${expanded ? 'text-[12px]' : 'text-[10px]'} font-medium text-foreground`}>
                  {coin.symbol.toUpperCase()}
                </div>
                {expanded && <div className="text-[10px] text-muted-foreground">{coin.name}</div>}
              </div>
              <div className="flex items-center gap-px" style={{ width: expanded ? 160 : 100 }}>
                <div className="flex-1 flex justify-end" style={{ height: 8 }}>
                  {!above && (
                    <div style={{ width: `${pct}%`, backgroundColor: barColor, borderRadius: '2px 0 0 2px', height: '100%' }} />
                  )}
                </div>
                <div style={{ width: 1, backgroundColor: '#6b7280', height: 10, flexShrink: 0 }} />
                <div className="flex-1" style={{ height: 8 }}>
                  {above && (
                    <div style={{ width: `${pct}%`, backgroundColor: barColor, borderRadius: '0 2px 2px 0', height: '100%' }} />
                  )}
                </div>
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                ${coin.price.toFixed(4)}
              </span>
              <span className={`text-[10px] tabular-nums font-medium ${pegColor(dev)}`}>
                {above ? '+' : '-'}{(dev * 100).toFixed(3)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
