import { useState, useCallback } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useMacroData } from '@/hooks/use-macro-data'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'

const YIELD_SERIES = {
  DGS2: '2Y',
  DGS5: '5Y',
  DGS10: '10Y',
  DGS30: '30Y',
}

const BOND_ETFS = ['TLT', 'IEF', 'SHY', 'HYG', 'LQD', 'AGG', 'BND', 'TIPS']
const ETF_NAMES: Record<string, string> = {
  TLT: '20+ Yr Treasury', IEF: '7-10 Yr Treasury', SHY: '1-3 Yr Treasury',
  HYG: 'High Yield', LQD: 'Inv Grade', AGG: 'US Agg',
  BND: 'Total Bond', TIPS: 'TIPS',
}

export default function FixedIncomePanel() {
  const [tab, setTab] = useState<'yields' | 'etfs' | 'spreads'>('yields')
  const { data, loading, error, refresh } = useMacroData()

  const { data: etfData, loading: etfLoading } = usePolling({
    fetcher: useCallback(() => fetchQuotes(BOND_ETFS), []),
    interval: 300_000,
    enabled: tab === 'etfs',
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

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Fixed Income" loading={loading && etfLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'yields')} onClick={() => setTab('yields')}>Yields</button>
        <button className={tabCls(tab === 'etfs')} onClick={() => setTab('etfs')}>ETFs</button>
        <button className={tabCls(tab === 'spreads')} onClick={() => setTab('spreads')}>Spreads</button>
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
    </PanelWrapper>
  )
}
