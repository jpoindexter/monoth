import { EventRow } from '@/components/panels/EconomicCalendarShared'
import type { EconEvent } from '@/components/panels/economic-calendar-utils'

export default function EconomicCalendarTodayTab({ events }: { events: EconEvent[] }) {
  const today = new Date().toISOString().slice(0, 10)
  const filtered = events
    .filter(e => e.date === today)
    .sort((a, b) => a.time.localeCompare(b.time))

  if (filtered.length === 0) {
    return <div className="text-[10px] text-muted-foreground text-center py-4">No events today</div>
  }

  return (
    <div className="space-y-0.5">
      {filtered.map(e => <EventRow key={e.id} event={e} showCountdown />)}
    </div>
  )
}
