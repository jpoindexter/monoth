import { useState, useCallback } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { tabCls } from '@/lib/panel-utils'

interface ScreenerResult {
  symbol: string
  name: string
  price: number | null
  change: number | null
  changePercent: number | null
  volume: number | null
  marketCap: number | null
  peRatio: number | null
}

type Screen = 'most-active' | 'day-gainers' | 'day-losers' | 'undervalued-growth' | 'growth-technology' | 'undervalued-large-caps' | 'aggressive-small-caps'

const SCREENS: { id: Screen; label: string }[] = [
  { id: 'most-active', label: 'Most Active' },
  { id: 'day-gainers', label: 'Gainers' },
  { id: 'day-losers', label: 'Losers' },
  { id: 'undervalued-growth', label: 'Undervalued Growth' },
  { id: 'growth-technology', label: 'Growth Tech' },
  { id: 'undervalued-large-caps', label: 'Undervalued Large Cap' },
  { id: 'aggressive-small-caps', label: 'Small Cap' },
]

function fmtCap(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(0) + 'M'
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtVol(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return String(n)
}


export default function StockScreenerPanel() {
  const expanded = useIsExpanded()
  const [screen, setScreen] = useState<Screen>('most-active')
  const [sortCol, setSortCol] = useState<'changePercent' | 'volume' | 'marketCap' | 'peRatio'>('changePercent')

  const fetcher = useCallback(
    () => fetch(`/api/market/screener?screen=${screen}`).then(r => r.json()) as Promise<ScreenerResult[]>,
    [screen]
  )

  const { data, loading, error, refresh } = usePolling<ScreenerResult[]>({
    fetcher,
    interval: 60_000,
  })

  const sorted = [...(data ?? [])].sort((a, b) => {
    const av = a[sortCol] ?? 0
    const bv = b[sortCol] ?? 0
    if (sortCol === 'peRatio') return (av as number) - (bv as number)
    return Math.abs(bv as number) - Math.abs(av as number)
  })

  const rows = expanded ? sorted : sorted.slice(0, 15)

  return (
    <PanelWrapper title="Stock Screener" loading={loading && !data} error={error} onRetry={refresh}>
      {/* Screen selector */}
      <div className="flex flex-wrap gap-0.5 mb-2">
        {SCREENS.map(s => (
          <button key={s.id} className={tabCls(screen === s.id)} onClick={() => setScreen(s.id)}>{s.label}</button>
        ))}
      </div>

      {/* Sort controls */}
      <div className="flex gap-1 mb-1.5">
        <span className="text-[8px] text-muted-foreground self-center">Sort:</span>
        {(['changePercent', 'volume', 'marketCap', 'peRatio'] as const).map(col => (
          <button key={col} onClick={() => setSortCol(col)}
            className={`text-[8px] px-1 py-0.5 rounded-sm transition-colors ${sortCol === col ? 'text-foreground bg-border/30' : 'text-muted-foreground hover:text-foreground'}`}>
            {col === 'changePercent' ? '% Chg' : col === 'marketCap' ? 'Mkt Cap' : col === 'peRatio' ? 'P/E' : 'Vol'}
          </button>
        ))}
      </div>

      {data && rows.length === 0 && (
        <div className="text-center text-[10px] text-muted-foreground py-4">No results</div>
      )}

      {data && rows.length > 0 && (
        <div className="space-y-0">
          {rows.map(item => {
            const chg = item.changePercent ?? 0
            const isPos = chg >= 0
            return (
              <div key={item.symbol} className="flex items-center gap-1.5 py-1 border-b border-border/15 last:border-0">
                <div className="w-10 shrink-0">
                  <div className="text-[10px] font-bold text-foreground tabular-nums">{item.symbol}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] text-muted-foreground truncate">{item.name}</div>
                  <div className="flex gap-2 text-[8px] text-muted-foreground">
                    <span>Vol: {fmtVol(item.volume)}</span>
                    <span>Cap: {fmtCap(item.marketCap)}</span>
                    {item.peRatio != null && <span>P/E: {item.peRatio.toFixed(1)}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-medium tabular-nums text-foreground">
                    {item.price != null ? '$' + item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                  </div>
                  <div className={`text-[9px] tabular-nums font-medium ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPos ? '+' : ''}{chg.toFixed(2)}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {data && !expanded && data.length > 15 && (
        <div className="text-center text-[8px] text-muted-foreground mt-1">+{data.length - 15} more · expand to see all</div>
      )}
    </PanelWrapper>
  )
}
