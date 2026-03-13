import { useState, useEffect, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useMarketStore } from '@/stores/market-store'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { LightweightChart } from '@/components/charts/LightweightChart'

interface SymbolDetailSheetProps {
  ticker: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CandleData {
  time: string
  open: number
  high: number
  low: number
  close: number
}

export function SymbolDetailSheet({ ticker, open, onOpenChange }: SymbolDetailSheetProps) {
  const indices = useMarketStore((s) => s.indices)
  const crypto = useMarketStore((s) => s.crypto)
  const [candles, setCandles] = useState<CandleData[]>([])
  const [candleLoading, setCandleLoading] = useState(true)

  const indexMatch = indices.find((i) => i.symbol === ticker)
  const cryptoMatch = crypto.find((c) => c.symbol === ticker)

  const { data: quoteData } = usePolling({
    fetcher: useCallback(() => fetchQuotes([ticker]), [ticker]),
    interval: 60_000,
    enabled: open,
  })

  const quote = quoteData?.[0]
  const price = quote?.price ?? indexMatch?.price ?? cryptoMatch?.price ?? null
  const change = quote?.changePercent ?? indexMatch?.changePercent ?? cryptoMatch?.changePercent24h ?? null
  const name = indexMatch?.name ?? cryptoMatch?.name ?? ticker

  useEffect(() => {
    if (!open) return
    setCandleLoading(true)
    const from = Math.floor((Date.now() - 90 * 86400000) / 1000)
    const to = Math.floor(Date.now() / 1000)
    fetch(`/api/market/candles?symbol=${ticker}&resolution=D&from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setCandles(data)
        }
      })
      .catch(() => {})
      .finally(() => setCandleLoading(false))
  }, [ticker, open])

  const isPositive = change !== null && change >= 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-baseline gap-2">
            <span>{name}</span>
            <span className="text-sm font-normal text-muted-foreground">{ticker}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            {price !== null ? (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-semibold tabular-nums">
                  ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {change !== null && (
                  <span className={`text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{change.toFixed(2)}%
                  </span>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Loading quote...</p>
            )}
          </div>

          <div className="rounded-sm border border-border/40 overflow-hidden">
            {candleLoading ? (
              <div className="h-48 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Loading chart...</span>
              </div>
            ) : candles.length > 0 ? (
              <LightweightChart
                type="candlestick"
                data={candles}
                height={200}
              />
            ) : (
              <div className="h-48 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">No chart data available</span>
              </div>
            )}
          </div>

          {quote && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
              <div className="flex justify-between border-b border-border/20 pb-1">
                <span className="text-muted-foreground">Open</span>
                <span className="tabular-nums font-medium">${quote.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-1">
                <span className="text-muted-foreground">Change</span>
                <span className={`tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{change?.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-1">
                <span className="text-muted-foreground">Symbol</span>
                <span className="font-medium">{ticker}</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-1">
                <span className="text-muted-foreground">Period</span>
                <span className="font-medium">90D Daily</span>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
