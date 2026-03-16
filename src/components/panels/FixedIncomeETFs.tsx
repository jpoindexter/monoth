import { useIsExpanded } from '@/components/layout/PanelWrapper'

const ETF_NAMES: Record<string, string> = {
  TLT: '20+ Yr Treasury', IEF: '7-10 Yr Treasury', SHY: '1-3 Yr Treasury',
  HYG: 'High Yield', LQD: 'Inv Grade', AGG: 'US Agg',
  BND: 'Total Bond', TIPS: 'TIPS',
}

interface QuotePoint {
  symbol: string
  price: number
  changePercent: number
  change?: number
}

export function FixedIncomeETFs({ data }: { data: QuotePoint[] | null | undefined }) {
  const expanded = useIsExpanded()

  return (
    <table className={`w-full ${expanded ? 'text-[12px]' : 'text-[11px]'}`}>
      <thead>
        <tr className="text-muted-foreground">
          <th className="text-left font-medium pb-1.5">Name</th>
          <th className="text-right font-medium pb-1.5">Price</th>
          <th className="text-right font-medium pb-1.5">Chg</th>
          <th className="text-right font-medium pb-1.5">Chg%</th>
        </tr>
      </thead>
      <tbody>
        {data?.map((p) => {
          const isPos = p.changePercent >= 0
          return (
            <tr key={p.symbol} className="border-t border-border/20">
              <td className={`${expanded ? 'py-1' : 'py-0.5'}`}>
                <span className="font-medium">{ETF_NAMES[p.symbol] || p.symbol}</span>
                <span className="text-muted-foreground ml-1 text-[10px]">{p.symbol}</span>
              </td>
              <td className="text-right tabular-nums">${p.price.toFixed(2)}</td>
              {expanded ? (
                <td className={`text-right tabular-nums ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPos ? '+' : ''}${Math.abs(p.change ?? 0).toFixed(2)}
                </td>
              ) : (
                <td className="text-right tabular-nums text-muted-foreground">—</td>
              )}
              <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                {isPos ? '+' : ''}{p.changePercent.toFixed(2)}%
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
