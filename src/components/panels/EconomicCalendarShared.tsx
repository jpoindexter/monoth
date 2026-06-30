import { useState, useEffect } from 'react'
import { IMPACT_COLOR, IMPACT_BG, IMPACT_DOT } from '@/components/panels/economic-calendar-utils'
import type { EconEvent } from '@/components/panels/economic-calendar-utils'

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
