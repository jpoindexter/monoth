import { useIsExpanded } from '@/components/layout/PanelWrapper'
import { EventRow } from '@/components/panels/EconomicCalendarShared'
import { fmtDate, isToday, isWithinDays } from '@/components/panels/economic-calendar-utils'
import type { EconEvent } from '@/components/panels/economic-calendar-utils'

export default function EconomicCalendarUpcomingTab({ events }: { events: EconEvent[] }) {
  const expanded = useIsExpanded()
  const days = expanded ? 14 : 7
  const filtered = events
    .filter(e => isWithinDays(e.date, days))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const grouped: Record<string, EconEvent[]> = {}
  for (const e of filtered) {
    if (!grouped[e.date]) grouped[e.date] = []
    grouped[e.date]!.push(e)
  }

  if (filtered.length === 0) {
    return <div className="text-[10px] text-muted-foreground text-center py-4">No upcoming events</div>
  }

  return (
    <div className="space-y-2">
      {Object.entries(grouped).map(([date, evts]) => (
        <div key={date}>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
            {fmtDate(date)}
            {isToday(date) && (
              <span className="text-[9px] font-bold bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded-sm">TODAY</span>
            )}
          </div>
          <div className="space-y-0.5">
            {evts.map(e => <EventRow key={e.id} event={e} />)}
          </div>
        </div>
      ))}
    </div>
  )
}
