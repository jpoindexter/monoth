import { LightweightChart } from '@/components/charts/LightweightChart'
import type { Range } from './helpers'

interface CandleData {
  time: string
  open: number
  high: number
  low: number
  close: number
}

interface Props {
  range: Range
  setRange: (r: Range) => void
  candles: CandleData[]
  candleLoading: boolean
  isPos: boolean
  rangeCls: (r: Range) => string
}

export function SymbolDetailChart({ range, setRange, candles, candleLoading, isPos, rangeCls }: Props) {
  return (
    <div className="px-5 py-4">
      <div className="flex justify-end gap-0.5 mb-2">
        {(['1W', '1M', '3M', '6M', '1Y'] as Range[]).map((r) => (
          <button key={r} className={rangeCls(r)} onClick={() => setRange(r)}>{r}</button>
        ))}
      </div>
      <div className="rounded-sm overflow-hidden border border-border/20">
        {candleLoading ? (
          <div className="h-64 flex items-center justify-center text-[10px] text-muted-foreground animate-pulse">Loading…</div>
        ) : candles.length > 0 ? (
          <LightweightChart
            type="area"
            data={candles}
            height={280}
            lineColor={isPos ? '#34d399' : '#f87171'}
            areaTopColor={isPos ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'}
            areaBottomColor="rgba(0,0,0,0)"
            showAxes
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-[10px] text-muted-foreground">No data</div>
        )}
      </div>
      {candles.length > 0 && (
        <div className="mt-3 text-[10px] text-muted-foreground text-center">{candles.length} trading days · Daily close</div>
      )}
    </div>
  )
}
