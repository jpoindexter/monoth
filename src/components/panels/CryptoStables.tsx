import { fmtCap, pegColor as getPegColor } from '@/components/panels/stablecoins-data'
import type { Stablecoin } from '@/components/panels/stablecoins-data'


export function CryptoStables({
  data,
  loading,
}: {
  data: Stablecoin[] | null
  loading: boolean
}) {
  if (loading) {
    return <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
  }

  if (!data) return null

  return (
    <table className="w-full text-[11px]">
      <thead>
        <tr className="text-muted-foreground">
          <th className="text-left font-medium pb-1.5">Name</th>
          <th className="text-right font-medium pb-1.5">Price</th>
          <th className="text-right font-medium pb-1.5">Peg</th>
          <th className="text-right font-medium pb-1.5">MCap</th>
        </tr>
      </thead>
      <tbody>
        {data.map((coin) => (
          <tr key={coin.id} className="border-t border-border/20">
            <td className="py-0.5">
              <span className="font-medium text-foreground">{coin.symbol}</span>
            </td>
            <td className="text-right tabular-nums">
              ${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </td>
            <td className={`text-right tabular-nums font-medium ${getPegColor(coin.pegDeviation)}`}>
              {(coin.pegDeviation * 100).toFixed(2)}%
            </td>
            <td className="text-right tabular-nums text-muted-foreground">
              {fmtCap(coin.marketCap)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
