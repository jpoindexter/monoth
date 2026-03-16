import { useState, useCallback, useRef } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { tabCls, fmt } from '@/lib/panel-utils'
import { TechAnalysisIndicatorsTab } from './TechAnalysisIndicatorsTab'
import { TechAnalysisWatchlistTab } from './TechAnalysisWatchlistTab'

type Overall = 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell'

interface TaData {
  symbol: string
  price: number
  rsi: number
  rsiSignal: string
  macd: { line: number; signal: number; histogram: number }
  macdSignal: string
  sma20: number
  sma50: number
  sma200: number
  maSignal: string
  bb: { upper: number; middle: number; lower: number }
  bbSignal: string
  overall: Overall
  bullishCount: number
  bearishCount: number
}

const OVERALL_MAP: Record<Overall, { label: string; cls: string }> = {
  strong_buy: { label: 'STRONG BUY', cls: 'text-emerald-400' },
  buy: { label: 'BUY', cls: 'text-emerald-600' },
  neutral: { label: 'NEUTRAL', cls: 'text-amber-400' },
  sell: { label: 'SELL', cls: 'text-red-500' },
  strong_sell: { label: 'STRONG SELL', cls: 'text-red-400' },
}

function signalBadge(signal: string) {
  const bullish = ['oversold', 'bullish'].includes(signal)
  const bearish = ['overbought', 'bearish'].includes(signal)
  const cls = bullish ? 'bg-emerald-500/10 text-emerald-400' : bearish ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
  return <span className={`text-[9px] px-1 py-0.5 rounded-sm font-medium uppercase ${cls}`}>{signal.replace('_', ' ')}</span>
}

export default function TechAnalysisPanel() {
  const [tab, setTab] = useState<'summary' | 'indicators' | 'watchlist'>('summary')
  const [symbol, setSymbol] = useState('SPY')
  const [inputVal, setInputVal] = useState('SPY')
  const inputRef = useRef<HTMLInputElement>(null)

  const fetcher = useCallback(async () => {
    const r = await fetch(`/api/market/tech-analysis?symbol=${symbol}`)
    if (!r.ok) throw new Error('Failed')
    return r.json() as Promise<TaData>
  }, [symbol])

  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 300_000 })

  const headerActions = (
    <form onSubmit={(e) => { e.preventDefault(); const s = inputVal.trim().toUpperCase(); if (s) setSymbol(s) }} className="flex items-center">
      <input
        ref={inputRef}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value.toUpperCase())}
        className="bg-transparent border-b border-border/40 text-[10px] font-medium w-14 text-center outline-none focus:border-foreground/60 tabular-nums"
        placeholder="SPY"
      />
    </form>
  )

  return (
    <PanelWrapper title="Tech Analysis" loading={loading} error={error} onRetry={refresh} headerActions={headerActions}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'summary')} onClick={() => setTab('summary')}>Summary</button>
        <button className={tabCls(tab === 'indicators')} onClick={() => setTab('indicators')}>Indicators</button>
        <button className={tabCls(tab === 'watchlist')} onClick={() => setTab('watchlist')}>Watchlist</button>
      </div>

      {tab === 'summary' && data && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground">{data.symbol}</span>
              <span className="text-[10px] text-muted-foreground ml-2 tabular-nums">${fmt(data.price, 2)}</span>
            </div>
            <span className={`text-[16px] font-bold ${OVERALL_MAP[data.overall].cls}`}>{OVERALL_MAP[data.overall].label}</span>
          </div>
          <div className="flex gap-3 text-[10px]">
            <span className="text-emerald-400">{data.bullishCount} Bullish</span>
            <span className="text-amber-400">{4 - data.bullishCount - data.bearishCount} Neutral</span>
            <span className="text-red-400">{data.bearishCount} Bearish</span>
          </div>
          <div className="space-y-1.5 mt-1">
            {[
              { label: 'RSI', value: fmt(data.rsi, 1), signal: data.rsiSignal },
              { label: 'MACD', value: (data.macd.histogram >= 0 ? '+' : '') + fmt(data.macd.histogram, 3), signal: data.macdSignal },
              { label: 'MA Trend', value: `${fmt(data.sma50, 2)} / ${fmt(data.sma200, 2)}`, signal: data.maSignal },
              { label: 'Bollinger', value: data.bbSignal === 'upper' ? 'Near upper' : data.bbSignal === 'lower' ? 'Near lower' : 'Mid band', signal: data.bbSignal === 'middle' ? 'neutral' : data.bbSignal === 'upper' ? 'overbought' : 'oversold' },
            ].map(({ label, value, signal }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] tabular-nums">{value}</span>
                  {signalBadge(signal)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'indicators' && data && <TechAnalysisIndicatorsTab data={data} />}
      {tab === 'watchlist' && <TechAnalysisWatchlistTab />}
    </PanelWrapper>
  )
}
