const CURRENT_FED_RATE = 4.25

const DOT_PLOT_DATA: { rate: number; members: number }[] = [
  { rate: 3.00, members: 1 },
  { rate: 3.25, members: 2 },
  { rate: 3.50, members: 4 },
  { rate: 3.75, members: 5 },
  { rate: 4.00, members: 4 },
  { rate: 4.25, members: 3 },
]

const DOT_PLOT_MEDIAN = (() => {
  const flat: number[] = []
  for (const d of DOT_PLOT_DATA) {
    for (let i = 0; i < d.members; i++) flat.push(d.rate)
  }
  flat.sort((a, b) => a - b)
  const mid = Math.floor(flat.length / 2)
  return flat.length % 2 === 0 ? (flat[mid - 1]! + flat[mid]!) / 2 : flat[mid]!
})() as number

export function CentralBanksDotPlotTab() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
        <span>19 FOMC members — end 2026 projections</span>
        <span className={`font-bold uppercase tracking-wider ${DOT_PLOT_MEDIAN <= CURRENT_FED_RATE ? 'text-emerald-500' : 'text-red-500'}`}>
          {DOT_PLOT_MEDIAN <= CURRENT_FED_RATE ? 'Dovish Lean' : 'Hawkish Lean'}
        </span>
      </div>
      <div className="space-y-1.5">
        {[...DOT_PLOT_DATA].reverse().map(({ rate, members }) => {
          const isMedian = rate === DOT_PLOT_MEDIAN
          return (
            <div key={rate} className="flex items-center gap-2">
              <span className={`text-[10px] tabular-nums w-10 shrink-0 font-medium ${isMedian ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {rate.toFixed(2)}%
              </span>
              <div className="flex gap-1 items-center flex-wrap">
                {Array.from({ length: members }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-3 h-3 rounded-full border-2 ${
                      isMedian
                        ? 'bg-amber-400 border-amber-500'
                        : rate === CURRENT_FED_RATE
                        ? 'bg-sky-400/60 border-sky-500'
                        : 'bg-foreground/30 border-foreground/50'
                    }`}
                  />
                ))}
              </div>
              {isMedian && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 ml-1">Median</span>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-2 pt-2 border-t border-border/20 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          Range:{' '}
          <span className="text-foreground font-medium tabular-nums">
            {Math.min(...DOT_PLOT_DATA.map((d) => d.rate)).toFixed(2)}%
            {' — '}
            {Math.max(...DOT_PLOT_DATA.map((d) => d.rate)).toFixed(2)}%
          </span>
        </span>
        <span>
          Current:{' '}
          <span className="text-sky-400 font-medium tabular-nums">{CURRENT_FED_RATE.toFixed(2)}%</span>
        </span>
        <span>
          Median:{' '}
          <span className="text-amber-500 font-medium tabular-nums">{DOT_PLOT_MEDIAN.toFixed(2)}%</span>
        </span>
      </div>
    </div>
  )
}
