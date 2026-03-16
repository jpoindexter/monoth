interface RegimeData {
  avg: number
  regime: 'RISK-ON' | 'RISK-OFF' | 'TRANSITIONAL'
  highest: { a: string; b: string; val: number }
  lowest: { a: string; b: string; val: number }
  divScore: number
}

interface Props {
  regime: RegimeData
  regimeBadgeCls: string
  isLive: boolean
  liveAsOf?: string
  activeAssetsCount: number
}

export function CorrelationRegimeTab({ regime, regimeBadgeCls, isLive, liveAsOf, activeAssetsCount }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold tracking-widest px-2 py-0.5 rounded-sm ${regimeBadgeCls}`}>
          {regime.regime}
        </span>
        <span className="text-[10px] text-muted-foreground">
          avg |corr| = <span className="text-foreground font-semibold tabular-nums">{regime.avg.toFixed(3)}</span>
        </span>
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
          <span>0.0 — independent</span>
          <span>1.0 — panic</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${regime.avg < 0.4 ? 'bg-emerald-500' : regime.avg > 0.6 ? 'bg-red-500' : 'bg-amber-400'}`}
            style={{ width: `${regime.avg * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-sm bg-muted/40 p-1.5">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Highest pair</div>
          <div className="text-[11px] font-semibold">{regime.highest.a} / {regime.highest.b}</div>
          <div className={`text-[10px] font-bold tabular-nums ${regime.highest.val >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
            {regime.highest.val >= 0 ? '+' : ''}{regime.highest.val.toFixed(2)}
          </div>
        </div>
        <div className="rounded-sm bg-muted/40 p-1.5">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Lowest pair</div>
          <div className="text-[11px] font-semibold">{regime.lowest.a} / {regime.lowest.b}</div>
          <div className={`text-[10px] font-bold tabular-nums ${regime.lowest.val >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
            {regime.lowest.val >= 0 ? '+' : ''}{regime.lowest.val.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="rounded-sm bg-muted/40 p-1.5">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Diversification Score</div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold tabular-nums leading-none">{regime.divScore}</span>
          <span className="text-[10px] text-muted-foreground mb-0.5">/ 100 — higher = better</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${regime.divScore >= 70 ? 'bg-emerald-500' : regime.divScore >= 40 ? 'bg-amber-400' : 'bg-red-500'}`}
            style={{ width: `${regime.divScore}%` }}
          />
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground">
        {isLive
          ? `Live · 6M Pearson · ${activeAssetsCount * (activeAssetsCount - 1) / 2} pairs`
          : 'Based on cross-asset static matrix — 10 unique pairs'}
      </div>
    </div>
  )
}
