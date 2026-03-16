import { DonutChart, PALETTE } from '@/components/charts/DonutChart'
import { supabase } from '@/lib/supabase'

interface QuoteData {
  symbol: string
  price: number
  change: number
  changePercent: number
}

interface Props {
  watchlist: string[]
  data: QuoteData[] | null | undefined
  shares: Record<string, number>
  isPanelExpanded: boolean
  totalValue: number
  totalPnL: number
  authenticated: boolean
  onUpdateShares: (sym: string, val: string) => void
}

export function WatchlistPortfolio({
  watchlist, data, shares, isPanelExpanded, totalValue, totalPnL, authenticated, onUpdateShares,
}: Props) {
  const segments = watchlist
    .map((sym, i) => {
      const point = data?.find((d) => d.symbol === sym)
      const qty = shares[sym] ?? 0
      const val = point ? point.price * qty : 0
      return { label: sym, value: val, color: PALETTE[i % PALETTE.length] ?? '#10b981' }
    })
    .filter((s) => s.value > 0)

  return (
    <>
      {segments.length > 0 && (
        <div className="mb-3">
          <DonutChart segments={segments} size={isPanelExpanded ? 200 : 120} />
        </div>
      )}
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
                    onChange={(e) => onUpdateShares(sym, e.target.value)}
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
  )
}
