import { LightweightChart } from '@/components/charts/LightweightChart'
import type { CandleData } from '@/services/api/candles'

const CHART_SYMBOLS = ['GLD', 'SLV', 'USO', 'DBA'] as const
type ChartSymbol = typeof CHART_SYMBOLS[number]

const CHART_SYMBOL_NAMES: Record<ChartSymbol, string> = {
  GLD: 'Gold', SLV: 'Silver', USO: 'Oil', DBA: 'Agriculture',
}

const CHART_COLORS: Record<ChartSymbol, { line: string; top: string; bottom: string }> = {
  GLD: { line: '#d97706', top: 'rgba(217, 119, 6, 0.2)', bottom: 'rgba(217, 119, 6, 0.02)' },
  SLV: { line: '#b45309', top: 'rgba(180, 83, 9, 0.2)', bottom: 'rgba(180, 83, 9, 0.02)' },
  USO: { line: '#6b7280', top: 'rgba(107, 114, 128, 0.2)', bottom: 'rgba(107, 114, 128, 0.02)' },
  DBA: { line: '#059669', top: 'rgba(5, 150, 105, 0.2)', bottom: 'rgba(5, 150, 105, 0.02)' },
}

interface Props {
  chartData: CandleData[]
  chartSymbol: ChartSymbol
  setChartSymbol: (sym: ChartSymbol) => void
  expanded: boolean
  showLabel?: boolean
}

export function CommoditiesChartTab({ chartData, chartSymbol, setChartSymbol, expanded, showLabel }: Props) {
  return (
    <div className={expanded ? 'mb-4' : ''}>
      {showLabel && (
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold py-1 border-b border-border/30 mb-2">Chart</div>
      )}
      <div className="flex gap-1 mb-1">
        {CHART_SYMBOLS.map((sym) => (
          <button
            key={sym}
            className={`text-[9px] px-1.5 py-0.5 rounded-sm ${chartSymbol === sym ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setChartSymbol(sym)}
          >
            {sym}
            <span className="ml-0.5 text-[7px] opacity-60">{CHART_SYMBOL_NAMES[sym]}</span>
          </button>
        ))}
      </div>
      <LightweightChart
        type="area"
        data={chartData}
        height={expanded ? 300 : 140}
        lineColor={CHART_COLORS[chartSymbol].line}
        areaTopColor={CHART_COLORS[chartSymbol].top}
        areaBottomColor={CHART_COLORS[chartSymbol].bottom}
      />
    </div>
  )
}

export type { ChartSymbol }
export { CHART_SYMBOLS }
