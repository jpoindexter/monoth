import { useState, useCallback } from 'react'
import { useUserStore } from '@/stores'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { X } from 'lucide-react'

export default function WatchlistPanel() {
  const watchlist = useUserStore((s) => s.watchlist)
  const addToWatchlist = useUserStore((s) => s.addToWatchlist)
  const removeFromWatchlist = useUserStore((s) => s.removeFromWatchlist)
  const [input, setInput] = useState('')

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

  return (
    <PanelWrapper title="Watchlist" loading={loading && watchlist.length > 0} error={error} onRetry={refresh}>
      <div className="mb-2">
        <input
          placeholder="Add symbol..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleAdd}
          className="w-full bg-transparent border border-border/30 rounded-sm px-1.5 py-0.5 text-[11px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
        />
      </div>

      {watchlist.length === 0 ? (
        <div className="py-4 text-center text-muted-foreground text-[10px]">
          Type a ticker and press Enter
        </div>
      ) : (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Symbol</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">Chg</th>
              <th className="text-right font-medium pb-1.5">%</th>
              <th className="w-4"></th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((sym) => {
              const point = data?.find((d) => d.symbol === sym)
              const isPos = (point?.change ?? 0) >= 0
              return (
                <tr key={sym} className="border-t border-border/20">
                  <td className="py-0.5 font-medium">{sym}</td>
                  <td className="text-right tabular-nums">
                    {point ? point.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className={`text-right tabular-nums ${point ? (isPos ? 'text-emerald-600' : 'text-red-500') : ''}`}>
                    {point ? `${isPos ? '+' : ''}${point.change.toFixed(2)}` : '-'}
                  </td>
                  <td className={`text-right tabular-nums font-medium ${point ? (isPos ? 'text-emerald-600' : 'text-red-500') : ''}`}>
                    {point ? `${isPos ? '+' : ''}${point.changePercent.toFixed(2)}%` : '-'}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => removeFromWatchlist(sym)}
                      className="p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
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
