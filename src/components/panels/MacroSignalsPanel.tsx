import { useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'

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
  neutral: 'text-yellow-500',
}

const STATUS_BG = {
  bullish: 'bg-emerald-500/10',
  bearish: 'bg-red-500/10',
  neutral: 'bg-yellow-500/10',
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
        {/* Background arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-border/40"
          strokeLinecap="round"
        />
        {/* Colored segments */}
        <path d="M 10 50 A 40 40 0 0 1 30 14" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        <path d="M 30 14 A 40 40 0 0 1 50 10" fill="none" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        <path d="M 50 10 A 40 40 0 0 1 70 14" fill="none" stroke="#eab308" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        <path d="M 70 14 A 40 40 0 0 1 90 50" fill="none" stroke="#059669" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + r * 0.75 * Math.cos((angle * Math.PI) / 180)}
          y2={cy + r * 0.75 * Math.sin((angle * Math.PI) / 180)}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="3" fill={color} />
      </svg>
      <div className="text-center -mt-1">
        <span className="text-lg font-bold tabular-nums" style={{ color }}>{value}</span>
        <span className="block text-[8px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

export default function MacroSignalsPanel() {
  const fetcher = useCallback(async () => {
    const res = await fetch('/api/macro/signals')
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<MacroSignal[]>
  }, [])

  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 600_000 })

  const fearGreed = data?.find((s) => s.name === 'Fear & Greed')
  const otherSignals = data?.filter((s) => s.name !== 'Fear & Greed')

  const bullCount = data?.filter((s) => s.status === 'bullish').length ?? 0
  const bearCount = data?.filter((s) => s.status === 'bearish').length ?? 0
  const total = data?.length ?? 0

  return (
    <PanelWrapper title="Macro Signals" loading={loading} error={error} onRetry={refresh}>
      {fearGreed && (
        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-border/20">
          <GaugeChart value={fearGreed.value} label={fearGreed.label} />
          <div className="flex-1 text-[10px]">
            <div className="text-muted-foreground mb-1">Market Regime</div>
            <div className="flex gap-2">
              <span className="text-emerald-600 font-medium">{bullCount} bullish</span>
              <span className="text-red-500 font-medium">{bearCount} bearish</span>
              <span className="text-muted-foreground">{total - bullCount - bearCount} neutral</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {otherSignals?.map((signal) => (
          <div key={signal.name} className={`flex items-center justify-between py-1.5 px-1.5 rounded-sm ${STATUS_BG[signal.status]}`}>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-foreground">{signal.name}</div>
              <div className="text-[9px] text-muted-foreground">{signal.detail}</div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <div className={`text-[11px] font-bold uppercase tracking-wider ${STATUS_COLORS[signal.status]}`}>
                {signal.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PanelWrapper>
  )
}
