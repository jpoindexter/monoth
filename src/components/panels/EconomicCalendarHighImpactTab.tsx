import { useIsExpanded } from '@/components/layout/PanelWrapper'
import { IMPACT_BG, fmtDate, isWithinDays } from '@/components/panels/economic-calendar-utils'
import type { EconEvent } from '@/components/panels/economic-calendar-utils'

export default function EconomicCalendarHighImpactTab({ events }: { events: EconEvent[] }) {
  const expanded = useIsExpanded()
  const filtered = events
    .filter(e => e.impact === 'high' && isWithinDays(e.date, 14))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const rows = expanded ? filtered : filtered.slice(0, 10)

  if (rows.length === 0) {
    return <div className="text-[10px] text-muted-foreground text-center py-4">No high-impact events in next 2 weeks</div>
  }

  return (
    <div className="space-y-0.5">
      {rows.map(e => (
        <div key={e.id} className={`px-1.5 py-1 rounded-sm ${IMPACT_BG[e.impact]}`}>
          <div className="flex items-center justify-between gap-1">
            <div className="min-w-0">
              <div className="text-[10px] font-medium text-foreground truncate">{e.event}</div>
              <div className="text-[10px] text-muted-foreground">
                {fmtDate(e.date)} · {e.time} ET · {e.country}
              </div>
            </div>
            <div className="shrink-0 text-right">
              {e.actual ? (
                <span className="text-[10px] font-bold tabular-nums text-red-400">{e.actual}</span>
              ) : (
                <div className="text-[10px] text-muted-foreground">
                  {e.estimate ? `Est: ${e.estimate}` : 'TBD'}
                </div>
              )}
            </div>
          </div>
          {expanded && (e.estimate || e.previous) && (
            <div className="flex gap-3 mt-0.5 pl-0">
              {e.estimate && (
                <div className="text-[10px] text-muted-foreground">
                  Est: <span className="text-foreground/70">{e.estimate}</span>
                </div>
              )}
              {e.previous && (
                <div className="text-[10px] text-muted-foreground">
                  Prev: <span className="text-foreground/70">{e.previous}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
