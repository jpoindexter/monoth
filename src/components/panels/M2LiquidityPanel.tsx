import { useState, useCallback } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { tabCls, fmt } from '@/lib/panel-utils'

interface SeriesData {
  id: string
  name: string
  unit: string
  values: { date: string; value: number }[]
}

type Regime = 'EXPANSIONARY' | 'NEUTRAL' | 'CONTRACTIONARY'

function yoyChange(values: { date: string; value: number }[]): number | null {
  if (values.length < 2) return null
  const latest = values[values.length - 1].value
  const older = values[0].value
  if (older === 0) return null
  return ((latest - older) / older) * 100
}

function regime(yoy: number | null): Regime {
  if (yoy == null) return 'NEUTRAL'
  if (yoy > 5) return 'EXPANSIONARY'
  if (yoy < 0) return 'CONTRACTIONARY'
  return 'NEUTRAL'
}

function regimeColor(r: Regime): string {
  if (r === 'EXPANSIONARY') return 'text-emerald-400'
  if (r === 'CONTRACTIONARY') return 'text-red-400'
  return 'text-amber-400'
}

function MiniBars({ values, count = 12 }: { values: { date: string; value: number }[]; count?: number }) {
  const slice = values.slice(-count)
  if (!slice.length) return null
  const min = Math.min(...slice.map((v) => v.value))
  const max = Math.max(...slice.map((v) => v.value))
  const range = max - min || 1

  return (
    <div className="flex items-end gap-[2px] h-10">
      {slice.map((v, i) => {
        const pct = ((v.value - min) / range) * 100
        const h = Math.max(pct, 4)
        return (
          <div key={i} className="flex-1 flex flex-col justify-end" title={`${v.date}: ${fmt(v.value, 0)}`}>
            <div className="w-full rounded-[1px] bg-foreground/30" style={{ height: `${h}%` }} />
          </div>
        )
      })}
    </div>
  )
}

function M2Tab({ series }: { series: SeriesData[] }) {
  const m2 = series.find((s) => s.id === 'M2SL')
  if (!m2 || !m2.values.length) return <div className="text-[10px] text-muted-foreground">No data</div>

  const latest = m2.values[m2.values.length - 1]
  const yoy = yoyChange(m2.values)
  const reg = regime(yoy)
  const color = regimeColor(reg)

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-[18px] font-semibold tabular-nums">${fmt(latest.value / 1000, 1)}T</span>
        {yoy != null && (
          <span className={`text-[11px] tabular-nums ${yoy >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {yoy >= 0 ? '+' : ''}{fmt(yoy)}% YoY
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[9px] text-muted-foreground">{m2.name}</span>
        <span className={`text-[9px] font-semibold uppercase tracking-wider px-1 py-0.5 rounded-sm bg-muted/40 ${color}`}>
          {reg}
        </span>
      </div>

      <MiniBars values={m2.values} count={12} />

      <div className="flex justify-between text-[9px] text-muted-foreground/50">
        <span>{m2.values[Math.max(0, m2.values.length - 12)]?.date}</span>
        <span>{latest.date}</span>
      </div>
    </div>
  )
}

function LiquidityTab({ series }: { series: SeriesData[] }) {
  const fed = series.find((s) => s.id === 'H41RESPPALBNWW')
  const rrp = series.find((s) => s.id === 'RRPONTSYD')
  const res = series.find((s) => s.id === 'WRESBAL')

  const items = [
    { label: 'Fed Balance Sheet', data: fed, divisor: 1_000_000 },
    { label: 'Overnight RRP', data: rrp, divisor: 1 },
    { label: 'Reserve Balances', data: res, divisor: 1 },
  ]

  return (
    <div className="space-y-2">
      {items.map(({ label, data, divisor }) => {
        if (!data || !data.values.length) return null
        const latest = data.values[data.values.length - 1]
        const prev = data.values[data.values.length - 2]
        const chg = prev ? latest.value - prev.value : null
        const val = latest.value / divisor

        return (
          <div key={data.id} className="flex items-center justify-between py-0.5">
            <span className="text-[10px] text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tabular-nums font-medium">${fmt(val, 0)}B</span>
              {chg != null && (
                <span className={`text-[9px] tabular-nums ${chg < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {chg < 0 ? '' : '+'}{fmt(chg / divisor, 0)}B
                </span>
              )}
            </div>
          </div>
        )
      })}

      <div className="pt-1 border-t border-border/20">
        <p className="text-[9px] text-muted-foreground leading-relaxed">
          RRP draining = cash moving into markets, adding liquidity. Rising reserves = banks holding cash, reducing circulation.
        </p>
      </div>
    </div>
  )
}

function ContextTab({ series }: { series: SeriesData[] }) {
  const m2 = series.find((s) => s.id === 'M2SL')
  const yoy = m2 ? yoyChange(m2.values) : null
  const reg = regime(yoy)
  const color = regimeColor(reg)

  return (
    <div className="space-y-2 text-[10px] text-muted-foreground leading-relaxed">
      <div className="flex items-center gap-2">
        <span>Current M2 Regime:</span>
        <span className={`font-semibold uppercase tracking-wider ${color}`}>{reg}</span>
        {yoy != null && (
          <span className={`tabular-nums ${yoy >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ({yoy >= 0 ? '+' : ''}{fmt(yoy)}%)
          </span>
        )}
      </div>

      <p>M2 measures the total money supply including cash, checking deposits, and easily convertible near-money assets.</p>

      <div className="space-y-1">
        <p className="text-emerald-600 font-medium">Expansionary (&gt;5% YoY)</p>
        <p>More money chasing assets. Historically bullish for equities and risk assets. Can signal inflation pressure.</p>
      </div>

      <div className="space-y-1">
        <p className="text-amber-400 font-medium">Neutral (0-5% YoY)</p>
        <p>Money supply growing in line with the economy. Balanced conditions for markets.</p>
      </div>

      <div className="space-y-1">
        <p className="text-red-500 font-medium">Contractionary (&lt;0% YoY)</p>
        <p>Money supply shrinking. Historically associated with tighter credit, lower equity valuations, and increased recession risk.</p>
      </div>
    </div>
  )
}

export default function M2LiquidityPanel() {
  const [tab, setTab] = useState<'m2' | 'liquidity' | 'context'>('m2')

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/macro/m2')
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<SeriesData[]>
  }, [])

  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 3_600_000 })

  return (
    <PanelWrapper title="M2 & Liquidity" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'm2')} onClick={() => setTab('m2')}>M2</button>
        <button className={tabCls(tab === 'liquidity')} onClick={() => setTab('liquidity')}>Liquidity</button>
        <button className={tabCls(tab === 'context')} onClick={() => setTab('context')}>Context</button>
      </div>

      {tab === 'm2' && data && <M2Tab series={data} />}
      {tab === 'liquidity' && data && <LiquidityTab series={data} />}
      {tab === 'context' && data && <ContextTab series={data} />}
    </PanelWrapper>
  )
}
