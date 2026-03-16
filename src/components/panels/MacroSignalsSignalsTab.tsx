import { useIsExpanded } from '@/components/layout/PanelWrapper'

interface MacroSignal {
  name: string
  value: number
  label: string
  status: 'bullish' | 'bearish' | 'neutral'
  detail: string
}

const STATUS_COLORS = {
  bullish: 'text-emerald-600',
  bearish: 'text-red-500',
  neutral: 'text-amber-500',
}

const STATUS_BG = {
  bullish: 'bg-emerald-500/10',
  bearish: 'bg-red-500/10',
  neutral: 'bg-amber-500/10',
}

function GaugeChart({ value, label }: { value: number; label: string }) {
  const angle = -90 + (value / 100) * 180
  const r = 40
  const cx = 50
  const cy = 50
  const color = value >= 60 ? '#059669' : value <= 40 ? '#ef4444' : '#eab308'

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="60" viewBox="0 0 100 60">
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="6" className="text-border/40" strokeLinecap="round" />
        <path d="M 10 50 A 40 40 0 0 1 30 14" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        <path d="M 30 14 A 40 40 0 0 1 50 10" fill="none" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        <path d="M 50 10 A 40 40 0 0 1 70 14" fill="none" stroke="#eab308" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        <path d="M 70 14 A 40 40 0 0 1 90 50" fill="none" stroke="#059669" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        <line
          x1={cx} y1={cy}
          x2={cx + r * 0.75 * Math.cos((angle * Math.PI) / 180)}
          y2={cy + r * 0.75 * Math.sin((angle * Math.PI) / 180)}
          stroke={color} strokeWidth="2" strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="3" fill={color} />
      </svg>
      <div className="text-center -mt-1">
        <span className="text-lg font-bold tabular-nums" style={{ color }}>{value}</span>
        <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

interface Props {
  signals: MacroSignal[] | undefined
}

export function MacroSignalsSignalsTab({ signals }: Props) {
  const expanded = useIsExpanded()

  const fearGreed = signals?.find((s) => s.name === 'Fear & Greed')
  const otherSignals = signals?.filter((s) => s.name !== 'Fear & Greed')
  const bullCount = signals?.filter((s) => s.status === 'bullish').length ?? 0
  const bearCount = signals?.filter((s) => s.status === 'bearish').length ?? 0
  const total = signals?.length ?? 0

  return (
    <>
      {fearGreed && (
        <div className={`flex items-center gap-3 mb-2 pb-2 border-b border-border/20 ${expanded ? 'justify-center' : ''}`}>
          <div style={{ width: expanded ? 140 : 100 }}>
            <GaugeChart value={fearGreed.value} label={fearGreed.label} />
          </div>
          <div className={`flex-1 ${expanded ? 'text-[12px]' : 'text-[10px]'}`}>
            <div className="text-muted-foreground mb-1">Market Sentiment</div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-emerald-600 font-medium">{bullCount} bullish</span>
              <span className="text-red-500 font-medium">{bearCount} bearish</span>
              <span className="text-muted-foreground">{total - bullCount - bearCount} neutral</span>
            </div>
            {expanded && (
              <div className="mt-1 text-[10px] text-muted-foreground">
                {fearGreed.value >= 60
                  ? 'Greed territory — risk appetite elevated.'
                  : fearGreed.value <= 40
                  ? 'Fear territory — defensive positioning dominant.'
                  : 'Neutral — no strong conviction.'}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1">
        {otherSignals?.map((signal) => (
          <div key={signal.name} className={`flex items-center justify-between px-1.5 rounded-sm ${STATUS_BG[signal.status]} ${expanded ? 'py-2' : 'py-1.5'}`}>
            <div className="min-w-0">
              <div className={`font-medium text-foreground ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>{signal.name}</div>
              <div className={`text-muted-foreground ${expanded ? 'text-[11px]' : 'text-[10px]'}`}>{signal.detail}</div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <div className={`font-bold uppercase tracking-wider ${expanded ? 'text-[13px]' : 'text-[11px]'} ${STATUS_COLORS[signal.status]}`}>
                {signal.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
