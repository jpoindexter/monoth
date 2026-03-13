import { useState, useCallback, useEffect } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { useMacroData } from '@/hooks/use-macro-data'
import { usePolling } from '@/hooks/use-polling'
import type { FredSeries } from '@/services/api/macro'

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

interface SurpriseEntry {
  name: string
  actual: string
  estimate: string
  direction: 'beat' | 'miss' | 'inline'
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

const SURPRISE_DATA: SurpriseEntry[] = [
  { name: 'NFP', actual: '275K', estimate: '200K', direction: 'beat' },
  { name: 'CPI (YoY)', actual: '3.2%', estimate: '3.4%', direction: 'beat' },
  { name: 'GDP (Q4)', actual: '2.1%', estimate: '2.4%', direction: 'miss' },
  { name: 'Retail Sales', actual: '-0.8%', estimate: '-0.3%', direction: 'miss' },
  { name: 'ISM Mfg', actual: '47.8', estimate: '47.5', direction: 'beat' },
  { name: 'ISM Services', actual: '52.6', estimate: '53.0', direction: 'miss' },
  { name: 'PPI (MoM)', actual: '0.3%', estimate: '0.3%', direction: 'inline' },
  { name: 'Jobless Claims', actual: '217K', estimate: '225K', direction: 'beat' },
  { name: 'Housing Starts', actual: '1.42M', estimate: '1.46M', direction: 'miss' },
  { name: 'Consumer Sentiment', actual: '79.8', estimate: '78.0', direction: 'beat' },
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

const trendIcon = (value: number, previous: number) => {
  if (value > previous) return <span className="text-emerald-500 text-[10px] font-bold ml-0.5">↑</span>
  if (value < previous) return <span className="text-red-500 text-[10px] font-bold ml-0.5">↓</span>
  return <span className="text-muted-foreground text-[10px] ml-0.5">—</span>
}

// --- Trends helpers ---

function computeHealthScore(data: FredSeries[]): { score: number; label: 'EXPANSION' | 'SLOWDOWN' | 'CONTRACTION' } {
  let score = 50 // baseline

  // GDP growth: GDPC1 or A191RL1Q225SBEA or any series with GDP in name
  const gdp = data.find((s) =>
    s.seriesId === 'A191RL1Q225SBEA' ||
    s.seriesId === 'GDPC1' ||
    s.name.toLowerCase().includes('gdp')
  )
  if (gdp) {
    if (gdp.value > 3) score += 20
    else if (gdp.value > 1.5) score += 12
    else if (gdp.value > 0) score += 5
    else score -= 10
  }

  // Unemployment: UNRATE — lower is better
  const unrate = data.find((s) =>
    s.seriesId === 'UNRATE' ||
    s.name.toLowerCase().includes('unemployment')
  )
  if (unrate) {
    if (unrate.value < 4) score += 20
    else if (unrate.value < 5) score += 10
    else if (unrate.value < 6) score += 2
    else score -= 10
  }

  // Inflation: CPIAUCSL or CPILFESL — near 2% is good
  const cpi = data.find((s) =>
    s.seriesId === 'CPIAUCSL' ||
    s.seriesId === 'CPILFESL' ||
    s.name.toLowerCase().includes('cpi') ||
    s.name.toLowerCase().includes('inflation')
  )
  if (cpi) {
    const dist = Math.abs(cpi.value - 2)
    if (dist < 0.5) score += 20
    else if (dist < 1) score += 10
    else if (dist < 2) score += 2
    else score -= 8
  }

  const clamped = Math.max(0, Math.min(100, score))
  const label =
    clamped >= 65 ? 'EXPANSION' :
    clamped >= 40 ? 'SLOWDOWN' :
    'CONTRACTION'

  return { score: clamped, label }
}

function rangePosition(value: number, min: number, max: number): number {
  if (max === min) return 50
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
}

// Rough historical ranges for common FRED series
const KNOWN_RANGES: Record<string, { min: number; max: number; avgLabel: string }> = {
  UNRATE:           { min: 3.4, max: 14.7, avgLabel: 'avg ~5%' },
  CPIAUCSL:         { min: -0.5, max: 9.1,  avgLabel: 'avg ~2%' },
  CPILFESL:         { min: 0.5, max: 6.6,   avgLabel: 'avg ~2%' },
  A191RL1Q225SBEA:  { min: -32, max: 7.4,   avgLabel: 'avg ~2.5%' },
  GDPC1:            { min: 14000, max: 23000, avgLabel: 'growth trend' },
  DGS10:            { min: 0.5, max: 5.0,   avgLabel: 'avg ~3%' },
  DGS2:             { min: 0.1, max: 5.3,   avgLabel: 'avg ~2.5%' },
  FEDFUNDS:         { min: 0, max: 5.5,     avgLabel: 'avg ~2%' },
  PAYEMS:           { min: 128000, max: 160000, avgLabel: 'growth trend' },
}

function getRange(s: FredSeries): { min: number; max: number; avg: number } {
  const known = KNOWN_RANGES[s.seriesId]
  if (known) return { min: known.min, max: known.max, avg: (known.min + known.max) / 2 }
  // Fallback: infer from value and previous
  const lo = Math.min(s.value, s.previous) * 0.85
  const hi = Math.max(s.value, s.previous) * 1.15
  return { min: lo, max: hi, avg: (lo + hi) / 2 }
}

function aboveAvgLabel(value: number, avg: number, seriesId: string): { text: string; cls: string } {
  // For unemployment, lower is better
  const invertedSeries = ['UNRATE']
  const isInverted = invertedSeries.includes(seriesId)

  if (value > avg) {
    return isInverted
      ? { text: 'Above Avg', cls: 'text-red-500' }
      : { text: 'Above Avg', cls: 'text-emerald-500' }
  } else if (value < avg) {
    return isInverted
      ? { text: 'Below Avg', cls: 'text-emerald-500' }
      : { text: 'Below Avg', cls: 'text-red-500' }
  }
  return { text: 'At Avg', cls: 'text-muted-foreground' }
}

function TrendsTab({ data, expanded }: { data: FredSeries[]; expanded: boolean }) {
  const { score, label } = computeHealthScore(data)

  const scoreColor =
    label === 'EXPANSION' ? 'text-emerald-500' :
    label === 'SLOWDOWN' ? 'text-amber-400' :
    'text-red-500'

  const barColor =
    label === 'EXPANSION' ? 'bg-emerald-500' :
    label === 'SLOWDOWN' ? 'bg-amber-400' :
    'bg-red-500'

  return (
    <div className="space-y-3">
      {/* Health Score card */}
      <div className="rounded-md border border-border/30 bg-muted/20 px-3 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Economic Health</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${scoreColor}`}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-border/40 overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
          </div>
          <span className={`text-[11px] font-bold tabular-nums ${scoreColor}`}>{score}</span>
        </div>
      </div>

      {/* Per-indicator bars */}
      <div className="space-y-2">
        {data.map((s) => {
          const range = getRange(s)
          const pos = rangePosition(s.value, range.min, range.max)
          const aa = aboveAvgLabel(s.value, range.avg, s.seriesId)
          return (
            <div key={s.seriesId}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={`font-medium text-foreground ${expanded ? 'text-[12px]' : 'text-[11px] truncate max-w-[120px]'}`}>{s.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-medium ${aa.cls}`}>{aa.text}</span>
                  <span className={`tabular-nums text-foreground ${expanded ? 'text-[13px] font-bold' : 'text-[11px]'}`}>{s.value.toFixed(2)}</span>
                </div>
              </div>
              {/* horizontal range bar */}
              <div className="relative h-1 rounded-full bg-border/40 overflow-visible">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-foreground border border-background"
                  style={{ left: `calc(${pos}% - 3px)` }}
                />
                {/* midpoint marker */}
                <div className="absolute left-1/2 top-0 w-px h-full bg-border/60" />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] text-muted-foreground/60 tabular-nums">{range.min.toFixed(1)}</span>
                <span className="text-[9px] text-muted-foreground/60 tabular-nums">{range.max.toFixed(1)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SurprisesTab() {
  const beats = SURPRISE_DATA.filter((d) => d.direction === 'beat').length
  const misses = SURPRISE_DATA.filter((d) => d.direction === 'miss').length
  const net = beats - misses
  const bias = net > 0 ? 'HAWKISH' : net < 0 ? 'DOVISH' : 'NEUTRAL'
  const biasColor = net > 0 ? 'text-red-500' : net < 0 ? 'text-emerald-500' : 'text-muted-foreground'

  return (
    <div className="space-y-3">
      {/* Surprise Index card */}
      <div className="rounded-md border border-border/30 bg-muted/20 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Surprise Index</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${biasColor}`}>{bias}</span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] text-emerald-500 font-medium">{beats} beats</span>
          <span className="text-[10px] text-muted-foreground">vs</span>
          <span className="text-[10px] text-red-500 font-medium">{misses} misses</span>
          <span className="text-[10px] text-muted-foreground/60 ml-auto">net {net > 0 ? '+' : ''}{net}</span>
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-0.5">
        {SURPRISE_DATA.map((entry) => {
          const dotCls =
            entry.direction === 'beat' ? 'bg-emerald-500' :
            entry.direction === 'miss' ? 'bg-red-500' :
            'bg-muted-foreground/40'
          const valCls =
            entry.direction === 'beat' ? 'text-emerald-500' :
            entry.direction === 'miss' ? 'text-red-500' :
            'text-muted-foreground'
          const label =
            entry.direction === 'beat' ? 'BEAT' :
            entry.direction === 'miss' ? 'MISS' :
            'IN-LINE'

          return (
            <div key={entry.name} className="flex items-center gap-1.5 border-t border-border/15 pt-1">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCls}`} />
              <span className="text-[11px] font-medium text-foreground w-[90px] shrink-0 truncate">{entry.name}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums flex-1">
                A: {entry.actual} <span className="text-muted-foreground/50">/ E: {entry.estimate}</span>
              </span>
              <span className={`text-[9px] font-bold uppercase px-1 rounded-sm bg-muted ${valCls} shrink-0`}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function EconomicDataPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'indicators' | 'calendar' | 'trends' | 'surprises'>('indicators')
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
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const calEvents: DayGroup[] =
    calData && calData.length > 0 ? groupByDay(calData) : STATIC_EVENTS

  return (
    <PanelWrapper title="Economic Data" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'indicators')} onClick={() => setTab('indicators')}>Indicators</button>
        <button className={tabCls(tab === 'calendar')} onClick={() => setTab('calendar')}>Calendar</button>
        <button className={tabCls(tab === 'trends')} onClick={() => setTab('trends')}>Trends</button>
        <button className={tabCls(tab === 'surprises')} onClick={() => setTab('surprises')}>Surprises</button>
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
                  <td className={`py-1 font-medium flex items-center ${expanded ? 'text-[12px]' : ''}`}>
                    {series.name}
                    {trendIcon(series.value, series.previous)}
                  </td>
                  <td className={`text-right tabular-nums ${expanded ? 'text-[13px] font-bold' : ''}`}>{series.value.toFixed(2)}</td>
                  <td className="text-right tabular-nums text-muted-foreground">{series.previous.toFixed(2)}</td>
                  <td className={`text-right tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'} ${expanded ? 'text-[12px]' : ''}`}>
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
      )}

      {tab === 'trends' && !loading && data && !!data.length && (
        <TrendsTab data={data} expanded={expanded} />
      )}

      {tab === 'trends' && !loading && data != null && !data.length && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">
          No data available for trends.
        </div>
      )}

      {tab === 'surprises' && <SurprisesTab />}
    </PanelWrapper>
  )
}
