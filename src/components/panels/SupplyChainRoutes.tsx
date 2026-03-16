type RouteStatus = 'ON TIME' | 'DELAYED' | 'DISRUPTED'

interface TradeRoute {
  name: string
  pair: string
  transitDays: number
  keywords: string[]
}

const TRADE_ROUTES: TradeRoute[] = [
  { name: 'Trans-Pacific', pair: 'Shanghai–LA', transitDays: 14, keywords: ['trans-pacific', 'china us shipping', 'pacific freight', 'shanghai freight'] },
  { name: 'Suez Canal', pair: 'Asia–Europe', transitDays: 12, keywords: ['suez', 'red sea', 'houthi', 'yemen shipping'] },
  { name: 'Panama Canal', pair: 'Pacific–Atlantic', transitDays: 9, keywords: ['panama canal', 'drought', 'canal capacity'] },
  { name: 'N.Europe–US East', pair: 'Rotterdam–New York', transitDays: 10, keywords: ['north europe shipping', 'transatlantic freight', 'rotterdam port'] },
  { name: 'China–Europe Rail', pair: 'Chengdu–Duisburg', transitDays: 18, keywords: ['china europe rail', 'belt road rail', 'trans-siberian cargo'] },
  { name: 'US–Mexico Border', pair: 'Laredo–Monterrey', transitDays: 2, keywords: ['us mexico border', 'laredo crossing', 'mexico trade'] },
  { name: 'Singapore Strait', pair: 'Malacca Strait', transitDays: 1, keywords: ['singapore strait', 'malacca', 'south china sea shipping'] },
  { name: 'Cape of Good Hope', pair: 'Asia–Europe Alt', transitDays: 20, keywords: ['cape of good hope', 'south africa route', 'suez alternate'] },
]

const ROUTE_STATUS_BADGE: Record<RouteStatus, string> = {
  'ON TIME': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
  'DELAYED': 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
  'DISRUPTED': 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400',
}

const ROUTE_STATUS_DOT: Record<RouteStatus, string> = {
  'ON TIME': 'bg-emerald-500',
  'DELAYED': 'bg-amber-400',
  'DISRUPTED': 'bg-red-500',
}

function scoreRoute(headlines: string[], route: TradeRoute): RouteStatus {
  const text = headlines.join(' ').toLowerCase()
  const hits = route.keywords.filter(k => text.includes(k)).length
  if (hits >= 2) return 'DISRUPTED'
  if (hits === 1) return 'DELAYED'
  return 'ON TIME'
}

function globalFlowScore(routes: RouteStatus[]): number {
  const score = routes.reduce((acc, s) => {
    if (s === 'ON TIME') return acc + 100
    if (s === 'DELAYED') return acc + 50
    return acc
  }, 0)
  return Math.round(score / routes.length)
}

function flowScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 45) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

interface Props {
  headlines: string[]
  expanded: boolean
}

export function SupplyChainRoutes({ headlines, expanded }: Props) {
  const routeStatuses = TRADE_ROUTES.map(r => scoreRoute(headlines, r))
  const flowScore = globalFlowScore(routeStatuses)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Global Flow Score</p>
        <span className={`text-[18px] font-bold tabular-nums leading-none ${flowScoreColor(flowScore)}`}>
          {flowScore}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">/100</span>
        </span>
      </div>
      <div className="space-y-0.5">
        {TRADE_ROUTES.map((route, i) => {
          const status = routeStatuses[i] ?? 'ON TIME'
          return (
            <div key={route.name} className="flex items-center gap-2 py-0.5 border-t border-border/20 first:border-0">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ROUTE_STATUS_DOT[status]}`} />
              <div className="flex-1 min-w-0">
                <span className={`${expanded ? 'text-[13px]' : 'text-[11px]'} font-medium`}>{route.name}</span>
                <span className={`${expanded ? 'text-[11px]' : 'text-[10px]'} text-muted-foreground ml-1`}>{route.pair}</span>
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">~{route.transitDays}d</span>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm shrink-0 ${ROUTE_STATUS_BADGE[status]}`}>{status}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
