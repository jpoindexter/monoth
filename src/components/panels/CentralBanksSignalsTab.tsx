import { useIsExpanded } from '@/components/layout/PanelWrapper'

interface MacroSignal {
  name: string
  value: number
  label: string
  status: 'bullish' | 'bearish' | 'neutral'
  detail: string
}

const STATUS_COLORS: Record<string, string> = {
  bullish: 'text-emerald-600',
  bearish: 'text-red-500',
  neutral: 'text-muted-foreground',
}

interface Props {
  signals: MacroSignal[] | undefined
  sigLoading: boolean
}

export function CentralBanksSignalsTab({ signals, sigLoading }: Props) {
  const expanded = useIsExpanded()

  return (
    <div className="space-y-1.5">
      {signals?.map((s) => (
        <div key={s.name} className={`flex items-center justify-between border-b border-border/20 last:border-0 ${expanded ? 'py-1.5' : 'py-0.5'}`}>
          <div>
            <span className={`font-medium ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>{s.name}</span>
            <span className={`text-muted-foreground ml-1.5 ${expanded ? 'text-[11px] block mt-0.5' : 'text-[10px]'}`}>{s.detail}</span>
          </div>
          <span className={`font-medium uppercase tracking-wider ${expanded ? 'text-[12px]' : 'text-[10px]'} ${STATUS_COLORS[s.status]}`}>
            {s.label}
          </span>
        </div>
      ))}
      {!signals?.length && !sigLoading && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">
          No data available. Refreshes automatically.
        </div>
      )}
    </div>
  )
}
