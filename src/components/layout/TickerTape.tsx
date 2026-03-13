import { useMarketStore } from '@/stores'

const TICKER_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'EFA', 'EEM']
const CRYPTO_SYMBOLS = ['BTC', 'ETH']
const COMMODITY_SYMBOLS = ['GLD']

export function TickerTape() {
  const indices = useMarketStore((s) => s.indices)
  const crypto = useMarketStore((s) => s.crypto)
  const commodities = useMarketStore((s) => s.commodities)

  const indexItems = indices.filter((d) => TICKER_SYMBOLS.includes(d.symbol))
  const cryptoItems = crypto.filter((d) => CRYPTO_SYMBOLS.includes(d.symbol))
  const commodityItems = commodities.filter((d) => COMMODITY_SYMBOLS.includes(d.symbol))

  const items = [
    ...indexItems.map((d) => ({ symbol: d.symbol, price: d.price, change: d.changePercent })),
    ...cryptoItems.map((d) => ({ symbol: d.symbol, price: d.price, change: d.changePercent24h })),
    ...commodityItems.map((d) => ({ symbol: d.symbol, price: d.price, change: d.changePercent })),
  ]

  if (items.length === 0) return null

  const rendered = items.map((item) => {
    const pos = item.change >= 0
    return (
      <span key={item.symbol} className="inline-flex items-center gap-1 px-3">
        <span className="text-foreground font-medium">{item.symbol}</span>
        <span className="text-muted-foreground tabular-nums">
          {item.price < 100
            ? item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`tabular-nums ${pos ? 'text-emerald-600' : 'text-red-500'}`}>
          {pos ? '+' : ''}{item.change.toFixed(2)}%
        </span>
      </span>
    )
  })

  return (
    <div className="h-6 border-b border-border/20 bg-background overflow-hidden shrink-0 relative">
      <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="flex items-center h-full animate-marquee whitespace-nowrap text-[10px]">
        {rendered}
        {rendered}
      </div>
    </div>
  )
}
