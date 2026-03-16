import { fmtCap, DOMINANCE_COLORS, KNOWN_ORDER } from '@/components/panels/stablecoins-data'
import type { Stablecoin } from '@/components/panels/stablecoins-data'

interface Props {
  data: Stablecoin[]
  expanded: boolean
}

export function StablecoinsDominanceTab({ data, expanded }: Props) {
  if (!data.length) {
    return (
      <div className="py-4 text-center text-[10px] text-muted-foreground">No data available.</div>
    )
  }

  const total = data.reduce((s, c) => s + c.marketCap, 0)
  const known = KNOWN_ORDER
    .map((sym) => data.find((c) => c.symbol.toUpperCase() === sym))
    .filter(Boolean) as Stablecoin[]
  const knownCap = known.reduce((s, c) => s + c.marketCap, 0)
  const othersCap = total - knownCap

  const segments = [
    ...known.map((c) => ({ label: c.symbol.toUpperCase(), cap: c.marketCap, pct: c.marketCap / total })),
    ...(othersCap > 0 ? [{ label: 'Others', cap: othersCap, pct: othersCap / total }] : []),
  ]

  return (
    <div>
      <div className={`${expanded ? 'h-6' : 'h-4'} rounded-full overflow-hidden flex mb-3`}>
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{ width: `${seg.pct * 100}%`, backgroundColor: DOMINANCE_COLORS[seg.label] ?? '#94a3b8' }}
          />
        ))}
      </div>
      <div className="space-y-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: DOMINANCE_COLORS[seg.label] ?? '#94a3b8' }}
            />
            <span className={`${expanded ? 'text-[12px]' : 'text-[10px]'} font-medium text-foreground w-10`}>{seg.label}</span>
            <span className={`${expanded ? 'text-[12px]' : 'text-[10px]'} tabular-nums text-muted-foreground flex-1`}>{fmtCap(seg.cap)}</span>
            <span className={`${expanded ? 'text-[12px]' : 'text-[10px]'} tabular-nums font-medium text-foreground`}>
              {(seg.pct * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
