import { useIsExpanded } from '@/components/layout/PanelWrapper'
import { daysUntil, direction } from '@/components/panels/central-banks-utils'
import type { CbRate } from '@/components/panels/central-banks-utils'

const CURRENCY_BADGE: Record<string, string> = {
  USD: 'US', EUR: 'EU', GBP: 'UK', JPY: 'JP', CNY: 'CN', AUD: 'AU', CAD: 'CA', CHF: 'CH',
}

export function Arrow({ dir }: { dir: 'cut' | 'hold' | 'hike' }) {
  if (dir === 'cut') return <span className="text-emerald-500">↓</span>
  if (dir === 'hike') return <span className="text-red-500">↑</span>
  return <span className="text-muted-foreground">→</span>
}

export function ActionBadge({ dir }: { dir: 'cut' | 'hold' | 'hike' }) {
  const cls =
    dir === 'cut'
      ? 'bg-emerald-500/20 text-emerald-600'
      : dir === 'hike'
      ? 'bg-red-500/20 text-red-500'
      : 'bg-muted text-muted-foreground'
  return (
    <span className={`text-[9px] font-bold uppercase px-1 py-px rounded-sm ${cls}`}>
      {dir}
    </span>
  )
}

interface Props {
  centralBanks: CbRate[]
  maxRate: number
}

export function CentralBanksRatesTab({ centralBanks, maxRate }: Props) {
  const expanded = useIsExpanded()

  return (
    <div className="space-y-2">
      <p className="text-[9px] text-muted-foreground/60 mb-1">Reference · rates may lag official announcements</p>
      {centralBanks.map((bank) => {
        const rate = bank.rate ?? 0
        const prev = bank.prev ?? rate
        const dir = direction(rate, prev)
        const barPct = (rate / maxRate) * 100
        const days = daysUntil(bank.next ?? '')
        const changeBps = Math.round((rate - prev) * 100)
        return (
          <div key={bank.name} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold bg-foreground/10 text-foreground px-1 py-px rounded-sm tabular-nums">
                  {CURRENCY_BADGE[bank.currency]}
                </span>
                <span className={`font-medium ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>{bank.name}</span>
                {expanded && <ActionBadge dir={dir} />}
              </div>
              <div className="flex items-center gap-1">
                <span className={`tabular-nums font-bold ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>{rate.toFixed(2)}%</span>
                <Arrow dir={dir} />
                {expanded ? (
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground tabular-nums">{bank.next ?? '—'} ({days}d)</div>
                    <div className={`text-[10px] tabular-nums font-medium ${dir === 'cut' ? 'text-emerald-500' : dir === 'hike' ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {dir !== 'hold' ? `${changeBps > 0 ? '+' : ''}${changeBps}bps from ${prev.toFixed(2)}%` : `Held at ${prev.toFixed(2)}%`}
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground tabular-nums">{bank.next ?? '—'} ({days}d)</span>
                )}
              </div>
            </div>
            <div className={`rounded-full bg-foreground/10 w-full overflow-hidden ${expanded ? 'h-3' : 'h-2'}`}>
              <div
                className={`h-full rounded-full transition-all ${dir === 'cut' ? 'bg-emerald-500' : dir === 'hike' ? 'bg-red-500' : 'bg-foreground/40'}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
