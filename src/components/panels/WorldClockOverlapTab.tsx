import { CITIES, getLocalHours, getMarketStatus } from './world-clock-utils'

export function WorldClockOverlapTab() {
  const etHours = getLocalHours('America/New_York')

  const sessions = CITIES.map(city => {
    const localH = getLocalHours(city.timezone)
    const offset = etHours - localH
    let openET = city.open + offset
    let closeET = city.close + offset
    openET = ((openET % 24) + 24) % 24
    closeET = ((closeET % 24) + 24) % 24
    return { city, openET, closeET, status: getMarketStatus(city) }
  })

  const tickHours = [0, 3, 6, 9, 12, 15, 18, 21, 24]

  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5">Session Overlap (ET)</div>
      <div className="relative" style={{ paddingBottom: '12px' }}>
        {tickHours.map(h => (
          <div
            key={h}
            className="absolute top-0 bottom-4 w-px bg-border/20"
            style={{ left: `${(h / 24) * 100}%` }}
          />
        ))}
        <div
          className="absolute top-0 bottom-4 w-px bg-red-500 z-10"
          style={{ left: `${(etHours / 24) * 100}%` }}
        />
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
                style={{ top: 0, left: `${bars[0]?.l ?? 0}%`, maxWidth: `${bars[0]?.w ?? 0}%` }}
              >
                {city.market}
              </span>
            </div>
          )
        })}
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
