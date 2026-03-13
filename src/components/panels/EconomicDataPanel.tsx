import { useState, useCallback, useEffect } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useMacroData } from '@/hooks/use-macro-data'
import { usePolling } from '@/hooks/use-polling'

interface CalendarEvent {
  country: string
  event: string
  actual: number | null
  estimate: number | null
  prev: number | null
  impact: string
  time: string
}

interface DayGroup {
  day: string
  events: { time: string; name: string; impact: string; country: string }[]
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
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

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

const trendIcon = (value: number, previous: number) => {
  if (value > previous) return <span className="text-emerald-500 text-[10px] font-bold ml-0.5">↑</span>
  if (value < previous) return <span className="text-red-500 text-[10px] font-bold ml-0.5">↓</span>
  return <span className="text-muted-foreground text-[10px] ml-0.5">—</span>
}

export default function EconomicDataPanel() {
  const [tab, setTab] = useState<'indicators' | 'calendar'>('indicators')
  const { data, loading, error, refresh } = useMacroData()

  const { data: calData, loading: calLoading } = usePolling<CalendarEvent[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/macro/calendar')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 300_000,
    enabled: tab === 'calendar',
  })

  useEffect(() => {
    if (!loading && data != null && !data.length && tab === 'indicators') {
      setTab('calendar')
    }
  }, [loading, data, tab])

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const calEvents: DayGroup[] =
    calData && calData.length > 0 ? groupByDay(calData) : STATIC_EVENTS

  return (
    <PanelWrapper title="Economic Data" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'indicators')} onClick={() => setTab('indicators')}>Indicators</button>
        <button className={tabCls(tab === 'calendar')} onClick={() => setTab('calendar')}>Calendar</button>
      </div>

      {tab === 'indicators' && !loading && data != null && !data.length && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">
          No data available. Refreshes automatically.
        </div>
      )}

      {tab === 'indicators' && data && !!data.length && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Indicator</th>
              <th className="text-right font-medium pb-1.5">Latest</th>
              <th className="text-right font-medium pb-1.5">Prev</th>
              <th className="text-right font-medium pb-1.5">Chg</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((series) => {
              const diff = series.value - series.previous
              const isPositive = diff >= 0
              return (
                <tr key={series.seriesId} className="border-t border-border/20">
                  <td className="py-1 font-medium flex items-center">
                    {series.name}
                    {trendIcon(series.value, series.previous)}
                  </td>
                  <td className="text-right tabular-nums">{series.value.toFixed(2)}</td>
                  <td className="text-right tabular-nums text-muted-foreground">{series.previous.toFixed(2)}</td>
                  <td className={`text-right tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{diff.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'calendar' && calLoading && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
      )}

      {tab === 'calendar' && !calLoading && (
        <div className="space-y-3">
          {calEvents.map((group) => (
            <div key={group.day}>
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                {group.day}
              </div>
              <div className="space-y-0.5">
                {group.events.map((evt, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${impactDot(evt.impact)}`} />
                    <span className="text-[11px] text-muted-foreground tabular-nums w-16 shrink-0">{evt.time}</span>
                    <span className="text-[11px] text-foreground flex-1 truncate">{evt.name}</span>
                    <span className="text-[8px] font-bold uppercase px-1 rounded-sm bg-muted text-muted-foreground shrink-0">
                      {evt.country}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelWrapper>
  )
}
