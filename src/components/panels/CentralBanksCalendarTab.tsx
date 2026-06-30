import { ActionBadge } from './CentralBanksRatesTab'
import { type CbRate, daysUntil, direction } from './central-banks-utils'

interface Props {
  sortedByDate: CbRate[]
}

export function CentralBanksCalendarTab({ sortedByDate }: Props) {
  return (
    <div className="space-y-0">
      <p className="text-[9px] text-muted-foreground/60 mb-1.5">Reference · dates approximate</p>
      {sortedByDate.map((bank) => {
        const rate = bank.rate ?? 0
        const prev = bank.prev ?? rate
        const dir = direction(rate, prev)
        const days = daysUntil(bank.next ?? '')
        return (
          <div key={bank.name} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] tabular-nums font-medium text-muted-foreground w-12 shrink-0">{bank.next ?? '—'}</span>
              <span className="text-[11px] font-medium">{bank.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground tabular-nums">{days}d</span>
              <ActionBadge dir={dir} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
