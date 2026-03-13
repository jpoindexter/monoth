import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'

function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000_000) return '$' + (num / 1_000_000_000_000).toFixed(1) + 'T'
  if (num >= 1_000_000_000) return '$' + (num / 1_000_000_000).toFixed(1) + 'B'
  if (num >= 1_000_000) return '$' + (num / 1_000_000).toFixed(1) + 'M'
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function pegColor(deviation: number): string {
  if (deviation < 0.001) return 'text-emerald-600'
  if (deviation < 0.005) return 'text-yellow-500'
  return 'text-red-600'
}

interface Stablecoin {
  id: string
  symbol: string
  name: string
  price: number
  pegDeviation: number
  marketCap: number
  volume24h: number
}

export default function StablecoinsPanel() {
  const { data, loading, error, refresh } = usePolling<Stablecoin[]>({
    fetcher: async () => {
      const res = await fetch('/api/crypto/stablecoins')
      if (!res.ok) throw new Error('Failed to fetch stablecoins')
      return res.json()
    },
    interval: 300_000,
  })

  return (
    <PanelWrapper title="Stablecoins" loading={loading} error={error} onRetry={refresh}>
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
          {data?.map((coin) => (
            <tr key={coin.id} className="border-t border-border/20">
              <td className="py-0.5">
                <span className="font-medium text-foreground">{coin.symbol.toUpperCase()}</span>
              </td>
              <td className="text-right tabular-nums">
                ${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </td>
              <td className={`text-right tabular-nums font-medium ${pegColor(coin.pegDeviation)}`}>
                {(coin.pegDeviation * 100).toFixed(2)}%
              </td>
              <td className="text-right tabular-nums text-muted-foreground">
                {formatLargeNumber(coin.marketCap)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </PanelWrapper>
  )
}
