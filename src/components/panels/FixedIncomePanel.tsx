import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useMacroData } from '@/hooks/use-macro-data'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'

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

  const chartData = sortedYields?.map((series) => ({
    maturity: YIELD_SERIES[series.seriesId as keyof typeof YIELD_SERIES],
    yield: series.value,
  }))

  return (
    <PanelWrapper title="Fixed Income" loading={loading} error={error} onRetry={refresh}>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left font-medium pb-1.5">Maturity</th>
            <th className="text-right font-medium pb-1.5">Yield</th>
            <th className="text-right font-medium pb-1.5">Prev</th>
            <th className="text-right font-medium pb-1.5">Chg</th>
          </tr>
        </thead>
        <tbody>
          {sortedYields?.map((series) => {
            const maturityLabel = YIELD_SERIES[series.seriesId as keyof typeof YIELD_SERIES]
            const isPositive = series.change >= 0
            return (
              <tr key={series.seriesId} className="border-t border-border/20">
                <td className="py-1 font-medium">{maturityLabel}</td>
                <td className="text-right tabular-nums">{series.value.toFixed(2)}%</td>
                <td className="text-right tabular-nums text-muted-foreground">{series.previous.toFixed(2)}%</td>
                <td className={`text-right tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{series.change.toFixed(2)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {chartData && chartData.length > 0 && (
        <div className="mt-2 border-t border-border/20 pt-2">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Yield Curve</div>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="maturity" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Line
                type="monotone"
                dataKey="yield"
                stroke="hsl(var(--foreground))"
                strokeWidth={1.5}
                dot={{ r: 2.5, fill: 'hsl(var(--foreground))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </PanelWrapper>
  )
}
