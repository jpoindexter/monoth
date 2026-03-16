interface ImpactScore {
  sector: string
  score: number
}

interface Props {
  impactScores: ImpactScore[]
  avgPressure: number
}

export function RegulationImpact({ impactScores, avgPressure }: Props) {
  const climate: { label: string; cls: string } = avgPressure >= 6
    ? { label: 'RESTRICTIVE', cls: 'text-red-500' }
    : avgPressure >= 3
    ? { label: 'NEUTRAL', cls: 'text-amber-500' }
    : { label: 'PERMISSIVE', cls: 'text-emerald-500' }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Regulatory Climate</span>
        <span className={`text-[10px] font-bold tracking-wider ${climate.cls}`}>{climate.label}</span>
      </div>
      {impactScores.map(({ sector, score }) => {
        const barColor = score >= 7 ? 'bg-red-500' : score >= 4 ? 'bg-amber-500' : 'bg-emerald-500'
        const pct = Math.round((score / 10) * 100)
        return (
          <div key={sector}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-medium text-foreground">{sector}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{score.toFixed(1)}/10</span>
            </div>
            <div className="h-1.5 w-full bg-border/20 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
      <p className="text-[10px] text-muted-foreground mt-2 leading-snug">
        Scores derived from recent news volume. Higher = more regulatory activity.
      </p>
    </div>
  )
}
