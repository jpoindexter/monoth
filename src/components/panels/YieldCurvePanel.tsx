import { useState, useCallback } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { tabCls, fmt } from '@/lib/panel-utils'

interface TenorRate {
  tenor: string
  rate: number | null
}

interface SpreadPoint {
  date: string
  value: number
}

interface YieldCurveData {
  rates: TenorRate[]
  spreadHistory: SpreadPoint[]
}

function curveShape(rates: TenorRate[]): 'NORMAL' | 'INVERTED' | 'FLAT' {
  const get = (tenor: string) => rates.find((r) => r.tenor === tenor)?.rate ?? null
  const y2 = get('2Y')
  const y10 = get('10Y')
  if (y2 == null || y10 == null) return 'FLAT'
  const spread = y10 - y2
  if (spread > 0.1) return 'NORMAL'
  if (spread < -0.1) return 'INVERTED'
  return 'FLAT'
}

function CurveTab({ rates }: { rates: TenorRate[] }) {
  const valid = rates.filter((r) => r.rate != null) as { tenor: string; rate: number }[]
  const shape = curveShape(rates)
  const y2 = rates.find((r) => r.tenor === '2Y')?.rate ?? null
  const y10 = rates.find((r) => r.tenor === '10Y')?.rate ?? null
  const spread = y2 != null && y10 != null ? y10 - y2 : null

  const shapeColor =
    shape === 'NORMAL' ? 'text-emerald-400' : shape === 'INVERTED' ? 'text-red-400' : 'text-amber-400'

  const minRate = Math.min(...valid.map((r) => r.rate))
  const maxRate = Math.max(...valid.map((r) => r.rate))
  const range = maxRate - minRate || 0.01

  const svgW = 260
  const svgH = 80
  const pad = { l: 8, r: 8, t: 8, b: 8 }
  const innerW = svgW - pad.l - pad.r
  const innerH = svgH - pad.t - pad.b

  const points = valid.map((r, i) => {
    const x = pad.l + (i / (valid.length - 1 || 1)) * innerW
    const y = pad.t + (1 - (r.rate - minRate) / range) * innerH
    return { x, y, tenor: r.tenor, rate: r.rate }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-muted/40 ${shapeColor}`}>
          {shape}
        </span>
        {spread != null && (
          <span className={`text-[10px] tabular-nums ${spread >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            2-10Y: {spread >= 0 ? '+' : ''}{fmt(spread)}%
          </span>
        )}
      </div>

      <svg width={svgW} height={svgH} className="w-full overflow-visible">
        <path d={pathD} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground/60" />
        {points.map((p) => (
          <circle key={p.tenor} cx={p.x} cy={p.y} r="2" className="fill-foreground/70" />
        ))}
      </svg>

      <div className="grid grid-cols-5 gap-x-1 gap-y-0.5">
        {rates.map((r) => (
          <div key={r.tenor} className="flex flex-col items-center">
            <span className="text-[9px] text-muted-foreground">{r.tenor}</span>
            <span className="text-[10px] tabular-nums font-medium">
              {r.rate != null ? fmt(r.rate) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HistoryTab({ spreadHistory }: { spreadHistory: SpreadPoint[] }) {
  if (!spreadHistory.length) {
    return <div className="text-[10px] text-muted-foreground">No data</div>
  }

  const latest = spreadHistory[spreadHistory.length - 1]!
  const maxAbs = Math.max(...spreadHistory.map((p) => Math.abs(p.value)), 0.01)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">2Y-10Y Spread (T10Y2Y)</span>
        <span className={`text-[10px] tabular-nums font-semibold ${latest.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {latest.value >= 0 ? '+' : ''}{fmt(latest.value)}%
        </span>
      </div>

      <div className="flex items-end gap-[2px] h-16">
        {spreadHistory.map((p, i) => {
          const pct = Math.abs(p.value) / maxAbs
          const h = Math.max(pct * 100, 2)
          const isPos = p.value >= 0
          return (
            <div key={i} className="flex-1 flex flex-col justify-end" title={`${p.date}: ${fmt(p.value)}%`}>
              <div
                className={`w-full rounded-[1px] ${isPos ? 'bg-emerald-500/50' : 'bg-red-500/50'}`}
                style={{ height: `${h}%` }}
              />
            </div>
          )
        })}
      </div>

      <div className="flex justify-between text-[9px] text-muted-foreground/60">
        <span>{spreadHistory[0]?.date}</span>
        <span>{latest.date}</span>
      </div>
    </div>
  )
}

export default function YieldCurvePanel() {
  const [tab, setTab] = useState<'curve' | 'history'>('curve')

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/macro/yield-curve')
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<YieldCurveData>
  }, [])

  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 3_600_000 })

  return (
    <PanelWrapper title="Yield Curve" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'curve')} onClick={() => setTab('curve')}>Curve</button>
        <button className={tabCls(tab === 'history')} onClick={() => setTab('history')}>History</button>
      </div>

      {tab === 'curve' && data && <CurveTab rates={data.rates} />}
      {tab === 'history' && data && <HistoryTab spreadHistory={data.spreadHistory} />}
    </PanelWrapper>
  )
}
