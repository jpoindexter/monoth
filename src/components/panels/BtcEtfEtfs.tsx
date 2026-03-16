interface QuoteData {
  symbol: string
  price: number
  change: number
  changePercent: number
}

const ETF_META: Record<string, { fee: number; aum: number; fullName: string }> = {
  IBIT: { fee: 0.25, aum: 50, fullName: 'iShares Bitcoin Trust' },
  FBTC: { fee: 0.25, aum: 18, fullName: 'Fidelity Wise Origin BTC' },
  GBTC: { fee: 1.50, aum: 22, fullName: 'Grayscale Bitcoin Trust' },
  ARKB: { fee: 0.21, aum: 5,  fullName: 'ARK 21Shares Bitcoin ETF' },
  BITB: { fee: 0.20, aum: 3,  fullName: 'Bitwise Bitcoin ETF' },
}

interface Props {
  etfData: QuoteData[] | null | undefined
  etfLoading: boolean
  expanded: boolean
}

export function BtcEtfEtfs({ etfData, etfLoading, expanded }: Props) {
  return (
    <table className={`w-full ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>
      <thead>
        <tr className="text-muted-foreground">
          <th className="text-left font-medium pb-1.5">ETF</th>
          <th className="text-right font-medium pb-1.5">Price</th>
          <th className="text-right font-medium pb-1.5">Chg</th>
          <th className="text-right font-medium pb-1.5">%</th>
        </tr>
      </thead>
      <tbody>
        {etfData?.map((etf) => {
          const isPos = (etf.changePercent ?? 0) >= 0
          const meta = ETF_META[etf.symbol]
          return (
            <tr key={etf.symbol} className="border-t border-border/20">
              <td className="py-0.5">
                <div className="font-medium">{etf.symbol}</div>
                {expanded && meta && (
                  <div className="text-[10px] text-muted-foreground">{meta.fullName}</div>
                )}
              </td>
              <td className="text-right tabular-nums">${etf.price.toFixed(2)}</td>
              <td className={`text-right tabular-nums ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                {isPos ? '+' : ''}{(etf.change ?? 0).toFixed(2)}
              </td>
              <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                {isPos ? '+' : ''}{(etf.changePercent ?? 0).toFixed(2)}%
              </td>
            </tr>
          )
        })}
        {(!etfData || etfData.length === 0) && !etfLoading && (
          <tr><td colSpan={4} className="py-2 text-center text-muted-foreground text-[10px]">No ETF data</td></tr>
        )}
      </tbody>
    </table>
  )
}
