import { useIsExpanded } from '@/components/layout/PanelWrapper'

export interface EerEntry {
  countryCode: string
  countryName: string
  realEer: number
  realChange: number
  date: string
}

interface Props {
  sortedEer: EerEntry[]
}

export function CentralBanksEerTab({ sortedEer }: Props) {
  const expanded = useIsExpanded()

  return (
    <div className="space-y-0">
      <p className="text-[9px] text-muted-foreground/60 mb-1.5">Real effective exchange rate — BIS broad basket</p>
      <div className="flex text-[9px] uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/20">
        <span className="flex-1">Country</span>
        <span className="w-20 text-right tabular-nums">REER Index</span>
        <span className="w-20 text-right tabular-nums">MoM Chg%</span>
      </div>
      {sortedEer.length === 0 && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">Loading…</div>
      )}
      {sortedEer.map((row) => (
        <div key={row.countryCode} className="flex items-center py-0.5 border-b border-border/20 last:border-0">
          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-[9px] font-bold bg-foreground/10 text-foreground px-1 py-px rounded-sm tabular-nums">
              {row.countryCode}
            </span>
            <span className={`font-medium ${expanded ? 'text-[12px]' : 'text-[11px]'}`}>{row.countryName}</span>
          </div>
          <span className={`w-20 text-right tabular-nums font-medium ${expanded ? 'text-[12px]' : 'text-[11px]'} ${row.realEer > 100 ? 'text-foreground' : 'text-muted-foreground'}`}>
            {row.realEer.toFixed(1)}
          </span>
          <span className={`w-20 text-right tabular-nums font-medium ${expanded ? 'text-[12px]' : 'text-[11px]'} ${row.realChange > 0 ? 'text-emerald-500' : row.realChange < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {row.realChange > 0 ? '+' : ''}{row.realChange.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  )
}
