'use client'

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

export default function WorldClockPanel() {
  const [, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10_000)
    return () => clearInterval(timer)
  }, [])

  return (
    <PanelWrapper title="World Clock">
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {CITIES.map((city) => {
          const time = getTimeInZone(city.timezone)
          const open = isMarketOpen(city)
          return (
            <div key={city.name} className="flex items-center justify-between py-0.5">
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-foreground truncate">{city.name}</div>
                <div className="text-[9px] text-muted-foreground">{city.market}</div>
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
    </PanelWrapper>
  )
}
