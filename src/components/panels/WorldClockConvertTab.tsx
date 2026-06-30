import { useState } from 'react'
import { CITIES, formatTimeInZone, getMarketStatus, STATUS_DOT, STATUS_TEXT } from './world-clock-utils'

export function WorldClockConvertTab() {
  const [inputTime, setInputTime] = useState(() => {
    const now = new Date()
    const hh = now.getHours().toString().padStart(2, '0')
    const mm = now.getMinutes().toString().padStart(2, '0')
    return `${hh}:${mm}`
  })

  const baseDate = (() => {
    const parts = inputTime.split(':').map(Number)
    const hh = parts[0] ?? 0
    const mm = parts[1] ?? 0
    const d = new Date()
    d.setHours(isNaN(hh) ? 0 : hh, isNaN(mm) ? 0 : mm, 0, 0)
    return d
  })()

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-muted-foreground">Local time</span>
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
                    <span className={`text-[9px] uppercase tracking-wider ${STATUS_TEXT[status]}`}>{status}</span>
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
