import { useState, useEffect } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'

interface City {
  name: string
  timezone: string
  market: string
  open: number
  close: number
  weekdays: boolean
  color: string
}

const CITIES: City[] = [
  { name: 'New York',   timezone: 'America/New_York',   market: 'NYSE',  open: 9.5,  close: 16,   weekdays: true, color: 'bg-blue-500' },
  { name: 'London',     timezone: 'Europe/London',       market: 'LSE',   open: 8,    close: 16.5, weekdays: true, color: 'bg-violet-500' },
  { name: 'Frankfurt',  timezone: 'Europe/Berlin',       market: 'XETRA', open: 9,    close: 17.5, weekdays: true, color: 'bg-amber-500' },
  { name: 'Tokyo',      timezone: 'Asia/Tokyo',          market: 'TSE',   open: 9,    close: 15,   weekdays: true, color: 'bg-rose-500' },
  { name: 'Hong Kong',  timezone: 'Asia/Hong_Kong',      market: 'HKEX',  open: 9.5,  close: 16,   weekdays: true, color: 'bg-red-400' },
  { name: 'Sydney',     timezone: 'Australia/Sydney',    market: 'ASX',   open: 10,   close: 16,   weekdays: true, color: 'bg-teal-500' },
  { name: 'Singapore',  timezone: 'Asia/Singapore',      market: 'SGX',   open: 9,    close: 17,   weekdays: true, color: 'bg-emerald-500' },
  { name: 'Mumbai',     timezone: 'Asia/Kolkata',        market: 'NSE',   open: 9.25, close: 15.5, weekdays: true, color: 'bg-orange-400' },
]

function getLocalHours(tz: string, base: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(base)
  const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0')
  const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0')
  return h + m / 60
}

function getLocalDay(tz: string, base: Date = new Date()): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' })
      .format(base)
      .replace('Sun', '0').replace('Mon', '1').replace('Tue', '2')
      .replace('Wed', '3').replace('Thu', '4').replace('Fri', '5').replace('Sat', '6')
  )
}

function formatTimeInZone(tz: string, base: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(base)
}

type MarketStatus = 'OPEN' | 'PRE-MARKET' | 'POST-MARKET' | 'CLOSED'

function getMarketStatus(city: City, base: Date = new Date()): MarketStatus {
  const dayStr = new Intl.DateTimeFormat('en-US', { timeZone: city.timezone, weekday: 'short' }).format(base)
  const isWeekend = dayStr === 'Sun' || dayStr === 'Sat'
  if (city.weekdays && isWeekend) return 'CLOSED'
  const h = getLocalHours(city.timezone, base)
  if (h >= city.open && h < city.close) return 'OPEN'
  if (h >= city.open - 1 && h < city.open) return 'PRE-MARKET'
  if (h >= city.close && h < city.close + 1) return 'POST-MARKET'
  return 'CLOSED'
}

function hoursUntilEvent(city: City): string {
  const dayStr = new Intl.DateTimeFormat('en-US', { timeZone: city.timezone, weekday: 'short' }).format()
  const isWeekend = dayStr === 'Sun' || dayStr === 'Sat'
  const h = getLocalHours(city.timezone)
  const status = getMarketStatus(city)

  if (city.weekdays && isWeekend) {
    const day = getLocalDay(city.timezone)
    const daysUntilMon = day === 0 ? 1 : 2
    return `opens in ${daysUntilMon}d`
  }
  if (status === 'OPEN') {
    const rem = city.close - h
    if (rem < 1) return `closes in ${Math.round(rem * 60)}m`
    return `closes in ${rem.toFixed(1)}h`
  }
  if (h < city.open) {
    const until = city.open - h
    if (until < 1) return `opens in ${Math.round(until * 60)}m`
    return `opens in ${until.toFixed(1)}h`
  }
  return 'closed'
}

const STATUS_DOT: Record<MarketStatus, string> = {
  'OPEN': 'bg-emerald-500',
  'PRE-MARKET': 'bg-amber-400',
  'POST-MARKET': 'bg-amber-400',
  'CLOSED': 'bg-zinc-400',
}

const STATUS_TEXT: Record<MarketStatus, string> = {
  'OPEN': 'text-emerald-600',
  'PRE-MARKET': 'text-amber-500',
  'POST-MARKET': 'text-amber-500',
  'CLOSED': 'text-muted-foreground',
}

// ---- Clocks tab ----

function ClocksTab() {
  const openCount = CITIES.filter(c => getMarketStatus(c) === 'OPEN').length

  return (
    <>
      <div className="text-[9px] text-muted-foreground mb-1.5">
        <span className="text-emerald-600 font-medium">{openCount}</span> of {CITIES.length} markets open
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {CITIES.map((city) => {
          const status = getMarketStatus(city)
          return (
            <div key={city.name} className="flex items-center justify-between py-0.5">
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-foreground truncate">{city.name}</div>
                <div className="text-[8px] text-muted-foreground">{city.market} · {hoursUntilEvent(city)}</div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className="text-[12px] tabular-nums font-medium">{formatTimeInZone(city.timezone)}</div>
                <div className="flex items-center justify-end gap-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                  <span className={`text-[8px] uppercase tracking-wider ${STATUS_TEXT[status]}`}>{status}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ---- Convert tab ----

function ConvertTab() {
  const [inputTime, setInputTime] = useState(() => {
    const now = new Date()
    const hh = now.getHours().toString().padStart(2, '0')
    const mm = now.getMinutes().toString().padStart(2, '0')
    return `${hh}:${mm}`
  })

  const baseDate = (() => {
    const [hh, mm] = inputTime.split(':').map(Number)
    const d = new Date()
    d.setHours(isNaN(hh) ? 0 : hh, isNaN(mm) ? 0 : mm, 0, 0)
    return d
  })()

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] text-muted-foreground">Local time</span>
        <input
          type="time"
          value={inputTime}
          onChange={e => setInputTime(e.target.value)}
          className="text-[11px] tabular-nums font-medium bg-muted/40 border border-border/30 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>
      <table className="w-full border-collapse">
        <tbody>
          {CITIES.map((city) => {
            const status = getMarketStatus(city, baseDate)
            return (
              <tr key={city.name} className="border-b border-border/10 last:border-0">
                <td className="py-0.5 pr-2">
                  <span className="text-[10px] font-medium text-foreground">{city.name}</span>
                </td>
                <td className="py-0.5 pr-2">
                  <span className="text-[12px] tabular-nums font-medium">{formatTimeInZone(city.timezone, baseDate)}</span>
                </td>
                <td className="py-0.5">
                  <div className="flex items-center gap-1">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                    <span className={`text-[8px] uppercase tracking-wider ${STATUS_TEXT[status]}`}>{status}</span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---- Overlap tab ----

function OverlapTab() {
  const etHours = getLocalHours('America/New_York')

  const sessions = CITIES.map(city => {
    const localH = getLocalHours(city.timezone)
    const offset = etHours - localH
    let openET = city.open + offset
    let closeET = city.close + offset
    // normalize to 0-24
    openET = ((openET % 24) + 24) % 24
    closeET = ((closeET % 24) + 24) % 24
    return { city, openET, closeET, status: getMarketStatus(city) }
  })

  const tickHours = [0, 3, 6, 9, 12, 15, 18, 21, 24]

  return (
    <div>
      <div className="text-[8px] uppercase tracking-wider text-muted-foreground mb-1.5">Session Overlap (ET)</div>
      <div className="relative" style={{ paddingBottom: '12px' }}>
        {/* tick lines */}
        {tickHours.map(h => (
          <div
            key={h}
            className="absolute top-0 bottom-4 w-px bg-border/20"
            style={{ left: `${(h / 24) * 100}%` }}
          />
        ))}
        {/* now line */}
        <div
          className="absolute top-0 bottom-4 w-px bg-red-500 z-10"
          style={{ left: `${(etHours / 24) * 100}%` }}
        />
        {/* bars */}
        {sessions.map(({ city, openET, closeET, status }, i) => {
          const isOpen = status === 'OPEN'
          const wraps = closeET < openET
          const bars = wraps
            ? [{ l: (openET / 24) * 100, w: ((24 - openET) / 24) * 100 }, { l: 0, w: (closeET / 24) * 100 }]
            : [{ l: (openET / 24) * 100, w: ((closeET - openET) / 24) * 100 }]

          return (
            <div key={city.name} className="relative h-2 mb-1" style={{ marginBottom: i === sessions.length - 1 ? 0 : '3px' }}>
              {bars.map((bar, bi) => (
                <div
                  key={bi}
                  className={`absolute h-2 rounded-sm ${isOpen ? city.color + '/70' : 'bg-zinc-400/25'}`}
                  style={{ left: `${bar.l}%`, width: `${bar.w}%` }}
                  title={`${city.name}: ${openET.toFixed(1)}-${closeET.toFixed(1)} ET`}
                />
              ))}
              <span
                className="absolute text-[6px] font-medium text-foreground/60 leading-2 pl-0.5 truncate"
                style={{ top: 0, left: `${bars[0].l}%`, maxWidth: `${bars[0].w}%` }}
              >
                {city.market}
              </span>
            </div>
          )
        })}
        {/* tick labels */}
        <div className="relative h-3">
          {tickHours.map(h => (
            <span
              key={h}
              className="absolute text-[7px] text-muted-foreground/60 -translate-x-1/2"
              style={{ left: `${(h / 24) * 100}%` }}
            >
              {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---- Main panel ----

type Tab = 'clocks' | 'convert' | 'overlap'

export default function WorldClockPanel() {
  const [, setNow] = useState(Date.now())
  const [tab, setTab] = useState<Tab>('clocks')

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'clocks', label: 'Clocks' },
    { id: 'convert', label: 'Convert' },
    { id: 'overlap', label: 'Overlap' },
  ]

  return (
    <PanelWrapper title="World Clock">
      <div className="flex gap-0.5 mb-2 border-b border-border/20 pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm transition-colors ${
              tab === t.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'clocks' && <ClocksTab />}
      {tab === 'convert' && <ConvertTab />}
      {tab === 'overlap' && <OverlapTab />}
    </PanelWrapper>
  )
}
