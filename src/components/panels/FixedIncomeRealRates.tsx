interface RealRate {
  maturity: string
  nominal: number | null
  real: number | null
  breakeven: number | null
}

export function FixedIncomeRealRates({
  realRates,
  loading,
}: {
  realRates: RealRate[] | null
  loading: boolean
}) {
  if (loading) {
    return <div className="py-4 text-center text-[10px] text-muted-foreground">Loading...</div>
  }

  if (!realRates) return null

  const validReals = realRates.filter((r) => r.real != null).map((r) => r.real as number)
  const avgReal = validReals.length ? validReals.reduce((s, v) => s + v, 0) / validReals.length : 0
  const regime = avgReal > 2 ? 'RESTRICTIVE' : avgReal >= 0 ? 'NEUTRAL' : 'ACCOMMODATIVE'
  const regimeColor =
    regime === 'RESTRICTIVE'   ? 'bg-red-500/15 text-red-500' :
    regime === 'ACCOMMODATIVE' ? 'bg-emerald-600/15 text-emerald-600' :
    'bg-amber-500/15 text-amber-500'
  const maxNominal = Math.max(...realRates.map((r) => r.nominal ?? 0))

  return (
    <div>
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/20">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Real Rate Regime</span>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${regimeColor}`}>{regime}</span>
      </div>
      <div className="space-y-2">
        {realRates.map((r) => {
          const nom = r.nominal ?? 0
          const real = r.real ?? 0
          const nomPct = maxNominal > 0 ? (nom / maxNominal) * 100 : 0
          const realPct = maxNominal > 0 ? (real / maxNominal) * 100 : 0
          return (
            <div key={r.maturity} className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-medium">{r.maturity}</span>
                <span className="text-muted-foreground tabular-nums">
                  {r.nominal != null ? `Nom ${r.nominal.toFixed(2)}%` : '—'}
                  {r.real != null ? ` / Real ${r.real.toFixed(2)}%` : ''}
                  {r.breakeven != null ? ` / BE ${r.breakeven.toFixed(2)}%` : ''}
                </span>
              </div>
              <div className="relative h-3 bg-border/20 rounded-sm overflow-hidden">
                <div className="absolute left-0 top-0 h-full rounded-sm bg-foreground/20" style={{ width: `${nomPct}%` }} />
                <div className="absolute left-0 top-0 h-full rounded-sm bg-amber-500" style={{ width: `${realPct}%` }} />
              </div>
              <div className="flex gap-3 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-1 rounded-sm bg-foreground/20" />Nominal</span>
                <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-1 rounded-sm bg-amber-500" />Real</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 pt-2 border-t border-border/20">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          RESTRICTIVE above 2%, NEUTRAL 0-2%, ACCOMMODATIVE below 0%.
        </p>
      </div>
    </div>
  )
}
