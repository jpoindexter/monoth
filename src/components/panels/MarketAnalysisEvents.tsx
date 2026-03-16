interface CorrelationEvent {
  event: string
  actual: number
  estimate: number
  surprise: number
  date: string
}

interface Props {
  events: CorrelationEvent[] | null
  evLoading: boolean
  expanded: boolean
}

export function MarketAnalysisEvents({ events, evLoading, expanded }: Props) {
  return (
    <div className="space-y-0">
      {events?.slice(0, expanded ? 30 : 15).map((ev, i) => {
        const isPositive = ev.surprise > 0
        return (
          <div key={`${ev.event}-${i}`} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
            <div className="flex-1 min-w-0">
              <span className={`font-medium block ${expanded ? 'text-[13px]' : 'text-[11px] truncate'}`}>{ev.event}</span>
              <span className="text-[10px] text-muted-foreground">{ev.date}</span>
            </div>
            <div className="text-right shrink-0 ml-2">
              <span className="text-[10px] tabular-nums text-muted-foreground">
                Est {ev.estimate.toFixed(2)} / Act {ev.actual.toFixed(2)}
              </span>
              <span className={`ml-1.5 text-[10px] tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{ev.surprise.toFixed(2)}
              </span>
            </div>
          </div>
        )
      })}
      {!events?.length && !evLoading && (
        <p className="text-[10px] text-muted-foreground">No recent economic events</p>
      )}
    </div>
  )
}
