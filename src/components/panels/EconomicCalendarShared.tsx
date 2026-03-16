import { useState, useEffect } from 'react'

export type Impact = 'high' | 'medium' | 'low'

export interface EconEvent {
  id: string
  event: string
  country: string
  date: string
  time: string
  actual: string | null
  estimate: string | null
  previous: string | null
  impact: Impact
}

export function buildMockEvents(): EconEvent[] {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  function addDays(base: string, n: number): string {
    const d = new Date(base)
    d.setDate(d.getDate() + n)
    return d.toISOString().slice(0, 10)
  }

  const pastHour = now.getHours() > 9

  return [
    { id: 'cpi-1', event: 'CPI (YoY)', country: 'US', date: today, time: '08:30', actual: pastHour ? '3.2%' : null, estimate: '3.1%', previous: '3.4%', impact: 'high' },
    { id: 'claims-1', event: 'Initial Jobless Claims', country: 'US', date: today, time: '08:30', actual: pastHour ? '218K' : null, estimate: '222K', previous: '225K', impact: 'medium' },
    { id: 'ppi-1', event: 'PPI (MoM)', country: 'US', date: addDays(today, 1), time: '08:30', actual: null, estimate: '0.2%', previous: '0.3%', impact: 'medium' },
    { id: 'retail-1', event: 'Retail Sales (MoM)', country: 'US', date: addDays(today, 2), time: '08:30', actual: null, estimate: '0.4%', previous: '-0.1%', impact: 'high' },
    { id: 'indprod-1', event: 'Industrial Production', country: 'US', date: addDays(today, 2), time: '09:15', actual: null, estimate: '0.1%', previous: '0.0%', impact: 'medium' },
    { id: 'ecb-1', event: 'ECB Interest Rate Decision', country: 'EU', date: addDays(today, 3), time: '07:45', actual: null, estimate: '3.75%', previous: '4.00%', impact: 'high' },
    { id: 'housing-1', event: 'Housing Starts', country: 'US', date: addDays(today, 4), time: '08:30', actual: null, estimate: '1.38M', previous: '1.35M', impact: 'medium' },
    { id: 'fomc-1', event: 'FOMC Meeting Minutes', country: 'US', date: addDays(today, 5), time: '14:00', actual: null, estimate: null, previous: null, impact: 'high' },
    { id: 'nfp-1', event: 'Non-Farm Payrolls', country: 'US', date: addDays(today, 7), time: '08:30', actual: null, estimate: '185K', previous: '199K', impact: 'high' },
    { id: 'unemp-1', event: 'Unemployment Rate', country: 'US', date: addDays(today, 7), time: '08:30', actual: null, estimate: '3.8%', previous: '3.7%', impact: 'high' },
    { id: 'pce-1', event: 'Core PCE Price Index (YoY)', country: 'US', date: addDays(today, 8), time: '08:30', actual: null, estimate: '2.7%', previous: '2.9%', impact: 'high' },
    { id: 'ism-1', event: 'ISM Manufacturing PMI', country: 'US', date: addDays(today, 9), time: '10:00', actual: null, estimate: '49.8', previous: '49.1', impact: 'high' },
    { id: 'gdp-1', event: 'GDP Growth Rate (QoQ)', country: 'US', date: addDays(today, 10), time: '08:30', actual: null, estimate: '2.1%', previous: '2.8%', impact: 'high' },
    { id: 'conf-1', event: 'Consumer Confidence', country: 'US', date: addDays(today, 11), time: '10:00', actual: null, estimate: '102.5', previous: '99.8', impact: 'medium' },
    { id: 'boe-1', event: 'BoE Interest Rate Decision', country: 'UK', date: addDays(today, 12), time: '07:00', actual: null, estimate: '5.00%', previous: '5.25%', impact: 'high' },
    { id: 'fomc-rate', event: 'FOMC Rate Decision', country: 'US', date: addDays(today, 13), time: '14:00', actual: null, estimate: '5.25%', previous: '5.50%', impact: 'high' },
    { id: 'cpi-core', event: 'Core CPI (MoM)', country: 'US', date: addDays(today, 14), time: '08:30', actual: null, estimate: '0.3%', previous: '0.3%', impact: 'high' },
  ]
}

export const IMPACT_COLOR: Record<Impact, string> = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-muted-foreground',
}

export const IMPACT_BG: Record<Impact, string> = {
  high: 'bg-red-500/10',
  medium: 'bg-amber-500/10',
  low: 'bg-foreground/5',
}

export const IMPACT_DOT: Record<Impact, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-muted-foreground/40',
}

export function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10)
}

export function isWithinDays(dateStr: string, days: number): boolean {
  const now = Date.now()
  const target = new Date(dateStr + 'T00:00:00').getTime()
  return target >= now - 86_400_000 && target <= now + days * 86_400_000
}

function useCountdown(dateStr: string, timeStr: string): string {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    function calc() {
      const target = new Date(`${dateStr}T${timeStr}:00`)
      const diff = target.getTime() - Date.now()
      if (diff <= 0) return 'Released'
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      if (h > 0) return `${h}h ${m}m`
      if (m > 0) return `${m}m ${s}s`
      return `${s}s`
    }
    setDisplay(calc())
    const id = setInterval(() => setDisplay(calc()), 1000)
    return () => clearInterval(id)
  }, [dateStr, timeStr])

  return display
}

export function CountdownBadge({ date, time, released }: { date: string; time: string; released: boolean }) {
  const val = useCountdown(date, time)
  if (released) return null
  return (
    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-sm">
      {val}
    </span>
  )
}

export function EventRow({ event, showCountdown }: { event: EconEvent; showCountdown?: boolean }) {
  const released = event.actual != null
  return (
    <div className={`px-1.5 py-1 rounded-sm ${IMPACT_BG[event.impact]}`}>
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 ${IMPACT_DOT[event.impact]}`} />
          <div className="min-w-0">
            <div className="text-[10px] font-medium text-foreground leading-tight truncate">{event.event}</div>
            <div className="text-[10px] text-muted-foreground">
              {event.country} · {event.time} ET
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0 gap-0.5">
          {showCountdown && !released && (
            <CountdownBadge date={event.date} time={event.time} released={released} />
          )}
          {released && (
            <span className={`text-[10px] font-bold tabular-nums ${IMPACT_COLOR[event.impact]}`}>
              {event.actual}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-3 mt-0.5 pl-3">
        {event.estimate && (
          <div className="text-[10px] text-muted-foreground">
            Est: <span className="text-foreground/70">{event.estimate}</span>
          </div>
        )}
        {event.previous && (
          <div className="text-[10px] text-muted-foreground">
            Prev: <span className="text-foreground/70">{event.previous}</span>
          </div>
        )}
      </div>
    </div>
  )
}
