export interface BalanceSheet {
  name: string
  currency: string
  current: number | null
  peak: number | null
  unit: string
  usdEq: number | null
  qtPace: string | null
  estimated: boolean
}

interface Props {
  balanceSheets: BalanceSheet[]
}

export function CentralBanksBalanceSheetTab({ balanceSheets }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1 pb-1.5 border-b border-border/20">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Global Liquidity (USD eq)</span>
          <div className="text-[14px] font-bold tabular-nums">
            ~${balanceSheets.reduce((s, b) => s + (b.usdEq ?? 0), 0).toFixed(1)}T
          </div>
        </div>
      </div>
      {balanceSheets.map((b) => {
        const current = b.current ?? 0
        const peak = b.peak ?? 1
        const pct = Math.round((current / peak) * 100)
        const reduction = pct < 100
        return (
          <div key={b.name} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold bg-foreground/10 text-foreground px-1 py-px rounded-sm">
                  {b.currency}
                </span>
                <span className="text-[11px] font-medium">{b.name}</span>
                {b.estimated && <span className="text-[9px] text-muted-foreground">(est)</span>}
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="tabular-nums font-bold">
                  {b.currency !== 'USD' ? b.currency + ' ' : '$'}{current}{b.unit}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  peak {b.currency !== 'USD' ? b.currency + ' ' : '$'}{peak}{b.unit}
                </span>
                {b.qtPace && <span className="text-[9px] text-muted-foreground">{b.qtPace}</span>}
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-foreground/10 w-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${reduction ? 'bg-sky-500' : 'bg-emerald-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>QT progress: {100 - pct}% drawn down</span>
              <span>{pct}% of peak</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
