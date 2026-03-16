interface Stablecoin {
  id: string
  symbol: string
  name: string
  price: number
  pegDeviation: number
  marketCap: number
  volume24h: number
}

function fmtCap(num: number): string {
  if (num >= 1e12) return '$' + (num / 1e12).toFixed(1) + 'T'
  if (num >= 1e9)  return '$' + (num / 1e9).toFixed(1) + 'B'
  if (num >= 1e6)  return '$' + (num / 1e6).toFixed(1) + 'M'
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function getPegColor(deviation: number): string {
  if (deviation < 0.001) return 'text-emerald-600'
  if (deviation < 0.005) return 'text-yellow-500'
  return 'text-red-600'
}

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
