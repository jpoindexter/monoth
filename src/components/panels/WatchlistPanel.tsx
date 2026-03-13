import { useState, useCallback, useRef } from 'react'
import { useUserStore } from '@/stores'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export default function WatchlistPanel() {
  const watchlist = useUserStore((s) => s.watchlist)
  const tier = useUserStore((s) => s.tier)
  const addToWatchlist = useUserStore((s) => s.addToWatchlist)
  const removeFromWatchlist = useUserStore((s) => s.removeFromWatchlist)
  const [input, setInput] = useState('')

  const fetcher = useCallback(() => fetchQuotes(watchlist), [watchlist])
  const { data, loading, error, refresh } = usePolling({
    fetcher,
    interval: 15000,
    enabled: watchlist.length > 0,
  })

  const inputRef = useRef<HTMLInputElement>(null)

  function handleAdd(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const sym = input.trim().toUpperCase()
    if (!sym || watchlist.includes(sym)) return
    addToWatchlist(sym)
    setInput('')
  }

  const atLimit = tier === 'free' && watchlist.length >= 5

  return (
    <PanelWrapper title="Watchlist" loading={loading && watchlist.length > 0} error={error} onRetry={refresh}>
      <div className="flex flex-col h-full gap-2">
        <div className="px-3 pt-2">
          <Input
            ref={inputRef}
            placeholder={atLimit ? 'Upgrade for more symbols' : 'Add symbol (Enter)'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleAdd}
            disabled={atLimit}
            className="h-8 text-sm"
          />
          {atLimit && (
            <p className="text-xs text-muted-foreground mt-1">
              Upgrade to Pro for unlimited watchlist
            </p>
          )}
        </div>

        {watchlist.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Add symbols to your watchlist
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Symbol</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {watchlist.map((sym) => {
                const point = data?.find((d) => d.symbol === sym)
                const isPositive = (point?.change ?? 0) >= 0
                const changeColor = isPositive ? 'text-green-500' : 'text-red-500'
                return (
                  <TableRow key={sym}>
                    <TableCell className="font-medium text-sm">{sym}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {point ? point.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                    </TableCell>
                    <TableCell className={`text-right text-sm ${point ? changeColor : ''}`}>
                      {point ? `${isPositive ? '+' : ''}${point.change.toFixed(2)}` : '—'}
                    </TableCell>
                    <TableCell className={`text-right text-sm ${point ? changeColor : ''}`}>
                      {point ? `${isPositive ? '+' : ''}${point.changePercent.toFixed(2)}%` : '—'}
                    </TableCell>
                    <TableCell className="p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFromWatchlist(sym)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </PanelWrapper>
  )
}
