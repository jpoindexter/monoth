interface DominanceData {
  fearGreed: {
    value: number
    classification: string
    history: { value: number; classification: string; date: string }[]
  }
  dominance: {
    btc: number
    eth: number
    stable: number
    other: number
  }
}

export function CryptoDominance({ data }: { data: DominanceData | null }) {
  const dom = data?.dominance
  const fg = data?.fearGreed
  const btcPct    = dom?.btc    ?? 0
  const ethPct    = dom?.eth    ?? 0
  const stablePct = dom?.stable ?? 0
  const otherPct  = dom?.other  ?? 0

  const fgValue = fg?.value ?? null
  const fgLabel = fg?.classification?.toUpperCase() ?? '—'
  const fgColor =
    fgLabel === 'FEAR' || fgLabel === 'EXTREME FEAR'
      ? 'text-red-500'
      : fgLabel === 'GREED' || fgLabel === 'EXTREME GREED'
        ? 'text-emerald-500'
        : 'text-yellow-500'

  const segments = [
    { label: 'BTC',    pct: btcPct,    color: 'bg-orange-500' },
    { label: 'ETH',    pct: ethPct,    color: 'bg-blue-500'   },
    { label: 'Stable', pct: stablePct, color: 'bg-emerald-500'},
    { label: 'Other',  pct: otherPct,  color: 'bg-zinc-500'   },
  ]

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Fear &amp; Greed Index</span>
        <span className={`text-[11px] font-bold ${fgColor}`}>
          {fgValue !== null ? `${fgValue} ` : ''}{fgLabel}
        </span>
      </div>

      <div className="flex h-3 w-full rounded-sm overflow-hidden">
        {segments.map((s) => (
          <div key={s.label} className={`${s.color} h-full`} style={{ width: `${s.pct}%` }} />
        ))}
      </div>

      <div className="space-y-1">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-sm ${s.color}`} />
              <span className="text-[10px] text-foreground">{s.label}</span>
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground">{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 text-[10px]">
        <span className="text-muted-foreground">BTC dominance</span>
        <span className={`font-medium ${btcPct > 50 ? 'text-amber-500' : 'text-muted-foreground'}`}>
          {btcPct.toFixed(1)}%
        </span>
        <span className={btcPct > 50 ? 'text-amber-500' : 'text-muted-foreground'}>
          {btcPct > 50 ? '▲' : '▼'}
        </span>
      </div>
    </div>
  )
}
