import { LightweightChart } from '@/components/charts/LightweightChart'
import { fmt, fmtVol } from '@/lib/panel-utils'
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
  price: number | null
  isPos: boolean
  rangeChg: number | null
  high52: number | null
  low52: number | null
  highPct: number | null
  avgVol: number
  rangeCls: (r: Range) => string
}

export function SymbolDetailOverview({
  range, setRange, candles, candleLoading, price, isPos,
  rangeChg, high52, low52, highPct, avgVol, rangeCls,
}: Props) {
  return (
    <div className="px-5 py-4 space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Price Range ({range})</span>
          <div className="flex gap-0.5">
            {(['1W', '1M', '3M', '6M', '1Y'] as Range[]).map((r) => (
              <button key={r} className={rangeCls(r)} onClick={() => setRange(r)}>{r}</button>
            ))}
          </div>
        </div>
        <div className="rounded-sm overflow-hidden border border-border/20">
          {candleLoading ? (
            <div className="h-28 flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground animate-pulse">Loading…</span>
            </div>
          ) : candles.length > 0 ? (
            <LightweightChart
              type="area"
              data={candles}
              height={112}
              lineColor={isPos ? '#34d399' : '#f87171'}
              areaTopColor={isPos ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'}
              areaBottomColor="rgba(0,0,0,0)"
            />
          ) : (
            <div className="h-28 flex items-center justify-center text-[10px] text-muted-foreground">No chart data</div>
          )}
        </div>
        {high52 && low52 && price && highPct !== null && (
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>${fmt(low52)} low</span>
              <span>${fmt(high52)} high</span>
            </div>
            <div className="h-1 bg-border/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isPos ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${Math.max(2, Math.min(100, highPct))}%` }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-px bg-border/20 rounded-sm overflow-hidden border border-border/20">
        {[
          { label: `${range} Change`, value: rangeChg !== null ? `${rangeChg >= 0 ? '+' : ''}${rangeChg.toFixed(2)}%` : '—', colored: true, positive: (rangeChg ?? 0) >= 0 },
          { label: 'Current Price', value: price !== null ? `$${fmt(price)}` : '—' },
          { label: `${range} High`, value: high52 !== null ? `$${fmt(high52)}` : '—' },
          { label: `${range} Low`, value: low52 !== null ? `$${fmt(low52)}` : '—' },
          { label: 'Avg Volume', value: avgVol > 0 ? fmtVol(avgVol) : '—' },
          { label: 'Data Points', value: candles.length > 0 ? `${candles.length} days` : '—' },
        ].map(({ label, value, colored, positive }) => (
          <div key={label} className="bg-[#0e0e0e] px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
            <div className={`text-[12px] font-semibold tabular-nums ${colored ? (positive ? 'text-emerald-400' : 'text-red-400') : 'text-foreground'}`}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
