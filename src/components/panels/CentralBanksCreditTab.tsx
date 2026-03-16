import { useIsExpanded } from '@/components/layout/PanelWrapper'

export interface CreditEntry {
  countryCode: string
  countryName: string
  creditGdpRatio: number
  previousRatio: number
  date: string
}

interface Props {
  sortedCredit: CreditEntry[]
}

export function CentralBanksCreditTab({ sortedCredit }: Props) {
  const expanded = useIsExpanded()

  return (
    <div className="space-y-0">
      <p className="text-[9px] text-muted-foreground/60 mb-1.5">Total credit to private sector — BIS quarterly</p>
      <div className="flex text-[9px] uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/20">
        <span className="flex-1">Country</span>
        <span className="w-20 text-right tabular-nums">Credit/GDP</span>
        <span className="w-16 text-right tabular-nums">vs Prev</span>
      </div>
      {sortedCredit.length === 0 && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">Loading…</div>
      )}
      {sortedCredit.map((row) => {
        const change = row.creditGdpRatio - row.previousRatio
        const barPct = Math.min((row.creditGdpRatio / 300) * 100, 100)
        const barColor = row.creditGdpRatio > 200 ? 'bg-red-500' : row.creditGdpRatio > 150 ? 'bg-amber-500' : 'bg-sky-500'
        const ratioColor = row.creditGdpRatio > 200 ? 'text-red-500' : row.creditGdpRatio > 150 ? 'text-amber-500' : 'text-foreground'
        return (
          <div key={row.countryCode} className="py-0.5 border-b border-border/20 last:border-0">
            <div className="flex items-center">
              <div className="flex-1 flex items-center gap-1.5">
                <span className="text-[9px] font-bold bg-foreground/10 text-foreground px-1 py-px rounded-sm tabular-nums">
                  {row.countryCode}
                </span>
                <span className={`font-medium ${expanded ? 'text-[12px]' : 'text-[11px]'}`}>{row.countryName}</span>
              </div>
              <span className={`w-20 text-right tabular-nums font-bold ${expanded ? 'text-[12px]' : 'text-[11px]'} ${ratioColor}`}>
                {row.creditGdpRatio.toFixed(1)}%
              </span>
              <span className={`w-16 text-right tabular-nums font-medium ${expanded ? 'text-[12px]' : 'text-[11px]'} ${change > 0 ? 'text-red-400' : change < 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {change > 0 ? '+' : ''}{change.toFixed(1)}pp
              </span>
            </div>
            <div className="h-1 rounded-full bg-foreground/10 w-full overflow-hidden mt-0.5">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${barPct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
