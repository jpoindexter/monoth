import { useState } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useCorrelationEvents, useCorrelationMatrix } from '@/hooks/use-correlation-data'

interface CorrelationEvent {
  id: string
  indicator: string
  country: string
  actual: number
  expected: number
  previous: number
  surprise: number
  impact: 'high' | 'medium' | 'low'
  timestamp: number
  unit: string
}

interface CorrelationEntry {
  indicator: string
  symbol: string
  beatDirection: number
  missDirection: number
  confidence: number
}

const ASSETS = ['SPY', 'GLD', 'TLT', 'DXY', 'BTC']

function directionColor(value: number): string {
  if (value === 0) return 'bg-muted text-muted-foreground'
  const intensity = Math.min(Math.abs(value), 1)
  const alpha = Math.round(intensity * 100)
  if (value > 0) {
    if (alpha >= 70) return 'bg-emerald-600 text-white'
    if (alpha >= 40) return 'bg-emerald-500/60 text-white'
    return 'bg-emerald-500/30 text-emerald-900'
  }
  if (alpha >= 70) return 'bg-red-600 text-white'
  if (alpha >= 40) return 'bg-red-500/60 text-white'
  return 'bg-red-500/30 text-red-900'
}

export default function CorrelationPanel() {
  const [tab, setTab] = useState<'matrix' | 'events'>('matrix')
  const events = useCorrelationEvents()
  const matrix = useCorrelationMatrix()

  const loading = events.loading && matrix.loading
  const error = events.error ?? matrix.error

  const eventList: CorrelationEvent[] = events.data ?? []
  const matrixList: CorrelationEntry[] = matrix.data ?? []

  const indicators = [...new Set(matrixList.map((e) => e.indicator))]
  const lookup = new Map<string, number>()
  for (const entry of matrixList) {
    lookup.set(`${entry.indicator}:${entry.symbol}`, entry.beatDirection)
  }

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Correlation Engine" loading={loading} error={error} onRetry={() => { events.refresh(); matrix.refresh() }}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'matrix')} onClick={() => setTab('matrix')}>Matrix</button>
        <button className={tabCls(tab === 'events')} onClick={() => setTab('events')}>Events</button>
      </div>

      {tab === 'matrix' && (
        <div className="min-w-0">
          <div className="grid gap-px text-[10px]" style={{ gridTemplateColumns: `minmax(60px, 1fr) repeat(${ASSETS.length}, 44px)` }}>
            <div className="text-muted-foreground font-medium uppercase tracking-wider pb-1">Indicator</div>
            {ASSETS.map((a) => (
              <div key={a} className="text-center text-muted-foreground font-medium uppercase tracking-wider pb-1">{a}</div>
            ))}
            {indicators.map((indicator) => (
              <>
                <div key={`l-${indicator}`} className="text-[11px] font-medium py-0.5 truncate">{indicator}</div>
                {ASSETS.map((asset) => {
                  const val = lookup.get(`${indicator}:${asset}`)
                  return (
                    <div key={`${indicator}:${asset}`} className={`flex items-center justify-center rounded-sm py-0.5 text-[10px] font-semibold tabular-nums ${val != null ? directionColor(val) : 'text-muted-foreground'}`}>
                      {val != null ? `${val > 0 ? '+' : ''}${val.toFixed(1)}` : '—'}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-emerald-600" /> positive</span>
            <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-red-600" /> negative</span>
          </div>
        </div>
      )}

      {tab === 'events' && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Indicator</th>
              <th className="text-right font-medium pb-1.5">Actual</th>
              <th className="text-right font-medium pb-1.5">Exp</th>
              <th className="text-right font-medium pb-1.5">Surprise</th>
            </tr>
          </thead>
          <tbody>
            {eventList.length === 0 && !events.loading && (
              <tr><td colSpan={4} className="py-4 text-center text-muted-foreground text-[10px]">No events found</td></tr>
            )}
            {eventList.map((event) => {
              const beat = event.surprise > 0
              return (
                <tr key={event.id} className="border-t border-border/20">
                  <td className="py-0.5">
                    <div className="font-medium text-foreground">{event.indicator}</div>
                    <div className="text-[9px] text-muted-foreground">{event.country}</div>
                  </td>
                  <td className="text-right tabular-nums">{event.actual.toFixed(2)}</td>
                  <td className="text-right tabular-nums text-muted-foreground">{event.expected.toFixed(2)}</td>
                  <td className={`text-right tabular-nums font-medium ${beat ? 'text-emerald-600' : 'text-red-500'}`}>
                    {beat ? '+' : ''}{event.surprise.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </PanelWrapper>
  )
}
