import { useState, useCallback } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useMacroData } from '@/hooks/use-macro-data'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { fetchFredData } from '@/services/api/macro'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'

const YIELD_SERIES = {
  DGS2: '2Y',
  DGS5: '5Y',
  DGS10: '10Y',
  DGS30: '30Y',
}

const CURVE_SERIES = ['DGS1MO', 'DGS3MO', 'DGS6MO', 'DGS1', 'DGS2', 'DGS5', 'DGS10', 'DGS30']
const CURVE_LABELS: Record<string, string> = {
  DGS1MO: '1M', DGS3MO: '3M', DGS6MO: '6M', DGS1: '1Y',
  DGS2: '2Y', DGS5: '5Y', DGS10: '10Y', DGS30: '30Y',
}

const BOND_ETFS = ['TLT', 'IEF', 'SHY', 'HYG', 'LQD', 'AGG', 'BND', 'TIPS']
const ETF_NAMES: Record<string, string> = {
  TLT: '20+ Yr Treasury', IEF: '7-10 Yr Treasury', SHY: '1-3 Yr Treasury',
  HYG: 'High Yield', LQD: 'Inv Grade', AGG: 'US Agg',
  BND: 'Total Bond', TIPS: 'TIPS',
}

export default function FixedIncomePanel() {
  const [tab, setTab] = useState<'yields' | 'etfs' | 'spreads' | 'curve'>('yields')
  const { data, loading, error, refresh } = useMacroData()

  const { data: etfData, loading: etfLoading } = usePolling({
    fetcher: useCallback(() => fetchQuotes(BOND_ETFS), []),
    interval: 300_000,
    enabled: tab === 'etfs',
  })

  const { data: curveRaw } = usePolling({
    fetcher: useCallback(() => fetchFredData(CURVE_SERIES), []),
    interval: 300_000,
    enabled: tab === 'curve',
  })

  const yieldData = data?.filter((series) => series.seriesId in YIELD_SERIES)
  const sortedYields = yieldData?.sort(
    (a, b) => Object.keys(YIELD_SERIES).indexOf(a.seriesId) - Object.keys(YIELD_SERIES).indexOf(b.seriesId)
  )
  const chartData = sortedYields?.map((series) => ({
    maturity: YIELD_SERIES[series.seriesId as keyof typeof YIELD_SERIES],
    yield: series.value,
  }))

  const y2 = yieldData?.find((s) => s.seriesId === 'DGS2')?.value
  const y5 = yieldData?.find((s) => s.seriesId === 'DGS5')?.value
  const y10 = yieldData?.find((s) => s.seriesId === 'DGS10')?.value
  const y30 = yieldData?.find((s) => s.seriesId === 'DGS30')?.value

  const spreads = [
    y10 != null && y2 != null && { label: '10Y-2Y', value: y10 - y2, signal: y10 - y2 < 0 ? 'Inverted' : y10 - y2 < 0.5 ? 'Flat' : 'Normal' },
    y30 != null && y5 != null && { label: '30Y-5Y', value: y30 - y5, signal: y30 - y5 < 0 ? 'Inverted' : y30 - y5 < 0.5 ? 'Flat' : 'Normal' },
    y10 != null && y5 != null && { label: '10Y-5Y', value: y10 - y5, signal: y10 - y5 < 0 ? 'Inverted' : 'Normal' },
    y30 != null && y2 != null && { label: '30Y-2Y', value: y30 - y2, signal: y30 - y2 < 0 ? 'Inverted' : y30 - y2 < 0.5 ? 'Flat' : 'Normal' },
  ].filter(Boolean) as { label: string; value: number; signal: string }[]

  const curvePoints = CURVE_SERIES.map((id) => {
    const s = curveRaw?.find((r) => r.seriesId === id)
    return s ? { label: CURVE_LABELS[id], value: s.value } : null
  }).filter(Boolean) as { label: string; value: number }[]

  const curveY2 = curveRaw?.find((s) => s.seriesId === 'DGS2')?.value
  const curveY10 = curveRaw?.find((s) => s.seriesId === 'DGS10')?.value
  const spread210 = curveY2 != null && curveY10 != null ? curveY10 - curveY2 : null
  const isInverted = spread210 != null && spread210 < 0
  const curveColor = isInverted ? '#ef4444' : '#059669'

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Fixed Income" loading={loading && etfLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'yields')} onClick={() => setTab('yields')}>Yields</button>
        <button className={tabCls(tab === 'etfs')} onClick={() => setTab('etfs')}>ETFs</button>
        <button className={tabCls(tab === 'spreads')} onClick={() => setTab('spreads')}>Spreads</button>
        <button className={tabCls(tab === 'curve')} onClick={() => setTab('curve')}>Curve</button>
      </div>

      {tab === 'yields' && (
        <>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-medium pb-1.5">Maturity</th>
                <th className="text-right font-medium pb-1.5">Yield</th>
                <th className="text-right font-medium pb-1.5">Prev</th>
                <th className="text-right font-medium pb-1.5">Chg</th>
              </tr>
            </thead>
            <tbody>
              {sortedYields?.map((series) => {
                const label = YIELD_SERIES[series.seriesId as keyof typeof YIELD_SERIES]
                const isPos = series.change >= 0
                return (
                  <tr key={series.seriesId} className="border-t border-border/20">
                    <td className="py-0.5 font-medium">{label}</td>
                    <td className="text-right tabular-nums">{series.value.toFixed(2)}%</td>
                    <td className="text-right tabular-nums text-muted-foreground">{series.previous.toFixed(2)}%</td>
                    <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isPos ? '+' : ''}{series.change.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {chartData && chartData.length > 0 && (
            <div className="mt-2 border-t border-border/20 pt-2">
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Yield Curve</div>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="maturity" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Line type="monotone" dataKey="yield" stroke="hsl(var(--foreground))" strokeWidth={1.5} dot={{ r: 2.5, fill: 'hsl(var(--foreground))' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {tab === 'etfs' && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Name</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">Chg%</th>
            </tr>
          </thead>
          <tbody>
            {etfData?.map((p) => {
              const isPos = p.changePercent >= 0
              return (
                <tr key={p.symbol} className="border-t border-border/20">
                  <td className="py-0.5">
                    <span className="font-medium">{ETF_NAMES[p.symbol] || p.symbol}</span>
                    <span className="text-muted-foreground ml-1 text-[10px]">{p.symbol}</span>
                  </td>
                  <td className="text-right tabular-nums">${p.price.toFixed(2)}</td>
                  <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{p.changePercent.toFixed(2)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'spreads' && (
        <div className="space-y-1.5">
          {spreads.map((s) => {
            const isNeg = s.value < 0
            return (
              <div key={s.label} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
                <div>
                  <span className="text-[11px] font-medium">{s.label}</span>
                  <span className={`ml-2 text-[9px] font-medium uppercase tracking-wider ${
                    s.signal === 'Inverted' ? 'text-red-500' : s.signal === 'Flat' ? 'text-yellow-500' : 'text-emerald-600'
                  }`}>{s.signal}</span>
                </div>
                <span className={`text-[11px] tabular-nums font-medium ${isNeg ? 'text-red-500' : 'text-emerald-600'}`}>
                  {s.value > 0 ? '+' : ''}{(s.value * 100).toFixed(0)} bps
                </span>
              </div>
            )
          })}
          {spreads.length === 0 && (
            <p className="text-[10px] text-muted-foreground">Loading yield data...</p>
          )}
          <div className="mt-2 pt-2 border-t border-border/20">
            <p className="text-[9px] text-muted-foreground leading-relaxed">
              Inverted curves (negative spread) historically signal recession risk.
              The 10Y-2Y spread is the most widely watched recession indicator.
            </p>
          </div>
        </div>
      )}
      {tab === 'curve' && (
        <div>
          {curvePoints.length < 2 ? (
            <p className="text-[10px] text-muted-foreground">Yield data loading...</p>
          ) : (() => {
            const W = 320
            const H = 140
            const padL = 28
            const padR = 8
            const padT = 12
            const padB = 16
            const minY = Math.min(...curvePoints.map((p) => p.value))
            const maxY = Math.max(...curvePoints.map((p) => p.value))
            const rangeY = maxY - minY || 1
            const n = curvePoints.length
            const xOf = (i: number) => padL + (i / (n - 1)) * (W - padL - padR)
            const yOf = (v: number) => padT + (1 - (v - minY) / rangeY) * (H - padT - padB)
            const d = curvePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(p.value).toFixed(1)}`).join(' ')
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
                {[minY, (minY + maxY) / 2, maxY].map((tick) => (
                  <g key={tick}>
                    <line x1={padL} x2={W - padR} y1={yOf(tick)} y2={yOf(tick)} stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
                    <text x={padL - 3} y={yOf(tick) + 3} textAnchor="end" fontSize={7} fill="currentColor" fillOpacity={0.5}>{tick.toFixed(1)}</text>
                  </g>
                ))}
                <path d={d} fill="none" stroke={curveColor} strokeWidth={2} strokeLinejoin="round" />
                {curvePoints.map((p, i) => (
                  <g key={p.label}>
                    <circle cx={xOf(i)} cy={yOf(p.value)} r={3} fill={curveColor} />
                    <text x={xOf(i)} y={yOf(p.value) - 5} textAnchor="middle" fontSize={8} fill="currentColor" fillOpacity={0.7}>{p.value.toFixed(2)}</text>
                    <text x={xOf(i)} y={H - 3} textAnchor="middle" fontSize={7} fill="currentColor" fillOpacity={0.5}>{p.label}</text>
                  </g>
                ))}
              </svg>
            )
          })()}
          {spread210 != null && (
            <div className="mt-2 flex items-center gap-2 border-t border-border/20 pt-2">
              <span className="text-[11px] text-muted-foreground">2Y-10Y Spread:</span>
              <span className={`text-[11px] tabular-nums font-medium ${isInverted ? 'text-red-500' : 'text-emerald-600'}`}>
                {spread210 > 0 ? '+' : ''}{spread210.toFixed(2)}%
              </span>
              <span className={`ml-auto text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                isInverted ? 'bg-red-500/15 text-red-500' : 'bg-emerald-600/15 text-emerald-600'
              }`}>
                {isInverted ? 'Inverted' : 'Normal'}
              </span>
            </div>
          )}
        </div>
      )}
    </PanelWrapper>
  )
}
