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

// Seeded rolling correlation history — stable across renders
const ROLLING_HISTORY: { pair: string; w1: number; m1: number; m3: number; m6: number }[] = [
  { pair: 'SPY-TLT', w1: -0.42, m1: -0.38, m3: -0.35, m6: -0.28 },
  { pair: 'SPY-GLD', w1: -0.08, m1: -0.12, m3: -0.15, m6: -0.22 },
  { pair: 'BTC-SPY', w1: 0.51, m1: 0.47, m3: 0.45, m6: 0.38 },
  { pair: 'DXY-GLD', w1: -0.58, m1: -0.54, m3: -0.55, m6: -0.51 },
]

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

// Green for negative correlation (good diversification), red for positive (no diversification)
function rollingCellCls(val: number): string {
  if (val <= -0.5) return 'bg-emerald-600 text-white'
  if (val <= -0.2) return 'bg-emerald-400/60 text-foreground'
  if (val < 0.2) return 'bg-muted text-muted-foreground'
  if (val < 0.5) return 'bg-red-400/60 text-foreground'
  return 'bg-red-600 text-white'
}

function computeRegime() {
  const pairs: { a: string; b: string; val: number }[] = []
  let sum = 0
  let count = 0

  for (const row of ASSETS) {
    for (const col of ASSETS) {
      if (row >= col) continue // upper triangle, skip diagonal
      const val = STATIC_CORRELATIONS[row]?.[col] ?? 0
      pairs.push({ a: row, b: col, val })
      sum += Math.abs(val)
      count++
    }
  }

  const avg = count > 0 ? sum / count : 0
  const sorted = [...pairs].sort((x, y) => y.val - x.val)
  const highest = sorted[0]
  const lowest = sorted[sorted.length - 1]

  let regime: 'RISK-ON' | 'RISK-OFF' | 'TRANSITIONAL'
  if (avg < 0.4) regime = 'RISK-ON'
  else if (avg > 0.6) regime = 'RISK-OFF'
  else regime = 'TRANSITIONAL'

  const divScore = Math.round((1 - avg) * 100)

  return { avg, regime, highest, lowest, divScore }
}

export default function CorrelationPanel() {
  const [tab, setTab] = useState<'matrix' | 'cross' | 'events' | 'regime' | 'history'>('matrix')
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

  const regime = computeRegime()

  const regimeBadgeCls =
    regime.regime === 'RISK-ON'
      ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30'
      : regime.regime === 'RISK-OFF'
      ? 'bg-red-600/20 text-red-400 border border-red-500/30'
      : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'

  return (
    <PanelWrapper title="Correlation Engine" loading={loading} error={error} onRetry={() => { events.refresh(); matrix.refresh() }}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'matrix')} onClick={() => setTab('matrix')}>Matrix</button>
        <button className={tabCls(tab === 'cross')} onClick={() => setTab('cross')}>Cross-Asset</button>
        <button className={tabCls(tab === 'events')} onClick={() => setTab('events')}>Events</button>
        <button className={tabCls(tab === 'regime')} onClick={() => setTab('regime')}>Regime</button>
        <button className={tabCls(tab === 'history')} onClick={() => setTab('history')}>History</button>
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

      {tab === 'regime' && (
        <div className="space-y-3">
          {/* Regime badge */}
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold tracking-widest px-2 py-0.5 rounded-sm ${regimeBadgeCls}`}>
              {regime.regime}
            </span>
            <span className="text-[10px] text-muted-foreground">avg |corr| = <span className="text-foreground font-semibold tabular-nums">{regime.avg.toFixed(3)}</span></span>
          </div>

          {/* Avg correlation bar */}
          <div>
            <div className="flex justify-between text-[9px] text-muted-foreground mb-0.5">
              <span>0.0 — independent</span>
              <span>1.0 — panic</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${regime.avg < 0.4 ? 'bg-emerald-500' : regime.avg > 0.6 ? 'bg-red-500' : 'bg-amber-400'}`}
                style={{ width: `${regime.avg * 100}%` }}
              />
            </div>
          </div>

          {/* Extremes */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-sm bg-muted/40 p-1.5">
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Highest pair</div>
              <div className="text-[11px] font-semibold">{regime.highest.a} / {regime.highest.b}</div>
              <div className={`text-[10px] font-bold tabular-nums ${regime.highest.val >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {regime.highest.val >= 0 ? '+' : ''}{regime.highest.val.toFixed(2)}
              </div>
            </div>
            <div className="rounded-sm bg-muted/40 p-1.5">
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Lowest pair</div>
              <div className="text-[11px] font-semibold">{regime.lowest.a} / {regime.lowest.b}</div>
              <div className={`text-[10px] font-bold tabular-nums ${regime.lowest.val >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {regime.lowest.val >= 0 ? '+' : ''}{regime.lowest.val.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Diversification score */}
          <div className="rounded-sm bg-muted/40 p-1.5">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Diversification Score</div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold tabular-nums leading-none">{regime.divScore}</span>
              <span className="text-[9px] text-muted-foreground mb-0.5">/ 100 — higher = better</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${regime.divScore >= 70 ? 'bg-emerald-500' : regime.divScore >= 40 ? 'bg-amber-400' : 'bg-red-500'}`}
                style={{ width: `${regime.divScore}%` }}
              />
            </div>
          </div>

          <div className="text-[9px] text-muted-foreground">Based on cross-asset static matrix — 10 unique pairs</div>
        </div>
      )}

      {tab === 'history' && (
        <div>
          <div className="grid text-[9px] text-muted-foreground font-medium uppercase tracking-wider mb-1"
            style={{ gridTemplateColumns: 'minmax(64px,1fr) repeat(4, 40px)' }}>
            <div>Pair</div>
            <div className="text-center">1W</div>
            <div className="text-center">1M</div>
            <div className="text-center">3M</div>
            <div className="text-center">6M</div>
          </div>
          <div className="space-y-px">
            {ROLLING_HISTORY.map((row) => (
              <div key={row.pair} className="grid items-center gap-px" style={{ gridTemplateColumns: 'minmax(64px,1fr) repeat(4, 40px)' }}>
                <div className="text-[10px] font-semibold">{row.pair}</div>
                {([row.w1, row.m1, row.m3, row.m6] as number[]).map((val, i) => (
                  <div key={i} className={`text-center text-[9px] font-semibold tabular-nums rounded-sm py-1 ${rollingCellCls(val)}`}>
                    {val >= 0 ? '+' : ''}{val.toFixed(2)}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-emerald-600" /> negative (diversifies)</span>
            <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-red-600" /> positive (no hedge)</span>
          </div>
        </div>
      )}
    </PanelWrapper>
  )
}
