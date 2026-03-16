import type { FredSeries } from '@/services/api/macro'
import { useIsExpanded } from '@/components/layout/PanelWrapper'

function trendIcon(value: number, previous: number) {
  if (value > previous) return <span className="text-emerald-500 text-[10px] font-bold ml-0.5">↑</span>
  if (value < previous) return <span className="text-red-500 text-[10px] font-bold ml-0.5">↓</span>
  return <span className="text-muted-foreground text-[10px] ml-0.5">—</span>
}

export function EconomicDataIndicators({ data }: { data: FredSeries[] }) {
  const expanded = useIsExpanded()

  if (!data.length) {
    return (
      <div className="py-4 text-center text-[10px] text-muted-foreground">
        No data available. Refreshes automatically.
      </div>
    )
  }

  return (
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
        {data.map((series) => {
          const diff = series.value - series.previous
          const isPositive = diff >= 0
          return (
            <tr key={series.seriesId} className="border-t border-border/20">
              <td className={`py-1 font-medium flex items-center ${expanded ? 'text-[12px]' : ''}`}>
                {series.name}
                {trendIcon(series.value, series.previous)}
              </td>
              <td className={`text-right tabular-nums ${expanded ? 'text-[13px] font-bold' : ''}`}>{series.value.toFixed(2)}</td>
              <td className="text-right tabular-nums text-muted-foreground">{series.previous.toFixed(2)}</td>
              <td className={`text-right tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'} ${expanded ? 'text-[12px]' : ''}`}>
                {isPositive ? '+' : ''}{diff.toFixed(2)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
