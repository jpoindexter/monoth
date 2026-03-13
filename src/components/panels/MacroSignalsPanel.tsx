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

export default function MacroSignalsPanel() {
  const fetcher = useCallback(async () => {
    const res = await fetch('/api/macro/signals')
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<MacroSignal[]>
  }, [])

  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 600_000 })

  return (
    <PanelWrapper title="Macro Signals" loading={loading} error={error} onRetry={refresh}>
      <div className="space-y-1">
        {data?.map((signal) => (
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
