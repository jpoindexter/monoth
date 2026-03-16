type Signal = 'bullish' | 'bearish' | 'neutral'

interface SentimentSource {
  name: string
  signal: Signal
}

interface RotationResult {
  cyclicalAvg: number
  defensiveAvg: number
  spread: number
}

const SIGNAL_COLORS: Record<Signal, string> = {
  bullish: 'bg-emerald-500',
  bearish: 'bg-red-500',
  neutral: 'bg-yellow-400',
}

const SIGNAL_TEXT: Record<Signal, string> = {
  bullish: 'text-emerald-600',
  bearish: 'text-red-500',
  neutral: 'text-yellow-500',
}

interface Props {
  sentimentSources: SentimentSource[]
  consensusScore: number
  consensusSignal: Signal
  consensusLabel: string
  rotationResult: RotationResult | null
}

export function MarketAnalysisSentiment({
  sentimentSources,
  consensusScore,
  consensusSignal,
  consensusLabel,
  rotationResult,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {sentimentSources.map((src) => (
          <div key={src.name} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{src.name}</span>
              <span className={`text-[10px] font-bold uppercase ${SIGNAL_TEXT[src.signal]}`}>{src.signal}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-border/30">
              <div className={`h-2 rounded-full ${SIGNAL_COLORS[src.signal]} transition-all`}
                style={{ width: src.signal === 'neutral' ? '50%' : src.signal === 'bullish' ? '80%' : '20%' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-border/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Consensus</span>
          <span className={`text-[13px] font-bold ${SIGNAL_TEXT[consensusSignal]}`}>{consensusLabel}</span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-border/30">
          <div className={`h-2 rounded-full ${SIGNAL_COLORS[consensusSignal]} transition-all`}
            style={{ width: `${Math.round(((consensusScore + 1) / 2) * 100)}%` }} />
        </div>
      </div>

      {rotationResult && (
        <div className="pt-2 border-t border-border/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sector Rotation</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
              rotationResult.spread > 0
                ? 'bg-emerald-500/15 text-emerald-600'
                : 'bg-red-500/15 text-red-500'
            }`}>
              {rotationResult.spread > 0 ? 'RISK-ON ROTATION' : 'RISK-OFF ROTATION'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Cyclical {rotationResult.cyclicalAvg >= 0 ? '+' : ''}{rotationResult.cyclicalAvg.toFixed(2)}%</span>
            <span className="tabular-nums">Spread {rotationResult.spread >= 0 ? '+' : ''}{rotationResult.spread.toFixed(2)}%</span>
            <span>Defensive {rotationResult.defensiveAvg >= 0 ? '+' : ''}{rotationResult.defensiveAvg.toFixed(2)}%</span>
          </div>
        </div>
      )}

      {!rotationResult && (
        <p className="text-[10px] text-muted-foreground pt-2 border-t border-border/30">Loading sector data...</p>
      )}
    </div>
  )
}
