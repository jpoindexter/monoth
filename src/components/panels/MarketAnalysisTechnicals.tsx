type Signal = 'bullish' | 'bearish' | 'neutral'

const SIGNAL_TEXT: Record<Signal, string> = {
  bullish: 'text-emerald-600',
  bearish: 'text-red-500',
  neutral: 'text-yellow-500',
}

const SUPPORT_LEVELS = [510, 500, 490]
const RESISTANCE_LEVELS = [535, 545, 560]

function deriveTechnicalOutlook(spyPrice: number | null, dma50: number | null, dma200: number | null): Signal {
  if (spyPrice === null || dma50 === null || dma200 === null) return 'neutral'
  if (spyPrice > dma50 && spyPrice > dma200) return 'bullish'
  if (spyPrice < dma50 && spyPrice < dma200) return 'bearish'
  return 'neutral'
}

interface Props {
  spyPrice: number | null
  dma50: number | null
  dma200: number | null
  loading: boolean
}

export function MarketAnalysisTechnicals({ spyPrice, dma50, dma200, loading }: Props) {
  if (loading) {
    return <p className="text-[10px] text-muted-foreground">Computing technicals...</p>
  }

  const outlook = deriveTechnicalOutlook(spyPrice, dma50, dma200)

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Moving Averages · SPY</span>
        {spyPrice !== null && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground w-16">Price</span>
            <span className="text-[10px] tabular-nums font-semibold text-foreground">${spyPrice.toFixed(2)}</span>
            <span />
          </div>
        )}
        {[{ label: '50 DMA', level: dma50 }, { label: '200 DMA', level: dma200 }].map(({ label, level }) => {
          if (level === null || spyPrice === null) {
            return (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground w-16">{label}</span>
                <span className="text-[10px] text-muted-foreground">—</span>
                <span />
              </div>
            )
          }
          const above = spyPrice > level
          return (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground w-16">{label}</span>
              <span className="text-[10px] tabular-nums font-medium">${level.toFixed(2)}</span>
              <span className={`text-[10px] font-bold px-1.5 py-px rounded-sm ${above ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'}`}>
                SPY {above ? `+$${(spyPrice - level).toFixed(0)}` : `-$${(level - spyPrice).toFixed(0)}`}
              </span>
            </div>
          )
        })}
      </div>

      {spyPrice !== null && (
        <div className="pt-2 border-t border-border/30 grid grid-cols-2 gap-x-3 gap-y-1">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-emerald-600 block mb-1">Support</span>
            {SUPPORT_LEVELS.map((lvl) => (
              <div key={lvl} className="flex items-center justify-between">
                <div className="h-1 flex-1 mr-2 rounded-full bg-emerald-500/20">
                  <div className="h-1 rounded-full bg-emerald-500" style={{ width: `${(lvl / spyPrice) * 100}%` }} />
                </div>
                <span className="text-[10px] tabular-nums font-medium">${lvl}</span>
              </div>
            ))}
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-red-500 block mb-1">Resistance</span>
            {RESISTANCE_LEVELS.map((lvl) => (
              <div key={lvl} className="flex items-center justify-between">
                <div className="h-1 flex-1 mr-2 rounded-full bg-red-500/20">
                  <div className="h-1 rounded-full bg-red-500" style={{ width: `${(spyPrice / lvl) * 100}%` }} />
                </div>
                <span className="text-[10px] tabular-nums font-medium">${lvl}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Technical Outlook</span>
        <span className={`text-[13px] font-bold ${SIGNAL_TEXT[outlook]}`}>{outlook.toUpperCase()}</span>
      </div>
    </div>
  )
}
