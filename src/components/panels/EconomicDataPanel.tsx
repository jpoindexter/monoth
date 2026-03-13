import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useMacroData } from '@/hooks/use-macro-data'

export default function EconomicDataPanel() {
  const { data, loading, error, refresh } = useMacroData()

  return (
    <PanelWrapper title="Economic Data" loading={loading} error={error} onRetry={refresh}>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left font-medium pb-1.5">Indicator</th>
            <th className="text-right font-medium pb-1.5">Latest</th>
            <th className="text-right font-medium pb-1.5">Prev</th>
            <th className="text-right font-medium pb-1.5">Chg</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((series) => {
            const diff = series.value - series.previous
            const isPositive = diff >= 0
            return (
              <tr key={series.seriesId} className="border-t border-border/20">
                <td className="py-1 font-medium">{series.name}</td>
                <td className="text-right tabular-nums">{series.value.toFixed(2)}</td>
                <td className="text-right tabular-nums text-muted-foreground">{series.previous.toFixed(2)}</td>
                <td className={`text-right tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{diff.toFixed(2)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </PanelWrapper>
  )
}
