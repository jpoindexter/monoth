import { fmtCap, pegColor } from '@/components/panels/stablecoins-data'
import type { Stablecoin } from '@/components/panels/stablecoins-data'

interface Props {
  data: Stablecoin[]
  expanded: boolean
}

export function StablecoinsDataTab({ data, expanded }: Props) {
  if (!data.length) {
    return (
      <div className="py-4 text-center text-[10px] text-muted-foreground">
        No data available. Refreshes automatically.
      </div>
    )
  }

  return (
    <table className={`w-full ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>
      <thead>
        <tr className="text-muted-foreground">
          <th className="text-left font-medium pb-1.5">Name</th>
          <th className="text-right font-medium pb-1.5">Price</th>
          <th className="text-right font-medium pb-1.5">Peg</th>
          <th className="text-right font-medium pb-1.5">MCap</th>
          {expanded && <th className="text-right font-medium pb-1.5">Vol 24h</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((coin) => (
          <tr key={coin.id} className="border-t border-border/20">
            <td className="py-0.5">
              <div className="font-medium text-foreground">{coin.symbol.toUpperCase()}</div>
              {expanded && <div className="text-[10px] text-muted-foreground">{coin.name}</div>}
            </td>
            <td className="text-right tabular-nums">
              ${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </td>
            <td className={`text-right tabular-nums font-medium ${pegColor(coin.pegDeviation)}`}>
              {(coin.pegDeviation * 100).toFixed(2)}%
            </td>
            <td className="text-right tabular-nums text-muted-foreground">
              {fmtCap(coin.marketCap)}
            </td>
            {expanded && (
              <td className="text-right tabular-nums text-muted-foreground">
                {fmtCap(coin.volume24h)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
