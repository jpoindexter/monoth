import { useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'

interface FuturesContract {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

export function LiveMarketsFutures() {
  const { data: futuresData, loading } = usePolling<FuturesContract[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/market/futures')
      if (!res.ok) throw new Error('Failed to fetch futures')
      return res.json()
    }, []),
    interval: 60_000,
    enabled: true,
  })

  if (loading && !futuresData) {
    return <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
  }

  const data = futuresData ?? []
  const equityFutures = data.filter((f) => ['ES', 'NQ', 'YM', 'RTY'].includes(f.symbol))
  const equityAvgChg = equityFutures.length
    ? equityFutures.reduce((sum, f) => sum + f.changePercent, 0) / equityFutures.length
    : 0
  const signal = equityAvgChg >= 0 ? 'RISK-ON' : 'RISK-OFF'
  const signalColor = equityAvgChg >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'

  const es = data.find((f) => f.symbol === 'ES')
  const nq = data.find((f) => f.symbol === 'NQ')
  const esNqSpread = es && nq ? (es.changePercent - nq.changePercent).toFixed(2) : null
  const spreadLabel = esNqSpread && parseFloat(esNqSpread) > 0 ? 'Value Rotation' : 'Growth Rotation'
  const spreadColor = esNqSpread && parseFloat(esNqSpread) > 0 ? 'text-blue-400' : 'text-purple-400'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${signalColor}`}>
          {signal}
        </span>
        {esNqSpread && (
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">ES-NQ Spread</div>
            <div className={`text-[10px] font-medium ${spreadColor}`}>
              {parseFloat(esNqSpread) > 0 ? '+' : ''}{esNqSpread}% &mdash; {spreadLabel}
            </div>
          </div>
        )}
      </div>

      <table className="w-full text-[10px]">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left font-medium pb-1">Sym</th>
            <th className="text-left font-medium pb-1">Name</th>
            <th className="text-right font-medium pb-1">Price</th>
            <th className="text-right font-medium pb-1">Chg%</th>
          </tr>
        </thead>
        <tbody>
          {data.map((f) => {
            const isPos = f.changePercent >= 0
            return (
              <tr key={f.symbol} className="border-t border-border/20">
                <td className="py-0.5 font-bold text-[10px]">{f.symbol}</td>
                <td className="py-0.5 text-muted-foreground text-[10px]">{f.name}</td>
                <td className="text-right tabular-nums">
                  {f.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isPos ? '+' : ''}{f.changePercent.toFixed(2)}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
