import { fmt } from '@/lib/panel-utils'
import { TA_OVERALL } from './helpers'

function signalBadge(signal: string) {
  const bullish = ['oversold', 'bullish'].includes(signal)
  const bearish = ['overbought', 'bearish'].includes(signal)
  const cls = bullish
    ? 'bg-emerald-500/10 text-emerald-400'
    : bearish
    ? 'bg-red-500/10 text-red-400'
    : 'bg-amber-500/10 text-amber-400'
  return (
    <span className={`text-[9px] px-1 py-0.5 rounded-sm font-medium uppercase ${cls}`}>
      {signal.replace('_', ' ')}
    </span>
  )
}

interface TechnicalData {
  overall: string
  bullishCount: number
  bearishCount: number
  rsi: number
  rsiSignal: string
  macd: { line: number; signal: number; histogram: number }
  sma20: number
  sma50: number
  sma200: number
  bb: { upper: number; middle: number; lower: number }
  price: number
}

interface Props {
  taLoading: boolean
  taData: Record<string, unknown> | null
  onClose: () => void
}

export function SymbolDetailTechnical({ taLoading, taData, onClose }: Props) {
  if (taLoading) {
    return <div className="px-5 py-4 h-20 flex items-center justify-center text-[10px] text-muted-foreground animate-pulse">Loading…</div>
  }
  if (!taData) {
    return <div className="px-5 py-4 text-[10px] text-muted-foreground text-center py-8">No technical data available</div>
  }

  const d = taData as unknown as TechnicalData
  const overall = TA_OVERALL[d.overall] ?? { label: d.overall, cls: 'text-muted-foreground' }

  return (
    <div className="px-5 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">Overall Signal</div>
          <span className={`text-lg font-bold ${overall.cls}`}>{overall.label}</span>
        </div>
        <div className="text-right">
          <div className={`text-[10px] ${d.bullishCount > d.bearishCount ? 'text-emerald-400' : 'text-red-400'}`}>{d.bullishCount} Bullish</div>
          <div className="text-[10px] text-amber-400">{4 - d.bullishCount - d.bearishCount} Neutral</div>
          <div className={`text-[10px] ${d.bearishCount > d.bullishCount ? 'text-red-400' : 'text-muted-foreground'}`}>{d.bearishCount} Bearish</div>
        </div>
      </div>

      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">RSI (14)</div>
        <div className="flex items-center justify-between mb-1">
          <div className="relative h-2.5 flex-1 rounded-full overflow-hidden bg-zinc-800 mr-3">
            <div className="absolute inset-y-0 left-[30%] right-[30%] bg-amber-500/20" />
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${d.rsi}%`, background: d.rsi < 30 ? '#34d399' : d.rsi > 70 ? '#f87171' : '#a1a1aa' }}
            />
          </div>
          <span className="text-[11px] tabular-nums font-medium shrink-0">{fmt(d.rsi, 1)}</span>
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>Oversold &lt;30</span>
          <span>{signalBadge(d.rsiSignal)}</span>
          <span>&gt;70 Overbought</span>
        </div>
      </div>

      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">MACD (12,26,9)</div>
        {([
          ['Line', fmt(d.macd.line, 3)],
          ['Signal', fmt(d.macd.signal, 3)],
          ['Histogram', (d.macd.histogram >= 0 ? '+' : '') + fmt(d.macd.histogram, 3)],
        ] as [string, string][]).map(([k, v]) => (
          <div key={k} className="flex justify-between py-1 border-t border-border/15 text-[11px]">
            <span className="text-muted-foreground">{k}</span>
            <span className="tabular-nums">{v}</span>
          </div>
        ))}
      </div>

      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Moving Averages</div>
        {([['SMA 20', d.sma20], ['SMA 50', d.sma50], ['SMA 200', d.sma200]] as [string, number][]).map(([label, val]) => (
          <div key={label} className="flex justify-between py-1 border-t border-border/15 text-[11px]">
            <span className="text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2">
              <span className="tabular-nums">{fmt(val, 2)}</span>
              <span className={`text-[9px] ${d.price >= val ? 'text-emerald-400' : 'text-red-400'}`}>
                {d.price >= val ? 'Above' : 'Below'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Bollinger Bands (20,2)</div>
        {([['Upper', d.bb.upper], ['Middle', d.bb.middle], ['Lower', d.bb.lower], ['Price', d.price]] as [string, number][]).map(([label, val]) => (
          <div key={label} className="flex justify-between py-1 border-t border-border/15 text-[11px]">
            <span className="text-muted-foreground">{label}</span>
            <span className="tabular-nums">{fmt(val, 2)}</span>
          </div>
        ))}
      </div>

      <div className="text-[9px] text-muted-foreground/50 pt-1 text-center">
        <button className="hover:text-muted-foreground transition-colors" onClick={onClose}>
          Open in Tech Analysis panel for more
        </button>
      </div>
    </div>
  )
}
