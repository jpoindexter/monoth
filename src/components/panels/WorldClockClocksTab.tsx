import { useIsExpanded } from '@/components/layout/PanelWrapper'
import {
  CITIES,
  getMarketStatus,
  hoursUntilEvent,
  formatTimeInZone,
  STATUS_DOT,
  STATUS_TEXT,
} from '@/components/panels/world-clock-utils'

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
