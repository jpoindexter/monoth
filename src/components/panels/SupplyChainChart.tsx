import { LightweightChart } from '@/components/charts/LightweightChart'
import { type CandleData } from '@/services/api/candles'
import { tabCls } from '@/lib/panel-utils'

const CHART_SYMBOLS = ['IYT', 'XTN', 'SEA'] as const
type ChartSymbol = typeof CHART_SYMBOLS[number]

const SC_NAMES: Record<string, string> = {
  IYT: 'Transport ETF', XTN: 'S&P Transport', SEA: 'Shipping ETF',
}

interface Props {
  candles: CandleData[]
  candlesLoading: boolean
  chartSymbol: ChartSymbol
  expanded: boolean
  onSymbolChange: (sym: ChartSymbol) => void
}

export function SupplyChainChart({ candles, candlesLoading, chartSymbol, expanded, onSymbolChange }: Props) {
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2">
        {CHART_SYMBOLS.map(sym => (
          <button key={sym} className={tabCls(chartSymbol === sym)} onClick={() => onSymbolChange(sym)}>
            {sym}
          </button>
        ))}
        <span className="text-[10px] text-muted-foreground self-center ml-1">{SC_NAMES[chartSymbol]}</span>
      </div>
      {candlesLoading ? (
        <div className="h-[120px] flex items-center justify-center text-[10px] text-muted-foreground">Loading…</div>
      ) : candles.length > 0 ? (
        <LightweightChart type="area" data={candles} height={expanded ? 300 : 120} />
      ) : (
        <div className="h-[120px] flex items-center justify-center text-[10px] text-muted-foreground">No data</div>
      )}
    </div>
  )
}
