import { useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'

interface Prediction {
  id: string
  title: string
  yesPct: number
  noPct: number
  volume: number
  endDate: string
}

function fmtVol(n: number): string {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K'
  return '$' + n.toFixed(0)
}

export default function PredictionsPanel() {
  const fetcher = useCallback(async () => {
    const res = await fetch('/api/predictions/polymarket')
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<Prediction[]>
  }, [])

  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 300_000 })

  return (
    <PanelWrapper title="Prediction Markets" loading={loading} error={error} onRetry={refresh}>
      <div className="space-y-0">
        {data?.map((p) => (
          <div key={p.id} className="py-1.5 border-b border-border/20 last:border-0">
            <div className="text-[11px] font-medium text-foreground leading-snug line-clamp-2 mb-1">
              {p.title}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-3 rounded-sm overflow-hidden bg-zinc-200 flex">
                <div
                  className="h-full bg-emerald-500 flex items-center justify-center"
                  style={{ width: `${p.yesPct}%` }}
                >
                  {p.yesPct >= 20 && (
                    <span className="text-[7px] font-bold text-white">Yes {p.yesPct}%</span>
                  )}
                </div>
                <div
                  className="h-full bg-red-400 flex items-center justify-center"
                  style={{ width: `${p.noPct}%` }}
                >
                  {p.noPct >= 20 && (
                    <span className="text-[7px] font-bold text-white">No {p.noPct}%</span>
                  )}
                </div>
              </div>
              <span className="text-[9px] text-muted-foreground shrink-0">{fmtVol(p.volume)}</span>
            </div>
          </div>
        ))}
      </div>
    </PanelWrapper>
  )
}
