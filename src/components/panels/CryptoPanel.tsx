
import { useCryptoData } from '@/hooks/use-crypto-data'
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

export default function CryptoPanel() {
  const { data, loading, error, refresh } = useCryptoData()

  return (
    <PanelWrapper title="Crypto & Digital Assets" loading={loading} error={error} onRetry={refresh}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-right">Rank</TableHead>
            <TableHead className="w-1/4">Name</TableHead>
            <TableHead className="w-1/5 text-right">Price</TableHead>
            <TableHead className="w-1/6 text-right">24h Change</TableHead>
            <TableHead className="w-1/5 text-right">Market Cap</TableHead>
            <TableHead className="w-1/5 text-right">Volume</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.slice(0, 20).map((crypto) => {
            const isPositive = crypto.change24h >= 0
            const changeColor = isPositive ? 'text-green-500' : 'text-red-500'

            return (
              <TableRow key={crypto.id}>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {crypto.rank}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  <div>{crypto.name}</div>
                  <div className="text-xs text-muted-foreground">{crypto.symbol.toUpperCase()}</div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  ${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className={`text-right text-sm ${changeColor}`}>
                  {isPositive ? '+' : ''}{crypto.changePercent24h.toFixed(2)}%
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                  {formatLargeNumber(crypto.marketCap)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                  {formatLargeNumber(crypto.volume24h)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </PanelWrapper>
  )
}
