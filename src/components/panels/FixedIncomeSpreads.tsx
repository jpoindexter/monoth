interface SpreadRow {
  label: string
  value: number
  signal: string
}

export function FixedIncomeSpreads({ spreads }: { spreads: SpreadRow[] }) {
  return (
    <div className="space-y-1.5">
      {spreads.map((s) => {
        const isNeg = s.value < 0
        return (
          <div key={s.label} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
            <div>
              <span className="text-[11px] font-medium">{s.label}</span>
              <span className={`ml-2 text-[10px] font-medium uppercase tracking-wider ${
                s.signal === 'Inverted' ? 'text-red-500' : s.signal === 'Flat' ? 'text-amber-500' : 'text-emerald-600'
              }`}>{s.signal}</span>
            </div>
            <span className={`text-[11px] tabular-nums font-medium ${isNeg ? 'text-red-500' : 'text-emerald-600'}`}>
              {s.value > 0 ? '+' : ''}{(s.value * 100).toFixed(0)} bps
            </span>
          </div>
        )
      })}
      {spreads.length === 0 && (
        <p className="text-[10px] text-muted-foreground">Loading yield data...</p>
      )}
      <div className="mt-2 pt-2 border-t border-border/20">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Inverted curves (negative spread) historically signal recession risk.
          The 10Y-2Y spread is the most widely watched recession indicator.
        </p>
      </div>
    </div>
  )
}
