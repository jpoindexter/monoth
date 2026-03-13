import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMacroData } from '@/hooks/use-macro-data'

export default function EconomicDataPanel() {
  const { data, loading, error, refresh } = useMacroData()

  return (
    <PanelWrapper title="Economic Data" loading={loading} error={error} onRetry={refresh}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Indicator</TableHead>
            <TableHead className="text-xs text-right">Latest</TableHead>
            <TableHead className="text-xs text-right">Previous</TableHead>
            <TableHead className="text-xs text-right">Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((series) => (
            <TableRow key={series.seriesId}>
              <TableCell className="text-xs font-medium">{series.name}</TableCell>
              <TableCell className="text-xs text-right font-mono">{series.value.toFixed(2)}</TableCell>
              <TableCell className="text-xs text-right font-mono">{series.previous.toFixed(2)}</TableCell>
              <TableCell
                className={`text-xs text-right font-mono ${series.change >= 0 ? 'text-green-500' : 'text-red-500'}`}
              >
                {series.change >= 0 ? '+' : ''}{series.change.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PanelWrapper>
  )
}
