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
  const [tab, setTab] = useState<'indices' | 'movers' | 'charts'>('indices')
  const [chartData, setChartData] = useState<CandleData[]>([])
  const [chartSymbol, setChartSymbol] = useState('SPY')
  const { data, loading, error, refresh } = useMarketData()
  const { data: moversData, loading: moversLoading } = usePolling<MoversData>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/market/movers')
      if (!res.ok) throw new Error('Failed to fetch movers')
      return res.json()
    }, []),
    interval: 300_000,
    enabled: tab === 'movers',
  })

  useEffect(() => {
    if (tab === 'charts') {
      fetchCandles(chartSymbol).then(setChartData).catch(() => {})
    }
  }, [tab, chartSymbol])

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Live Markets" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'indices')} onClick={() => setTab('indices')}>Indices</button>
        <button className={tabCls(tab === 'movers')} onClick={() => setTab('movers')}>Movers</button>
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

      {tab !== 'charts' && <table className="w-full text-[11px]">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left font-medium pb-1.5">Symbol</th>
            <th className="text-right font-medium pb-1.5">Price</th>
            <th className="text-right font-medium pb-1.5">Chg%</th>
          </tr>
        </thead>
        <tbody>
          {tab === 'indices' &&
            data?.filter((p) => p.price != null).map((point) => {
              const isPositive = point.changePercent >= 0
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
                    {isPositive ? '+' : ''}{point.changePercent.toFixed(2)}%
                  </td>
                </tr>
              )
            })}
          {tab === 'movers' && moversLoading && (
            <tr><td colSpan={3} className="py-4 text-center text-muted-foreground text-[10px]">Loading...</td></tr>
          )}
          {tab === 'movers' &&
            moversData?.gainers?.slice(0, 5).map((m) => (
              <tr key={m.symbol} className="border-t border-border/20">
                <td className="py-1 font-medium">{m.symbol}</td>
                <td className="text-right tabular-nums font-medium">
                  {m.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="text-right tabular-nums font-medium text-emerald-600">
                  +{m.changePercent.toFixed(2)}%
                </td>
              </tr>
            ))}
        </tbody>
      </table>}
    </PanelWrapper>
  )
}
