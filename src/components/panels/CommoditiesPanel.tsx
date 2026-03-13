
import { useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const COMMODITY_SYMBOLS = ['GC=F', 'SI=F', 'CL=F', 'HG=F', 'NG=F']
const COMMODITY_NAMES: Record<string, string> = {
  'GC=F': 'Gold',
  'SI=F': 'Silver',
  'CL=F': 'Crude Oil',
  'HG=F': 'Copper',
  'NG=F': 'Natural Gas',
}

export default function CommoditiesPanel() {
  const fetcher = useCallback(async () => {
    return fetchQuotes(COMMODITY_SYMBOLS)
  }, [])

  const { data, loading, error, refresh } = usePolling({
    fetcher,
    interval: 300_000,
  })

  return (
    <PanelWrapper title="Commodities & Futures" loading={loading} error={error} onRetry={refresh}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Name</TableHead>
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
                <TableCell className="text-sm font-medium">
                  {COMMODITY_NAMES[point.symbol] || point.symbol}
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
