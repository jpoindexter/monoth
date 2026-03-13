
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useForexData } from '@/hooks/use-forex-data'

export default function ForexPanel() {
  const { data, loading, error, refresh } = useForexData()

  return (
    <PanelWrapper title="Forex & Currencies" loading={loading} error={error} onRetry={refresh}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Pair</TableHead>
            <TableHead className="text-xs text-right">Rate</TableHead>
            <TableHead className="text-xs text-right">Change</TableHead>
            <TableHead className="text-xs text-right">Change %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((rate) => (
            <TableRow key={rate.pair}>
              <TableCell className="text-xs font-medium">{rate.pair}</TableCell>
              <TableCell className="text-xs text-right font-mono">{rate.rate.toFixed(4)}</TableCell>
              <TableCell className={`text-xs text-right font-mono ${rate.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {rate.change >= 0 ? '+' : ''}{rate.change.toFixed(4)}
              </TableCell>
              <TableCell className={`text-xs text-right font-mono ${rate.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {rate.changePercent >= 0 ? '+' : ''}{rate.changePercent.toFixed(2)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PanelWrapper>
  )
}
