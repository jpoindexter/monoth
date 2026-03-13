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

const STATIC_CORRELATIONS: Record<string, Record<string, number>> = {
  'SPY': { SPY: 1.0, GLD: -0.15, TLT: -0.35, DXY: -0.20, BTC: 0.45 },
  'GLD': { SPY: -0.15, GLD: 1.0, TLT: 0.25, DXY: -0.55, BTC: 0.10 },
  'TLT': { SPY: -0.35, TLT: 1.0, GLD: 0.25, DXY: -0.10, BTC: -0.15 },
  'DXY': { SPY: -0.20, GLD: -0.55, TLT: -0.10, DXY: 1.0, BTC: -0.30 },
  'BTC': { SPY: 0.45, GLD: 0.10, TLT: -0.15, DXY: -0.30, BTC: 1.0 },
}

function correlationColor(val: number): string {
  if (val > 0.6) return 'bg-emerald-600 text-white'
  if (val > 0.3) return 'bg-emerald-400/60 text-foreground'
  if (val > 0.1) return 'bg-emerald-200/40 text-foreground'
  if (val > -0.1) return 'bg-muted text-muted-foreground'
  if (val > -0.3) return 'bg-red-200/40 text-foreground'
  if (val > -0.6) return 'bg-red-400/60 text-foreground'
  return 'bg-red-600 text-white'
}

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
  const [tab, setTab] = useState<'matrix' | 'cross' | 'events'>('matrix')
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
        <button className={tabCls(tab === 'cross')} onClick={() => setTab('cross')}>Cross-Asset</button>
        <button className={tabCls(tab === 'events')} onClick={() => setTab('events')}>Events</button>
      </div>

      {tab === 'matrix' && (
        <div className="min-w-0">
          {matrixList.length === 0 ? (
            <div className="overflow-x-auto">
              <div className="grid gap-px" style={{ gridTemplateColumns: `minmax(60px, 1fr) repeat(${ASSETS.length}, 44px)` }}>
                <div className="text-[10px] font-medium uppercase text-muted-foreground pb-1">Indicator</div>
                {ASSETS.map((a) => (
                  <div key={a} className="text-center text-[10px] font-medium uppercase text-muted-foreground pb-1">{a}</div>
                ))}
                {ASSETS.map((row) => (
                  <>
                    <div key={`l-${row}`} className="text-[10px] font-medium uppercase py-0.5 truncate">{row}</div>
                    {ASSETS.map((col) => {
                      const val = STATIC_CORRELATIONS[row]?.[col] ?? 0
                      const isDiag = row === col
                      return (
                        <div
                          key={`${row}:${col}`}
                          className={`w-11 h-8 flex items-center justify-center text-[9px] font-semibold tabular-nums rounded-sm ${correlationColor(val)} ${isDiag ? 'ring-1 ring-foreground/20' : ''}`}
                        >
                          {val.toFixed(2)}
                        </div>
                      )
                    })}
                  </>
                ))}
              </div>
              <div className="mt-2 text-[9px] text-muted-foreground">Static fallback — live data unavailable</div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {tab === 'cross' && (
        <div className="overflow-x-auto">
          <div className="grid gap-px" style={{ gridTemplateColumns: `minmax(36px, auto) repeat(${ASSETS.length}, 44px)` }}>
            <div className="pb-1" />
            {ASSETS.map((a) => (
              <div key={a} className="text-center text-[10px] font-medium uppercase text-muted-foreground pb-1">{a}</div>
            ))}
            {ASSETS.map((row) => (
              <>
                <div key={`l-${row}`} className="text-[10px] font-medium uppercase flex items-center pr-1 text-muted-foreground">{row}</div>
                {ASSETS.map((col) => {
                  const val = STATIC_CORRELATIONS[row]?.[col] ?? 0
                  const isDiag = row === col
                  return (
                    <div
                      key={`${row}:${col}`}
                      className={`w-11 h-8 flex items-center justify-center text-[9px] font-semibold tabular-nums rounded-sm ${correlationColor(val)} ${isDiag ? 'ring-1 ring-foreground/20' : ''}`}
                    >
                      {val.toFixed(2)}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-emerald-600" /> strong +</span>
            <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-muted border border-border" /> neutral</span>
            <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-red-600" /> strong -</span>
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
