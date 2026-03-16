import { useIsExpanded } from '@/components/layout/PanelWrapper'

interface DayGroup {
  day: string
  events: { time: string; name: string; impact: string; country: string }[]
}

interface CalendarEvent {
  country: string
  event: string
  actual: number | null
  estimate: number | null
  prev: number | null
  impact: string
  time: string
}

const STATIC_EVENTS: DayGroup[] = [
  {
    day: 'Today',
    events: [
      { time: '8:30 AM', name: 'Initial Jobless Claims', impact: 'medium', country: 'US' },
      { time: '10:00 AM', name: 'Existing Home Sales', impact: 'medium', country: 'US' },
    ],
  },
  {
    day: 'Tomorrow',
    events: [
      { time: '8:30 AM', name: 'GDP (Q1 Revision)', impact: 'high', country: 'US' },
      { time: '10:00 AM', name: 'Consumer Sentiment', impact: 'medium', country: 'US' },
    ],
  },
  {
    day: 'Monday',
    events: [
      { time: '9:45 AM', name: 'PMI Manufacturing', impact: 'high', country: 'US' },
      { time: '2:00 AM', name: 'PMI Manufacturing', impact: 'high', country: 'EU' },
    ],
  },
]

function groupByDay(events: CalendarEvent[]): DayGroup[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const labelFor = (dateStr: string): string => {
    if (!dateStr) return 'Upcoming'
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tomorrow'
    if (diff < 0) return 'Past'
    return d.toLocaleDateString('en-US', { weekday: 'long' })
  }

  const map = new Map<string, DayGroup>()
  for (const evt of events) {
    const label = labelFor(evt.time?.split('T')[0] ?? '')
    if (!map.has(label)) map.set(label, { day: label, events: [] })
    map.get(label)!.events.push({
      time: evt.time ? new Date(evt.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '--',
      name: evt.event,
      impact: evt.impact ?? 'low',
      country: evt.country,
    })
  }
  return Array.from(map.values())
}

const impactDot = (impact: string) => {
  if (impact === 'high') return 'bg-red-500'
  if (impact === 'medium') return 'bg-amber-400'
  return 'bg-muted-foreground/40'
}

export function EconomicDataCalendar({
  calData,
  loading,
}: {
  calData: CalendarEvent[] | null
  loading: boolean
}) {
  const expanded = useIsExpanded()

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
  }

  const groups = calData && calData.length > 0 ? groupByDay(calData) : STATIC_EVENTS

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.day}>
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
            {group.day}
          </div>
          <div className="space-y-0.5">
            {group.events.map((evt, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${impactDot(evt.impact)}`} />
                <span className="text-[11px] text-muted-foreground tabular-nums w-16 shrink-0">{evt.time}</span>
                <span className={`text-[11px] text-foreground flex-1 ${expanded ? '' : 'truncate'}`}>{evt.name}</span>
                <span className="text-[9px] font-bold uppercase px-1 rounded-sm bg-muted text-muted-foreground shrink-0">
                  {evt.country}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
