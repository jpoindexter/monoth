import { useState, useCallback, useEffect } from 'react'
import { useMarketData } from '@/hooks/use-market-data'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { fetchCandles, type CandleData } from '@/services/api/candles'

interface Mover {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
}

interface MoversData {
  gainers: Mover[]
  losers: Mover[]
  active: Mover[]
}

export default function LiveMarketsPanel() {
  const [tab, setTab] = useState<'indices' | 'gainers' | 'losers' | 'active' | 'charts'>('indices')
  const [chartData, setChartData] = useState<CandleData[]>([])
  const [chartSymbol, setChartSymbol] = useState('SPY')
  const { data, loading, error, refresh } = useMarketData()
  const isMoversTab = tab === 'gainers' || tab === 'losers' || tab === 'active'
  const { data: moversData, loading: moversLoading } = usePolling<MoversData>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/market/movers')
      if (!res.ok) throw new Error('Failed to fetch movers')
      return res.json()
    }, []),
    interval: 300_000,
    enabled: isMoversTab,
  })

  useEffect(() => {
    if (tab === 'charts') {
      fetchCandles(chartSymbol).then(setChartData).catch(() => {})
    }
  }, [tab, chartSymbol])

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const moversList = tab === 'gainers' ? moversData?.gainers
    : tab === 'losers' ? moversData?.losers
    : tab === 'active' ? moversData?.active
    : null

  return (
    <PanelWrapper title="Live Markets" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'indices')} onClick={() => setTab('indices')}>Indices</button>
        <button className={tabCls(tab === 'gainers')} onClick={() => setTab('gainers')}>Gainers</button>
        <button className={tabCls(tab === 'losers')} onClick={() => setTab('losers')}>Losers</button>
        <button className={tabCls(tab === 'active')} onClick={() => setTab('active')}>Active</button>
        <button className={tabCls(tab === 'charts')} onClick={() => setTab('charts')}>Charts</button>
      </div>

      {tab === 'charts' && (
        <div>
          <div className="flex gap-1 mb-1">
            {['SPY', 'QQQ', 'DIA', 'IWM'].map((sym) => (
              <button
                key={sym}
                className={`text-[8px] px-1 rounded-sm ${chartSymbol === sym ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
                onClick={() => setChartSymbol(sym)}
              >
                {sym}
              </button>
            ))}
          </div>
          <LightweightChart type="area" data={chartData} height={140} />
        </div>
      )}

      {tab === 'indices' && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Symbol</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">Chg%</th>
            </tr>
          </thead>
          <tbody>
            {data?.filter((p) => p.price != null && p.price > 0).map((point) => {
              const isPositive = (point.changePercent ?? 0) >= 0
              return (
                <tr key={point.symbol} className="border-t border-border/20">
                  <td className="py-1">
                    <div className="font-medium text-foreground">{point.name || point.symbol}</div>
                    <div className="text-[10px] text-muted-foreground">{point.symbol}</div>
                  </td>
                  <td className="text-right tabular-nums font-medium">
                    {point.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`text-right tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{(point.changePercent ?? 0).toFixed(2)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {isMoversTab && moversLoading && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
      )}

      {isMoversTab && moversList && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Symbol</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">Chg%</th>
              <th className="text-right font-medium pb-1.5">Vol</th>
            </tr>
          </thead>
          <tbody>
            {moversList.slice(0, 10).map((m) => {
              const isPos = m.changePercent >= 0
              return (
                <tr key={m.symbol} className="border-t border-border/20">
                  <td className="py-0.5 font-medium">{m.symbol}</td>
                  <td className="text-right tabular-nums">
                    ${m.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{m.changePercent.toFixed(2)}%
                  </td>
                  <td className="text-right tabular-nums text-muted-foreground text-[10px]">
                    {m.volume >= 1e6 ? (m.volume / 1e6).toFixed(1) + 'M' : (m.volume / 1e3).toFixed(0) + 'K'}
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
