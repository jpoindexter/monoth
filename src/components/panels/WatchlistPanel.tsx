import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/stores'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api'
import { fetchCandles, type CandleData } from '@/services/api/candles'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { X } from 'lucide-react'

const SHARES_KEY = 'monoth-portfolio-shares'

function loadShares(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SHARES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveShares(shares: Record<string, number>) {
  localStorage.setItem(SHARES_KEY, JSON.stringify(shares))
}

function MiniChart({ symbol }: { symbol: string }) {
  const [candles, setCandles] = useState<CandleData[]>([])

  useEffect(() => {
    fetchCandles(symbol).then(setCandles).catch(() => {})
  }, [symbol])

  if (candles.length === 0) {
    return <div className="h-[100px] flex items-center justify-center text-muted-foreground text-[10px]">Loading...</div>
  }

  return (
    <LightweightChart
      type="area"
      data={candles}
      height={100}
      lineColor="#6366f1"
      areaTopColor="rgba(99, 102, 241, 0.2)"
      areaBottomColor="rgba(99, 102, 241, 0.02)"
    />
  )
}

export default function WatchlistPanel() {
  const watchlist = useUserStore((s) => s.watchlist)
  const addToWatchlist = useUserStore((s) => s.addToWatchlist)
  const removeFromWatchlist = useUserStore((s) => s.removeFromWatchlist)
  const [input, setInput] = useState('')
  const [tab, setTab] = useState<'quotes' | 'portfolio'>('quotes')
  const [shares, setShares] = useState<Record<string, number>>(loadShares)
  const [expanded, setExpanded] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetcher = useCallback(() => fetchQuotes(watchlist), [watchlist])
  const { data, loading, error, refresh } = usePolling({
    fetcher,
    interval: 15000,
    enabled: watchlist.length > 0,
  })

  function handleAdd(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const sym = input.trim().toUpperCase()
    if (!sym || watchlist.includes(sym)) return
    addToWatchlist(sym)
    setInput('')
  }

  function updateShares(sym: string, val: string) {
    const n = parseFloat(val)
    const next = { ...shares }
    if (isNaN(n) || n <= 0) {
      delete next[sym]
    } else {
      next[sym] = n
    }
    setShares(next)
    saveShares(next)
  }

  function toggleExpanded(sym: string) {
    setExpanded((prev) => (prev === sym ? null : sym))
  }

  const totalValue = watchlist.reduce((sum, sym) => {
    const point = data?.find((d) => d.symbol === sym)
    const qty = shares[sym] ?? 0
    return sum + (point ? point.price * qty : 0)
  }, 0)

  const totalPnL = watchlist.reduce((sum, sym) => {
    const point = data?.find((d) => d.symbol === sym)
    const qty = shares[sym] ?? 0
    return sum + (point ? point.change * qty : 0)
  }, 0)

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Watchlist" loading={loading && watchlist.length > 0} error={error} onRetry={refresh}>
      <div className="mb-2 flex gap-1 items-center">
        <input
          placeholder="Add symbol..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleAdd}
          className="flex-1 bg-transparent border border-border/30 rounded-sm px-1.5 py-0.5 text-[11px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
        />
        <button className={tabCls(tab === 'quotes')} onClick={() => setTab('quotes')}>Quotes</button>
        <button className={tabCls(tab === 'portfolio')} onClick={() => setTab('portfolio')}>P&L</button>
      </div>

      {watchlist.length === 0 ? (
        <div className="py-4 text-center text-muted-foreground text-[10px]">
          Type a ticker and press Enter
        </div>
      ) : tab === 'quotes' ? (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Symbol</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">Chg%</th>
              <th className="w-4"></th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((sym) => {
              const point = data?.find((d) => d.symbol === sym)
              const isPos = (point?.changePercent ?? 0) >= 0
              const isExpanded = expanded === sym
              return (
                <>
                  <tr
                    key={sym}
                    className="border-t border-border/20 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    onClick={() => toggleExpanded(sym)}
                  >
                    <td className="py-0.5 font-medium flex items-center gap-1">
                      <span
                        className="inline-block text-muted-foreground transition-transform duration-150"
                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', fontSize: '8px' }}
                      >
                        &#9654;
                      </span>
                      {sym}
                    </td>
                    <td className="text-right tabular-nums">
                      {point ? `$${point.price.toFixed(2)}` : '-'}
                    </td>
                    <td className={`text-right tabular-nums font-medium ${point ? (isPos ? 'text-emerald-600' : 'text-red-500') : ''}`}>
                      {point ? `${isPos ? '+' : ''}${point.changePercent.toFixed(2)}%` : '-'}
                    </td>
                    <td className="text-right" onClick={(e) => { e.stopPropagation(); navigate(`/symbol/${sym}`) }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFromWatchlist(sym) }}
                        className="p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${sym}-chart`}>
                      <td colSpan={4} className="pb-2">
                        <div className="bg-muted/30 rounded px-2 pt-1">
                          <MiniChart symbol={sym} />
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      ) : (
        <>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-medium pb-1.5">Symbol</th>
                <th className="text-right font-medium pb-1.5">Shares</th>
                <th className="text-right font-medium pb-1.5">Value</th>
                <th className="text-right font-medium pb-1.5">Day P&L</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((sym) => {
                const point = data?.find((d) => d.symbol === sym)
                const qty = shares[sym] ?? 0
                const val = point ? point.price * qty : 0
                const pnl = point ? point.change * qty : 0
                const isPos = pnl >= 0
                return (
                  <tr key={sym} className="border-t border-border/20">
                    <td className="py-0.5 font-medium">{sym}</td>
                    <td className="text-right">
                      <input
                        type="number"
                        value={qty || ''}
                        onChange={(e) => updateShares(sym, e.target.value)}
                        placeholder="0"
                        className="w-12 text-right bg-transparent border-b border-border/30 text-[11px] tabular-nums outline-none focus:border-foreground/30"
                      />
                    </td>
                    <td className="text-right tabular-nums">{qty > 0 ? `$${val.toFixed(0)}` : '-'}</td>
                    <td className={`text-right tabular-nums font-medium ${qty > 0 ? (isPos ? 'text-emerald-600' : 'text-red-500') : ''}`}>
                      {qty > 0 ? `${isPos ? '+' : ''}$${pnl.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {Object.values(shares).some((v) => v > 0) && (
            <div className="mt-2 pt-2 border-t border-border/20 flex justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">Total</span>
              <div className="text-right">
                <span className="tabular-nums font-medium">${totalValue.toFixed(0)}</span>
                <span className={`ml-2 tabular-nums font-medium ${totalPnL >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </PanelWrapper>
  )
}
