import { useState, useEffect } from 'react'
import { useLayoutStore, useMarketStore, useNewsStore } from '@/stores'
import { usePanelStore } from '@/stores'

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(n: number) {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function isMarketOpen(now: Date) {
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = et.getDay()
  if (day === 0 || day === 6) return false
  const mins = et.getHours() * 60 + et.getMinutes()
  return mins >= 9 * 60 + 30 && mins < 16 * 60
}

export function StatusBar() {
  const locked = useLayoutStore((s) => s.layoutLocked)
  const panels = usePanelStore((s) => s.panels)
  const enabledCount = panels.filter((p) => p.enabled).length
  const [time, setTime] = useState(new Date())

  const indices = useMarketStore((s) => s.indices)
  const crypto = useMarketStore((s) => s.crypto)
  const yields = useMarketStore((s) => s.yields)
  const newsItems = useNewsStore((s) => s.items)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 10_000)
    return () => clearInterval(timer)
  }, [])

  const etTime = time.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const utcTime = time.toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const spy = indices.find((i) => i.symbol === 'SPY')
  const vix = indices.find((i) => i.symbol === 'VIX' || i.symbol === '^VIX')
  const btc = crypto.find((c) => c.symbol.toLowerCase().includes('btc'))

  const vixColor =
    vix == null
      ? 'text-muted-foreground/40'
      : vix.price < 15
        ? 'text-green-500'
        : vix.price <= 25
          ? 'text-yellow-400'
          : 'text-red-500'

  const open = isMarketOpen(time)

  const healthDots: { label: string; ok: boolean }[] = [
    { label: 'Finnhub', ok: indices.length > 0 },
    { label: 'CoinGecko', ok: crypto.length > 0 },
    { label: 'FRED', ok: yields.length > 0 },
    { label: 'News', ok: newsItems.length > 0 },
  ]

  return (
    <div className="h-5 border-t border-border/40 bg-white dark:bg-[#0a0a0a] px-3 flex items-center justify-between text-[9px] text-muted-foreground/60 shrink-0 select-none">
      <div className="flex items-center gap-3">
        <span className="uppercase tracking-wider font-medium">Monoth v0.8</span>
        <span className="hidden sm:inline">ET {etTime}</span>
        <span className="hidden md:inline">UTC {utcTime}</span>
        <span className="hidden lg:inline">{enabledCount} panels</span>

        {/* Market status badge */}
        <span
          className={`hidden sm:inline text-[9px] font-bold uppercase px-1 rounded-sm ${open ? 'bg-green-500/20 text-green-400' : 'bg-muted/50 text-muted-foreground/50'}`}
        >
          {open ? 'US OPEN' : 'US CLOSED'}
        </span>

        {/* Live market indicators */}
        {spy && (
          <span className="hidden md:inline text-[10px] tabular-nums">
            <span className="text-muted-foreground/50 mr-0.5">SPY</span>
            <span>{fmt(spy.price)}</span>
            <span className={`ml-0.5 ${spy.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {fmtPct(spy.changePercent)}
            </span>
          </span>
        )}
        {btc && (
          <span className="hidden lg:inline text-[10px] tabular-nums">
            <span className="text-muted-foreground/50 mr-0.5">BTC</span>
            <span>{fmt(btc.price)}</span>
            <span className={`ml-0.5 ${btc.changePercent24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {fmtPct(btc.changePercent24h)}
            </span>
          </span>
        )}
        {vix && (
          <span className="hidden lg:inline text-[10px] tabular-nums">
            <span className="text-muted-foreground/50 mr-0.5">VIX</span>
            <span className={vixColor}>{fmt(vix.price)}</span>
          </span>
        )}

        {/* Data source health dots */}
        <span className="hidden xl:flex items-center gap-1">
          {healthDots.map(({ label, ok }) => (
            <span key={label} title={label} className="relative group flex items-center">
              <span
                className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`}
              />
            </span>
          ))}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <kbd className="bg-muted/50 px-1 py-px rounded font-mono">/</kbd>
        <span>search</span>
        <kbd className="bg-muted/50 px-1 py-px rounded font-mono">D</kbd>
        <span>theme</span>
        <kbd className="bg-muted/50 px-1 py-px rounded font-mono">L</kbd>
        <span>{locked ? 'unlock' : 'lock'}</span>
        <kbd className="bg-muted/50 px-1 py-px rounded font-mono">R</kbd>
        <span>refresh</span>
      </div>
    </div>
  )
}
