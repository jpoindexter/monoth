

import { useState, useCallback } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { LightweightChart } from '@/components/charts/LightweightChart'

interface Candle {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

type Signal = 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL'

function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50
  let gains = 0, losses = 0
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = (closes[i] ?? 0) - (closes[i - 1] ?? 0)
    if (diff > 0) gains += diff
    else losses -= diff
  }
  const rs = gains / (losses || 0.0001)
  return 100 - 100 / (1 + rs)
}

function sma(closes: number[], n: number): number {
  const slice = closes.slice(-n)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

function getSignal(rsi: number, price: number, ma20: number): Signal {
  if (rsi < 35 && price > ma20) return 'STRONG BUY'
  if (rsi < 45 && price > ma20) return 'BUY'
  if (rsi >= 45 && rsi <= 60) return 'HOLD'
  if (rsi > 70 && price < ma20) return 'STRONG SELL'
  if (rsi > 60 && price < ma20) return 'SELL'
  return 'HOLD'
}

function signalColor(signal: Signal): string {
  if (signal === 'STRONG BUY') return 'text-emerald-500'
  if (signal === 'BUY') return 'text-emerald-400'
  if (signal === 'HOLD') return 'text-yellow-500'
  if (signal === 'SELL') return 'text-red-400'
  return 'text-red-500'
}

function signalBg(signal: Signal): string {
  if (signal === 'STRONG BUY') return 'bg-emerald-500/10 border border-emerald-500/30'
  if (signal === 'BUY') return 'bg-emerald-400/10 border border-emerald-400/30'
  if (signal === 'HOLD') return 'bg-yellow-500/10 border border-yellow-500/30'
  if (signal === 'SELL') return 'bg-red-400/10 border border-red-400/30'
  return 'bg-red-500/10 border border-red-500/30'
}

function rsiColor(rsi: number): string {
  if (rsi < 40) return 'text-emerald-500'
  if (rsi <= 60) return 'text-yellow-500'
  return 'text-red-500'
}

function fmtPct(a: number, b: number): string {
  const pct = ((a - b) / b) * 100
  return (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'
}

export default function StockAnalysisPanel() {
  const expanded = useIsExpanded()
  const [symbol, setSymbol] = useState('SPY')
  const [inputVal, setInputVal] = useState('SPY')
  const [tab, setTab] = useState<'signal' | 'technicals' | 'history'>('signal')

  const fetcher = useCallback(async () => {
    const res = await fetch(`/api/market/candles?symbol=${symbol}`)
    if (!res.ok) throw new Error(`Failed to fetch candles for ${symbol}`)
    return res.json() as Promise<Candle[]>
  }, [symbol])

  const { data, loading, error, refresh } = usePolling<Candle[]>({
    fetcher,
    interval: 300_000,
  })

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = inputVal.trim().toUpperCase()
    if (val) setSymbol(val)
  }

  const closes = data?.map(c => c.close) ?? []
  const hasEnough = closes.length >= 20
  const price = closes[closes.length - 1] ?? 0
  const prevClose = closes[closes.length - 2] ?? price
  const changeAmt = price - prevClose
  const changePct = prevClose ? (changeAmt / prevClose) * 100 : 0

  const rsi = hasEnough ? calcRSI(closes) : 50
  const ma20 = hasEnough ? sma(closes, 20) : 0
  const ma50 = closes.length >= 50 ? sma(closes, 50) : 0
  const signal = hasEnough ? getSignal(rsi, price, ma20) : 'HOLD'

  const last5 = closes.slice(-5)
  const uptrend = last5.length === 5 && (last5[4] ?? 0) > (last5[0] ?? 0)

  const bullish: string[] = []
  const risks: string[] = []
  if (hasEnough) {
    if (price > ma20) bullish.push('Price above 20-day MA')
    if (ma50 > 0 && price > ma50) bullish.push('Price above 50-day MA')
    if (rsi < 50) bullish.push('RSI below 50 (room to run)')
    if (uptrend) bullish.push('5-day uptrend')

    if (price < ma20) risks.push('Price below 20-day MA')
    if (rsi > 65) risks.push('RSI elevated (overbought risk)')
    if (ma50 > 0 && price < ma50) risks.push('Below 50-day MA (bearish)')
    if (prevClose > 0 && changePct < -2) risks.push('Recent negative momentum')
  }

  const chartData = (data ?? []).slice(-60).map(c => ({ time: c.time, value: c.close }))

  const vol = data?.[data.length - 1]?.volume
  const change20 = closes.length >= 20 ? fmtPct(price, closes[closes.length - 20] ?? price) : 'N/A'
  const change50 = closes.length >= 50 ? fmtPct(price, closes[closes.length - 50] ?? price) : 'N/A'

  return (
    <PanelWrapper title="Stock Analysis" loading={loading && !data} error={error} onRetry={refresh}>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-1 mb-2">
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value.toUpperCase())}
          placeholder="Symbol"
          className="flex-1 h-5 px-1.5 text-[11px] rounded-sm bg-muted border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          className="h-5 px-2 text-[10px] uppercase tracking-wider font-medium rounded-sm bg-foreground text-background hover:opacity-80"
        >
          Analyze
        </button>
      </form>

      <div className="flex flex-wrap gap-1 mb-2">
        <button className={tabCls(tab === 'signal')} onClick={() => setTab('signal')}>Signal</button>
        <button className={tabCls(tab === 'technicals')} onClick={() => setTab('technicals')}>Technicals</button>
        <button className={tabCls(tab === 'history')} onClick={() => setTab('history')}>History</button>
      </div>

      {loading && !data && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">
          Analyzing {symbol}...
        </div>
      )}

      {!loading && data && !hasEnough && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">
          Insufficient data for {symbol}
        </div>
      )}

      {data && hasEnough && tab === 'signal' && (
        <div className="space-y-2">
          <div className={`flex items-center justify-between rounded-md px-3 py-2 ${signalBg(signal)}`}>
            <span className={`text-base font-bold tracking-wide ${signalColor(signal)}`}>{signal}</span>
            <div className="text-right">
              <div className="text-[13px] font-semibold tabular-nums text-foreground">
                ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`text-[10px] tabular-nums ${changePct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
              <span>RSI(14)</span>
              <span className={`font-medium ${rsiColor(rsi)}`}>{rsi.toFixed(1)}</span>
            </div>
            <div className="relative h-1.5 w-full bg-border/30 rounded-sm overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full rounded-sm transition-all ${rsi < 40 ? 'bg-emerald-500' : rsi <= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(rsi, 100)}%` }}
              />
              <div className="absolute top-0 h-full w-px bg-yellow-400/60" style={{ left: '30%' }} />
              <div className="absolute top-0 h-full w-px bg-red-400/60" style={{ left: '70%' }} />
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
              <span>Oversold</span>
              <span>Neutral</span>
              <span>Overbought</span>
            </div>
          </div>

          {(bullish.length > 0 || expanded) && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Bullish factors</div>
              {bullish.length === 0
                ? <div className="text-[10px] text-muted-foreground">None</div>
                : bullish.map(f => (
                  <div key={f} className="flex items-center gap-1 text-[10px] text-emerald-500">
                    <span>+</span><span>{f}</span>
                  </div>
                ))}
            </div>
          )}

          {(risks.length > 0 || expanded) && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Risk factors</div>
              {risks.length === 0
                ? <div className="text-[10px] text-muted-foreground">None</div>
                : risks.map(f => (
                  <div key={f} className="flex items-center gap-1 text-[10px] text-red-500">
                    <span>-</span><span>{f}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {data && hasEnough && tab === 'technicals' && (
        <table className="w-full text-[11px]">
          <tbody>
            {[
              { label: 'Price', value: `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, cls: 'text-foreground' },
              { label: 'SMA(20)', value: `$${ma20.toFixed(2)}`, cls: 'text-foreground' },
              { label: 'SMA(50)', value: ma50 > 0 ? `$${ma50.toFixed(2)}` : 'N/A', cls: 'text-foreground' },
              { label: 'RSI(14)', value: rsi.toFixed(1), cls: rsiColor(rsi) },
              { label: '20d change', value: change20, cls: change20.startsWith('+') ? 'text-emerald-500' : 'text-red-500' },
              { label: '50d change', value: change50, cls: change50 === 'N/A' ? 'text-muted-foreground' : change50.startsWith('+') ? 'text-emerald-500' : 'text-red-500' },
              ...(vol != null ? [{ label: 'Volume', value: vol.toLocaleString('en-US'), cls: 'text-foreground' }] : []),
            ].map(row => (
              <tr key={row.label} className="border-t border-border/20">
                <td className="py-0.5 text-muted-foreground">{row.label}</td>
                <td className={`py-0.5 text-right tabular-nums font-medium ${row.cls}`}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'history' && (
        <LightweightChart
          type="area"
          data={chartData}
          height={expanded ? 300 : 160}
          lineColor="#6366f1"
          areaTopColor="rgba(99, 102, 241, 0.2)"
          areaBottomColor="rgba(99, 102, 241, 0.02)"
        />
      )}
    </PanelWrapper>
  )
}
