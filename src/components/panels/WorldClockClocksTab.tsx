import { useIsExpanded } from '@/components/layout/PanelWrapper'

interface City {
  name: string
  timezone: string
  market: string
  open: number
  close: number
  weekdays: boolean
  color: string
}

export const CITIES: City[] = [
  { name: 'New York',   timezone: 'America/New_York',   market: 'NYSE',  open: 9.5,  close: 16,   weekdays: true, color: 'bg-blue-500' },
  { name: 'London',     timezone: 'Europe/London',       market: 'LSE',   open: 8,    close: 16.5, weekdays: true, color: 'bg-violet-500' },
  { name: 'Frankfurt',  timezone: 'Europe/Berlin',       market: 'XETRA', open: 9,    close: 17.5, weekdays: true, color: 'bg-amber-500' },
  { name: 'Tokyo',      timezone: 'Asia/Tokyo',          market: 'TSE',   open: 9,    close: 15,   weekdays: true, color: 'bg-rose-500' },
  { name: 'Hong Kong',  timezone: 'Asia/Hong_Kong',      market: 'HKEX',  open: 9.5,  close: 16,   weekdays: true, color: 'bg-red-400' },
  { name: 'Sydney',     timezone: 'Australia/Sydney',    market: 'ASX',   open: 10,   close: 16,   weekdays: true, color: 'bg-teal-500' },
  { name: 'Singapore',  timezone: 'Asia/Singapore',      market: 'SGX',   open: 9,    close: 17,   weekdays: true, color: 'bg-emerald-500' },
  { name: 'Mumbai',     timezone: 'Asia/Kolkata',        market: 'NSE',   open: 9.25, close: 15.5, weekdays: true, color: 'bg-orange-400' },
]

export function getLocalHours(tz: string, base: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(base)
  const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0')
  const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0')
  return h + m / 60
}

export function getLocalDay(tz: string, base: Date = new Date()): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' })
      .format(base)
      .replace('Sun', '0').replace('Mon', '1').replace('Tue', '2')
      .replace('Wed', '3').replace('Thu', '4').replace('Fri', '5').replace('Sat', '6')
  )
}

export function formatTimeInZone(tz: string, base: Date = new Date(), showSeconds = false): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', minute: '2-digit',
    ...(showSeconds ? { second: '2-digit' } : {}), hour12: true,
  }).format(base)
}

export type MarketStatus = 'OPEN' | 'PRE-MARKET' | 'POST-MARKET' | 'CLOSED'

export function getMarketStatus(city: City, base: Date = new Date()): MarketStatus {
  const dayStr = new Intl.DateTimeFormat('en-US', { timeZone: city.timezone, weekday: 'short' }).format(base)
  const isWeekend = dayStr === 'Sun' || dayStr === 'Sat'
  if (city.weekdays && isWeekend) return 'CLOSED'
  const h = getLocalHours(city.timezone, base)
  if (h >= city.open && h < city.close) return 'OPEN'
  if (h >= city.open - 1 && h < city.open) return 'PRE-MARKET'
  if (h >= city.close && h < city.close + 1) return 'POST-MARKET'
  return 'CLOSED'
}

export function hoursUntilEvent(city: City): string {
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

export const STATUS_DOT: Record<MarketStatus, string> = {
  'OPEN': 'bg-emerald-500',
  'PRE-MARKET': 'bg-amber-400',
  'POST-MARKET': 'bg-amber-400',
  'CLOSED': 'bg-zinc-400',
}

export const STATUS_TEXT: Record<MarketStatus, string> = {
  'OPEN': 'text-emerald-600',
  'PRE-MARKET': 'text-amber-500',
  'POST-MARKET': 'text-amber-500',
  'CLOSED': 'text-muted-foreground',
}

export function WorldClockClocksTab() {
  const expanded = useIsExpanded()
  const openCount = CITIES.filter(c => getMarketStatus(c) === 'OPEN').length

  return (
    <>
      <div className="text-[10px] text-muted-foreground mb-1.5">
        <span className="text-emerald-600 font-medium">{openCount}</span> of {CITIES.length} markets open
      </div>
      <div className={`grid gap-x-3 ${expanded ? 'grid-cols-1 gap-y-1' : 'grid-cols-2 gap-y-0.5'}`}>
        {CITIES.map((city) => {
          const status = getMarketStatus(city)
          return (
            <div key={city.name} className={`flex items-center justify-between ${expanded ? 'py-1.5 border-b border-border/10 last:border-0' : 'py-0.5'}`}>
              <div className="min-w-0">
                <div className={`font-medium text-foreground truncate ${expanded ? 'text-[13px]' : 'text-[10px]'}`}>{city.name}</div>
                <div className={`text-muted-foreground ${expanded ? 'text-[10px]' : 'text-[9px]'}`}>{city.market} · {hoursUntilEvent(city)}</div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className={`tabular-nums font-medium ${expanded ? 'text-[18px]' : 'text-[12px]'}`}>{formatTimeInZone(city.timezone, new Date(), expanded)}</div>
                <div className="flex items-center justify-end gap-0.5">
                  <span className={`inline-block rounded-full ${STATUS_DOT[status]} ${expanded ? 'w-2 h-2' : 'w-1.5 h-1.5'}`} />
                  <span className={`uppercase tracking-wider ${STATUS_TEXT[status]} ${expanded ? 'text-[10px]' : 'text-[9px]'}`}>{status}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
