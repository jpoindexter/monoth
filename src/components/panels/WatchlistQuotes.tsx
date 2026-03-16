import { X } from 'lucide-react'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { fetchCandles, type CandleData } from '@/services/api/candles'
import { useState, useEffect } from 'react'

interface Alert {
  id: string
  symbol: string
  targetPrice: number
  direction: 'above' | 'below'
  triggered: boolean
}

interface QuoteData {
  symbol: string
  price: number
  change: number
  changePercent: number
}

interface Props {
  watchlist: string[]
  data: QuoteData[] | null | undefined
  isPanelExpanded: boolean
  expanded: string | null
  alerts: Alert[]
  alertOpen: string | null
  alertPrice: string
  onToggleExpanded: (sym: string) => void
  onOpenAlertForm: (sym: string, price: number | undefined) => void
  onCreateAlert: (sym: string, direction: 'above' | 'below') => void
  onCloseAlert: () => void
  onSetAlertPrice: (v: string) => void
  onRemove: (sym: string) => void
  onRemoveAlert: (id: string) => void
}

function MiniChart({ symbol, height = 100 }: { symbol: string; height?: number }) {
  const [candles, setCandles] = useState<CandleData[]>([])
  useEffect(() => {
    fetchCandles(symbol).then(setCandles).catch(() => {})
  }, [symbol])
  if (candles.length === 0) {
    return <div className="flex items-center justify-center text-muted-foreground text-[10px]" style={{ height }}>Loading...</div>
  }
  return (
    <LightweightChart type="area" data={candles} height={height}
      lineColor="#6366f1" areaTopColor="rgba(99, 102, 241, 0.2)" areaBottomColor="rgba(99, 102, 241, 0.02)" />
  )
}

export function WatchlistQuotes({
  watchlist, data, isPanelExpanded, expanded, alerts,
  alertOpen, alertPrice, onToggleExpanded, onOpenAlertForm,
  onCreateAlert, onCloseAlert, onSetAlertPrice, onRemove, onRemoveAlert,
}: Props) {
  return (
    <table className={`w-full ${isPanelExpanded ? 'text-[13px]' : 'text-[11px]'}`}>
      <thead>
        <tr className="text-muted-foreground">
          <th className="text-left font-medium pb-1.5">Symbol</th>
          <th className="text-right font-medium pb-1.5">Price</th>
          {isPanelExpanded && <th className="text-right font-medium pb-1.5">Chg</th>}
          <th className="text-right font-medium pb-1.5">Chg%</th>
          <th className="w-4"></th>
        </tr>
      </thead>
      <tbody>
        {watchlist.map((sym) => {
          const point = data?.find((d) => d.symbol === sym)
          const isPos = (point?.changePercent ?? 0) >= 0
          const isExpanded = expanded === sym
          const symAlerts = alerts.filter((a) => a.symbol === sym && !a.triggered)
          const hasTriggered = alerts.some((a) => a.symbol === sym && a.triggered)
          const hasActive = symAlerts.length > 0
          return (
            <>
              <tr
                key={sym}
                className={`border-t border-border/20 cursor-pointer hover:bg-muted/30 ${hasTriggered ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                onClick={() => onToggleExpanded(sym)}
              >
                <td className="py-0.5 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="inline-block text-muted-foreground transition-transform duration-150"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', fontSize: '8px' }}>
                      &#9654;
                    </span>
                    {sym}
                    {hasActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </div>
                </td>
                <td className="text-right tabular-nums">{point ? `$${point.price.toFixed(2)}` : '-'}</td>
                {isPanelExpanded && (
                  <td className={`text-right tabular-nums font-medium ${point ? (isPos ? 'text-emerald-600' : 'text-red-500') : ''}`}>
                    {point ? `${isPos ? '+' : ''}${point.change.toFixed(2)}` : '-'}
                  </td>
                )}
                <td className={`text-right tabular-nums font-medium ${point ? (isPos ? 'text-emerald-600' : 'text-red-500') : ''}`}>
                  {point ? `${isPos ? '+' : ''}${point.changePercent.toFixed(2)}%` : '-'}
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); onOpenAlertForm(sym, point?.price) }}
                      className="p-0.5 text-muted-foreground hover:text-foreground text-[10px] leading-none" title="Set price alert">
                      🔔
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onRemove(sym) }}
                      className="p-0.5 text-muted-foreground hover:text-foreground">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </td>
              </tr>
              {alertOpen === sym && (
                <tr key={`${sym}-alert-form`}>
                  <td colSpan={4} className="pb-1 pt-0.5">
                    <div className="flex items-center gap-1 px-1" onClick={(e) => e.stopPropagation()}>
                      <input type="number" value={alertPrice} onChange={(e) => onSetAlertPrice(e.target.value)}
                        placeholder="Price"
                        className="w-16 bg-transparent border-b border-border/40 text-[10px] tabular-nums outline-none focus:border-foreground/40 text-right"
                        autoFocus />
                      <button onClick={() => onCreateAlert(sym, 'above')}
                        className="text-[10px] px-1 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-sm hover:bg-emerald-500/30">
                        Above
                      </button>
                      <button onClick={() => onCreateAlert(sym, 'below')}
                        className="text-[10px] px-1 py-0.5 bg-red-500/20 text-red-700 dark:text-red-400 rounded-sm hover:bg-red-500/30">
                        Below
                      </button>
                      <button onClick={onCloseAlert} className="text-[10px] text-muted-foreground hover:text-foreground">✕</button>
                    </div>
                  </td>
                </tr>
              )}
              {alerts.filter((a) => a.symbol === sym).map((a) => (
                <tr key={`alert-${a.id}`}>
                  <td colSpan={4} className={`text-[10px] px-1 pb-0.5 ${a.triggered ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                    <div className="flex items-center justify-between">
                      <span>{a.triggered ? '✓' : '○'} {a.direction} ${a.targetPrice.toFixed(2)}</span>
                      <button onClick={(e) => { e.stopPropagation(); onRemoveAlert(a.id) }} className="hover:text-foreground">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
              {isExpanded && (
                <tr key={`${sym}-chart`}>
                  <td colSpan={4} className="pb-2">
                    <div className="bg-muted/30 rounded px-2 pt-1">
                      <MiniChart symbol={sym} height={isPanelExpanded ? 300 : 100} />
                    </div>
                  </td>
                </tr>
              )}
            </>
          )
        })}
      </tbody>
    </table>
  )
}
