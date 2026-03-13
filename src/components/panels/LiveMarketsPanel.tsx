
import { useMarketData } from '@/hooks/use-market-data'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function LiveMarketsPanel() {
  const { data, loading, error, refresh } = useMarketData()

  return (
    <PanelWrapper title="Live Markets" loading={loading} error={error} onRetry={refresh}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Symbol</TableHead>
            <TableHead className="w-1/3 text-right">Price</TableHead>
            <TableHead className="w-1/6 text-right">Change</TableHead>
            <TableHead className="w-1/6 text-right">%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((point) => {
            const isPositive = point.change >= 0
            const changeColor = isPositive ? 'text-green-500' : 'text-red-500'

            return (
              <TableRow key={point.symbol}>
                <TableCell className="text-sm">
                  <div className="font-medium">{point.symbol}</div>
                  {point.name && <div className="text-xs text-muted-foreground">{point.name}</div>}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {point.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className={`text-right text-sm ${changeColor}`}>
                  {isPositive ? '+' : ''}{point.change.toFixed(2)}
                </TableCell>
                <TableCell className={`text-right text-sm ${changeColor}`}>
                  {isPositive ? '+' : ''}{point.changePercent.toFixed(2)}%
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </PanelWrapper>
  )
}
