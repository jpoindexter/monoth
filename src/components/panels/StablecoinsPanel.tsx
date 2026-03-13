import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000_000) {
    return '$' + (num / 1_000_000_000_000).toFixed(1) + 'T'
  }
  if (num >= 1_000_000_000) {
    return '$' + (num / 1_000_000_000).toFixed(1) + 'B'
  }
  if (num >= 1_000_000) {
    return '$' + (num / 1_000_000).toFixed(1) + 'M'
  }
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function getPegDeviationColor(deviation: number): string {
  if (deviation < 0.001) return 'text-green-500'
  if (deviation < 0.005) return 'text-yellow-500'
  return 'text-red-500'
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/4">Name</TableHead>
            <TableHead className="w-1/5 text-right">Price</TableHead>
            <TableHead className="w-1/5 text-right">Peg Deviation</TableHead>
            <TableHead className="w-1/3 text-right">Market Cap</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((coin) => (
            <TableRow key={coin.id}>
              <TableCell className="text-sm font-medium">
                <div>{coin.name}</div>
                <div className="text-xs text-muted-foreground">{coin.symbol.toUpperCase()}</div>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                ${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </TableCell>
              <TableCell className={`text-right text-sm ${getPegDeviationColor(coin.pegDeviation)}`}>
                {(coin.pegDeviation * 100).toFixed(2)}%
              </TableCell>
              <TableCell className="text-right font-mono text-sm text-muted-foreground">
                {formatLargeNumber(coin.marketCap)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PanelWrapper>
  )
}
