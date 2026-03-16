import { fmt } from '@/lib/panel-utils'

interface TaData {
  price: number
  rsi: number
  rsiSignal: string
  macd: { line: number; signal: number; histogram: number }
  sma20: number
  sma50: number
  sma200: number
  bb: { upper: number; middle: number; lower: number }
}

export function TechAnalysisIndicatorsTab({ data }: { data: TaData }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">RSI (14)</span>
          <span className="text-[11px] tabular-nums font-medium">{fmt(data.rsi, 1)}</span>
        </div>
        <div className="relative h-3 rounded-full overflow-hidden bg-zinc-800">
          <div className="absolute inset-y-0 left-[30%] right-[30%] bg-amber-500/20" />
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${data.rsi}%`, background: data.rsi < 30 ? '#34d399' : data.rsi > 70 ? '#f87171' : '#a1a1aa' }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
          <span>0</span><span>30</span><span>70</span><span>100</span>
        </div>
      </div>

      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">MACD (12,26,9)</div>
        <div className="space-y-0.5">
          {[
            ['Line', fmt(data.macd.line, 3)],
            ['Signal', fmt(data.macd.signal, 3)],
            ['Histogram', (data.macd.histogram >= 0 ? '+' : '') + fmt(data.macd.histogram, 3)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">{k}</span>
              <span className="tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Moving Averages</div>
        <div className="space-y-0.5">
          {([['SMA 20', data.sma20], ['SMA 50', data.sma50], ['SMA 200', data.sma200]] as [string, number][]).map(([label, val]) => {
            const above = data.price >= val
            return (
              <div key={label} className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">{label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="tabular-nums">{fmt(val, 2)}</span>
                  <span className={`text-[9px] ${above ? 'text-emerald-400' : 'text-red-400'}`}>{above ? 'Above' : 'Below'}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Bollinger Bands (20,2)</div>
        <div className="space-y-0.5">
          {([['Upper', data.bb.upper], ['Middle', data.bb.middle], ['Lower', data.bb.lower], ['Price', data.price]] as [string, number][]).map(([label, val]) => (
            <div key={label} className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">{label}</span>
              <span className="tabular-nums">{fmt(val, 2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
