const SC_NAMES: Record<string, string> = {
  IYT: 'Transport ETF', XTN: 'S&P Transport', SEA: 'Shipping ETF',
  FDX: 'FedEx', UPS: 'UPS', ZIM: 'ZIM Shipping',
}

interface QuoteData {
  symbol: string
  price: number
  changePercent: number
}

interface Props {
  priceData: QuoteData[] | null | undefined
  expanded: boolean
}

export function SupplyChainLogistics({ priceData, expanded }: Props) {
  return (
    <table className={`w-full ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>
      <thead>
        <tr className="text-muted-foreground">
          <th className="text-left font-medium pb-1.5">Name</th>
          <th className="text-right font-medium pb-1.5">Price</th>
          <th className="text-right font-medium pb-1.5">Chg%</th>
        </tr>
      </thead>
      <tbody>
        {priceData?.map((p) => {
          const isPos = p.changePercent >= 0
          return (
            <tr key={p.symbol} className="border-t border-border/20">
              <td className="py-0.5">
                <div className="font-medium">{SC_NAMES[p.symbol] || p.symbol}</div>
                <div className="text-muted-foreground text-[10px]">{p.symbol}</div>
              </td>
              <td className="text-right tabular-nums">${p.price.toFixed(2)}</td>
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
