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

type Tab = 'indices' | 'gainers' | 'losers' | 'active' | 'charts' | 'breadth' | 'futures'

interface FuturesContract {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

const FUTURES_DATA: FuturesContract[] = [
  { symbol: 'ES', name: 'S&P 500', price: 5312.25, change: 12.50, changePercent: 0.24 },
  { symbol: 'NQ', name: 'Nasdaq 100', price: 18742.50, change: 68.75, changePercent: 0.37 },
  { symbol: 'YM', name: 'Dow Jones', price: 39284.00, change: -42.00, changePercent: -0.11 },
  { symbol: 'RTY', name: 'Russell 2000', price: 2081.40, change: -8.20, changePercent: -0.39 },
  { symbol: 'CL', name: 'Crude Oil', price: 78.42, change: -0.58, changePercent: -0.73 },
  { symbol: 'GC', name: 'Gold', price: 2341.80, change: 6.30, changePercent: 0.27 },
  { symbol: 'ZB', name: '30Y Bond', price: 119.14, change: 0.22, changePercent: 0.18 },
]

function BreadthTab({ moversData, moversLoading }: { moversData: MoversData | null; moversLoading: boolean }) {
  if (moversLoading) {
    return <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
  }

  const gainers = moversData?.gainers ?? []
  const losers = moversData?.losers ?? []

  const advancers = gainers.length
  const decliners = losers.length
  const total = advancers + decliners || 1

  const advPct = (advancers / total) * 100
  const decPct = (decliners / total) * 100
  const adRatio = decliners === 0 ? advancers : advancers / decliners

  const newHighs = gainers.filter((m) => m.changePercent > 3).length
  const newLows = losers.filter((m) => m.changePercent < -3).length

  let thrust: string
  let thrustColor: string
  if (adRatio > 2) {
    thrust = 'STRONG THRUST'
    thrustColor = 'bg-emerald-600 text-white'
  } else if (adRatio > 1.5) {
    thrust = 'BULLISH'
    thrustColor = 'bg-emerald-500/20 text-emerald-500'
  } else if (adRatio < 0.5) {
    thrust = 'OVERSOLD'
    thrustColor = 'bg-red-600 text-white'
  } else if (adRatio < 0.67) {
    thrust = 'BEARISH'
    thrustColor = 'bg-red-500/20 text-red-500'
  } else {
    thrust = 'NEUTRAL'
    thrustColor = 'bg-muted text-muted-foreground'
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Thrust</span>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${thrustColor}`}>
          {thrust}
        </span>
      </div>

      <div>
        <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
          <span>ADV {advancers}</span>
          <span>A/D {adRatio.toFixed(2)}</span>
          <span>DEC {decliners}</span>
        </div>
        <div className="flex h-2 rounded-sm overflow-hidden gap-px">
          <div
            className="bg-emerald-500 transition-all"
            style={{ width: `${advPct}%` }}
          />
          <div
            className="bg-red-500 transition-all"
            style={{ width: `${decPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] mt-0.5">
          <span className="text-emerald-500">{advPct.toFixed(0)}% Adv</span>
          <span className="text-red-500">{decPct.toFixed(0)}% Dec</span>
        </div>
      </div>

      <div className="border-t border-border/20 pt-2 grid grid-cols-2 gap-2">
        <div className="text-center">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">New Highs</div>
          <div className="text-[15px] font-bold text-emerald-500">{newHighs}</div>
          <div className="text-[9px] text-muted-foreground">(&gt;3% up)</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">New Lows</div>
          <div className="text-[15px] font-bold text-red-500">{newLows}</div>
          <div className="text-[9px] text-muted-foreground">(&gt;3% dn)</div>
        </div>
      </div>

      {!moversData && (
        <div className="text-center text-[10px] text-muted-foreground pt-1">
          Switch to Gainers/Losers tab to load data
        </div>
      )}
    </div>
  )
}

function FuturesTab() {
  const equityFutures = FUTURES_DATA.filter((f) => ['ES', 'NQ', 'YM', 'RTY'].includes(f.symbol))
  const equityAvgChg = equityFutures.reduce((sum, f) => sum + f.changePercent, 0) / equityFutures.length
  const signal = equityAvgChg >= 0 ? 'RISK-ON' : 'RISK-OFF'
  const signalColor = equityAvgChg >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'

  const es = FUTURES_DATA.find((f) => f.symbol === 'ES')!
  const nq = FUTURES_DATA.find((f) => f.symbol === 'NQ')!
  const esNqSpread = (es.changePercent - nq.changePercent).toFixed(2)
  const spreadLabel = parseFloat(esNqSpread) > 0 ? 'Value Rotation' : 'Growth Rotation'
  const spreadColor = parseFloat(esNqSpread) > 0 ? 'text-blue-400' : 'text-purple-400'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${signalColor}`}>
            {signal}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-muted-foreground">ES-NQ Spread</div>
          <div className={`text-[9px] font-medium ${spreadColor}`}>
            {parseFloat(esNqSpread) > 0 ? '+' : ''}{esNqSpread}% &mdash; {spreadLabel}
          </div>
        </div>
      </div>

      <table className="w-full text-[10px]">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left font-medium pb-1">Sym</th>
            <th className="text-left font-medium pb-1 text-[9px]">Name</th>
            <th className="text-right font-medium pb-1">Price</th>
            <th className="text-right font-medium pb-1">Chg%</th>
          </tr>
        </thead>
        <tbody>
          {FUTURES_DATA.map((f) => {
            const isPos = f.changePercent >= 0
            return (
              <tr key={f.symbol} className="border-t border-border/20">
                <td className="py-0.5 font-bold text-[10px]">{f.symbol}</td>
                <td className="py-0.5 text-muted-foreground text-[9px]">{f.name}</td>
                <td className="text-right tabular-nums">
                  {f.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isPos ? '+' : ''}{f.changePercent.toFixed(2)}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function LiveMarketsPanel() {
  const [tab, setTab] = useState<Tab>('indices')
  const [chartData, setChartData] = useState<CandleData[]>([])
  const [chartSymbol, setChartSymbol] = useState('SPY')
  const { data, loading, error, refresh } = useMarketData()
  const isMoversTab = tab === 'gainers' || tab === 'losers' || tab === 'active' || tab === 'breadth'
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
        <button className={tabCls(tab === 'breadth')} onClick={() => setTab('breadth')}>Breadth</button>
        <button className={tabCls(tab === 'futures')} onClick={() => setTab('futures')}>Futures</button>
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

      {(tab === 'gainers' || tab === 'losers' || tab === 'active') && moversLoading && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
      )}

      {(tab === 'gainers' || tab === 'losers' || tab === 'active') && !moversLoading && moversList != null && !moversList.length && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">
          No data available. Refreshes automatically.
        </div>
      )}

      {(tab === 'gainers' || tab === 'losers' || tab === 'active') && moversList && !!moversList.length && (
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

      {tab === 'breadth' && (
        <BreadthTab moversData={moversData ?? null} moversLoading={moversLoading} />
      )}

      {tab === 'futures' && <FuturesTab />}
    </PanelWrapper>
  )
}
