import { useState, useEffect } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'

interface City {
  name: string
  timezone: string
  market: string
  openHour: number
  closeHour: number
  weekdays: boolean
}

const CITIES: City[] = [
  { name: 'New York', timezone: 'America/New_York', market: 'NYSE', openHour: 9.5, closeHour: 16, weekdays: true },
  { name: 'London', timezone: 'Europe/London', market: 'LSE', openHour: 8, closeHour: 16.5, weekdays: true },
  { name: 'Tokyo', timezone: 'Asia/Tokyo', market: 'TSE', openHour: 9, closeHour: 15, weekdays: true },
  { name: 'Hong Kong', timezone: 'Asia/Hong_Kong', market: 'HKEX', openHour: 9.5, closeHour: 16, weekdays: true },
  { name: 'Sydney', timezone: 'Australia/Sydney', market: 'ASX', openHour: 10, closeHour: 16, weekdays: true },
  { name: 'Frankfurt', timezone: 'Europe/Berlin', market: 'XETRA', openHour: 9, closeHour: 17.5, weekdays: true },
  { name: 'Singapore', timezone: 'Asia/Singapore', market: 'SGX', openHour: 9, closeHour: 17, weekdays: true },
  { name: 'Mumbai', timezone: 'Asia/Kolkata', market: 'NSE', openHour: 9.25, closeHour: 15.5, weekdays: true },
]

function getTimeInZone(tz: string): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
}

function formatTime(date: Date): string {
  const h = date.getHours()
  const m = date.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function isMarketOpen(city: City): boolean {
  const now = getTimeInZone(city.timezone)
  const day = now.getDay()
  if (city.weekdays && (day === 0 || day === 6)) return false
  const hours = now.getHours() + now.getMinutes() / 60
  return hours >= city.openHour && hours < city.closeHour
}

function hoursUntilEvent(city: City): string {
  const now = getTimeInZone(city.timezone)
  const day = now.getDay()
  const hours = now.getHours() + now.getMinutes() / 60
  const open = isMarketOpen(city)

  if (city.weekdays && (day === 0 || day === 6)) {
    const daysUntilMon = day === 0 ? 1 : 2
    return `opens in ${daysUntilMon}d`
  }

  if (open) {
    const remaining = city.closeHour - hours
    if (remaining < 1) return `closes in ${Math.round(remaining * 60)}m`
    return `closes in ${remaining.toFixed(1)}h`
  }

  if (hours < city.openHour) {
    const until = city.openHour - hours
    if (until < 1) return `opens in ${Math.round(until * 60)}m`
    return `opens in ${until.toFixed(1)}h`
  }

  return 'closed'
}

function SessionTimeline() {
  const etNow = getTimeInZone('America/New_York')
  const etHour = etNow.getHours() + etNow.getMinutes() / 60

  // Convert each market's open/close to ET offset
  function toET(city: City) {
    const localNow = getTimeInZone(city.timezone)
    const localHour = localNow.getHours() + localNow.getMinutes() / 60
    const offset = etHour - localHour
    return {
      name: city.market,
      open: city.openHour + offset,
      close: city.closeHour + offset,
      isOpen: isMarketOpen(city),
    }
  }

  const sessions = CITIES.map(toET)

  return (
    <div className="mt-1 pt-1.5 border-t border-border/20">
      <div className="text-[8px] uppercase tracking-wider text-muted-foreground mb-1">Session Overlap (ET)</div>
      <div className="relative h-[60px]">
        {/* Hour markers */}
        {[0, 4, 8, 12, 16, 20, 24].map((h) => (
          <div key={h} className="absolute top-0 bottom-0" style={{ left: `${(h / 24) * 100}%` }}>
            <div className="w-px h-full bg-border/20" />
            <span className="absolute -bottom-0.5 -translate-x-1/2 text-[7px] text-muted-foreground/60">{h}</span>
          </div>
        ))}
        {/* Now line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
          style={{ left: `${(etHour / 24) * 100}%` }}
        />
        {/* Session bars */}
        {sessions.slice(0, 6).map((s, i) => {
          let open = s.open % 24
          if (open < 0) open += 24
          let close = s.close % 24
          if (close < 0) close += 24

          const left = (open / 24) * 100
          const width = open < close
            ? ((close - open) / 24) * 100
            : ((24 - open) / 24) * 100

          return (
            <div
              key={s.name}
              className={`absolute h-[7px] rounded-sm ${s.isOpen ? 'bg-emerald-500/60' : 'bg-zinc-400/30'}`}
              style={{
                left: `${left}%`,
                width: `${Math.min(width, 100 - left)}%`,
                top: `${i * 9}px`,
              }}
              title={`${s.name}: ${open.toFixed(1)}-${close.toFixed(1)} ET`}
            >
              <span className="text-[6px] font-medium text-foreground/70 pl-0.5 leading-[7px]">{s.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function WorldClockPanel() {
  const [, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10_000)
    return () => clearInterval(timer)
  }, [])

  const openCount = CITIES.filter(isMarketOpen).length

  return (
    <PanelWrapper title="World Clock">
      <div className="text-[9px] text-muted-foreground mb-1.5">
        <span className="text-emerald-600 font-medium">{openCount}</span> of {CITIES.length} markets open
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {CITIES.map((city) => {
          const time = getTimeInZone(city.timezone)
          const open = isMarketOpen(city)
          return (
            <div key={city.name} className="flex items-center justify-between py-0.5">
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-foreground truncate">{city.name}</div>
                <div className="text-[8px] text-muted-foreground">{city.market} · {hoursUntilEvent(city)}</div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className="text-[11px] tabular-nums font-medium">{formatTime(time)}</div>
                <div className="flex items-center justify-end gap-0.5">
                  <span className={`inline-block w-1 h-1 rounded-full ${open ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                  <span className={`text-[8px] uppercase tracking-wider ${open ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {open ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <SessionTimeline />
    </PanelWrapper>
  )
}
