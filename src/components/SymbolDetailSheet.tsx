import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useMarketStore } from '@/stores/market-store'

interface SymbolDetailSheetProps {
  ticker: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SymbolDetailSheet({ ticker, open, onOpenChange }: SymbolDetailSheetProps) {
  const indices = useMarketStore((s) => s.indices)
  const crypto = useMarketStore((s) => s.crypto)

  const indexMatch = indices.find((i) => i.symbol === ticker)
  const cryptoMatch = crypto.find((c) => c.symbol === ticker)

  const name = indexMatch?.name ?? cryptoMatch?.name ?? ticker
  const price = indexMatch?.price ?? cryptoMatch?.price ?? null
  const change = indexMatch?.changePercent ?? cryptoMatch?.changePercent24h ?? null

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
                <span className="text-3xl font-semibold">
                  {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {change !== null && (
                  <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{change.toFixed(2)}%
                  </span>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Price unavailable</p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 h-48 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Chart coming soon</span>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Related News</h3>
            <p className="text-sm text-muted-foreground">News feed coming soon</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
