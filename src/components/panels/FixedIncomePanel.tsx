
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMacroData } from '@/hooks/use-macro-data'


const YIELD_SERIES = {
  DGS2: '2Y',
  DGS5: '5Y',
  DGS10: '10Y',
  DGS30: '30Y',
}

export default function FixedIncomePanel() {
  const { data, loading, error, refresh } = useMacroData()

  const yieldData = data?.filter((series) => series.seriesId in YIELD_SERIES)

  const sortedYields = yieldData?.sort(
    (a, b) =>
      Object.keys(YIELD_SERIES).indexOf(a.seriesId) - Object.keys(YIELD_SERIES).indexOf(b.seriesId)
  )

  return (
    <PanelWrapper title="Fixed Income" loading={loading} error={error} onRetry={refresh}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Maturity</TableHead>
            <TableHead className="text-xs text-right">Yield %</TableHead>
            <TableHead className="text-xs text-right">Previous</TableHead>
            <TableHead className="text-xs text-right">Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedYields?.map((series) => {
            const maturityLabel = YIELD_SERIES[series.seriesId as keyof typeof YIELD_SERIES]
            return (
              <TableRow key={series.seriesId}>
                <TableCell className="text-xs font-medium">{maturityLabel}</TableCell>
                <TableCell className="text-xs text-right font-mono">{series.value.toFixed(2)}%</TableCell>
                <TableCell className="text-xs text-right font-mono">{series.previous.toFixed(2)}%</TableCell>
                <TableCell
                  className={`text-xs text-right font-mono ${series.change >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {series.change >= 0 ? '+' : ''}{series.change.toFixed(2)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </PanelWrapper>
  )
}
