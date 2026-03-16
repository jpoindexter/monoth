import { useIsExpanded } from '@/components/layout/PanelWrapper'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import type { FredSeries } from '@/services/api/macro'

const YIELD_SERIES: Record<string, string> = {
  DGS2: '2Y', DGS5: '5Y', DGS10: '10Y', DGS30: '30Y',
}

export function FixedIncomeYields({ data }: { data: FredSeries[] | undefined }) {
  const expanded = useIsExpanded()

  const yieldData = data?.filter((s) => s.seriesId in YIELD_SERIES)
  const sortedYields = yieldData?.sort(
    (a, b) => Object.keys(YIELD_SERIES).indexOf(a.seriesId) - Object.keys(YIELD_SERIES).indexOf(b.seriesId)
  )
  const chartData = sortedYields?.map((s) => ({
    maturity: YIELD_SERIES[s.seriesId],
    yield: s.value,
  }))

  return (
    <>
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
            const label = YIELD_SERIES[series.seriesId]
            const isPos = series.change >= 0
            return (
              <tr key={series.seriesId} className="border-t border-border/20">
                <td className="py-0.5 font-medium">{label}</td>
                <td className="text-right tabular-nums">{series.value.toFixed(2)}%</td>
                <td className="text-right tabular-nums text-muted-foreground">{series.previous.toFixed(2)}%</td>
                <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPos ? '+' : ''}{series.change.toFixed(2)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {chartData && chartData.length > 0 && (
        <div className="mt-2 border-t border-border/20 pt-2">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Yield Curve</div>
          <ResponsiveContainer width="100%" height={expanded ? 300 : 80}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="maturity" tick={{ fontSize: expanded ? 11 : 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: expanded ? 11 : 9 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Line type="monotone" dataKey="yield" stroke="hsl(var(--foreground))" strokeWidth={expanded ? 2.5 : 1.5} dot={{ r: expanded ? 4 : 2.5, fill: 'hsl(var(--foreground))' }} />
            </LineChart>
          </ResponsiveContainer>
          {expanded && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {chartData.map((d) => (
                <div key={d.maturity} className="flex items-center justify-between px-2 py-1 rounded-sm bg-muted/30">
                  <span className="text-[11px] font-medium">{d.maturity}</span>
                  <span className="text-[12px] tabular-nums font-bold">{d.yield.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
