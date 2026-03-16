type RiskLevel = 'DISRUPTED' | 'STRESSED' | 'NORMAL'

interface ShippingRate {
  indexId: string
  name: string
  currentValue: number
  previousValue: number
  changePct: number
  unit: string
  history: Array<{ date: string; value: number }>
  spikeAlert: boolean
}

const DISRUPTION_REGIONS = [
  { name: 'Suez Canal', keywords: ['suez', 'red sea', 'houthi', 'yemen shipping'] },
  { name: 'Panama Canal', keywords: ['panama canal', 'drought', 'canal capacity'] },
  { name: 'China Ports', keywords: ['shanghai port', 'china shipping', 'ningbo', 'shenzhen port'] },
  { name: 'US West Coast', keywords: ['port los angeles', 'long beach port', 'west coast dock'] },
  { name: 'Semiconductors', keywords: ['chip shortage', 'semiconductor supply', 'tsmc', 'chip production'] },
  { name: 'Auto Industry', keywords: ['auto supply', 'car production', 'ev battery', 'auto parts'] },
]

const RISK_DOT: Record<RiskLevel, string> = {
  DISRUPTED: 'bg-red-500',
  STRESSED: 'bg-amber-400',
  NORMAL: 'bg-emerald-500',
}

const RISK_BADGE: Record<RiskLevel, string> = {
  DISRUPTED: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400',
  STRESSED: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
  NORMAL: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
}

function scoreRegion(headlines: string[], keywords: string[]): RiskLevel {
  const text = headlines.join(' ').toLowerCase()
  const hits = keywords.filter(k => text.includes(k)).length
  if (hits >= 2) return 'DISRUPTED'
  if (hits === 1) return 'STRESSED'
  return 'NORMAL'
}

function Sparkline({ history }: { history: Array<{ date: string; value: number }> }) {
  if (!history || history.length === 0) return null
  const values = history.map(h => h.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  return (
    <div className="flex items-end gap-px h-6">
      {history.map((h, i) => {
        const height = Math.round(((h.value - min) / range) * 24)
        return <div key={i} className="w-[3px] bg-current opacity-60 rounded-[1px] shrink-0" style={{ height: `${Math.max(2, height)}px` }} />
      })}
    </div>
  )
}

interface Props {
  headlines: string[]
  shippingData: ShippingRate[] | null | undefined
  expanded: boolean
}

export function SupplyChainDisruptions({ headlines, shippingData, expanded }: Props) {
  const hasLiveShipping = shippingData && shippingData.length > 0
  return (
    <div>
      <div className="space-y-0.5 mb-3">
        {DISRUPTION_REGIONS.map(region => {
          const level = scoreRegion(headlines, region.keywords)
          return (
            <div key={region.name} className="flex items-center gap-2 py-0.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${RISK_DOT[level]}`} />
              <span className={`${expanded ? 'text-[13px]' : 'text-[11px]'} flex-1`}>{region.name}</span>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm ${RISK_BADGE[level]}`}>{level}</span>
            </div>
          )
        })}
      </div>

      <div className="border-t border-border/20 pt-2 space-y-1">
        <div className="mb-1 px-1.5 py-0.5 rounded-sm bg-border/20 border border-border/30">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
            {hasLiveShipping ? 'Shipping Rates · Live' : 'Reference · Baltic Exchange / Freightos'}
          </span>
        </div>
        {hasLiveShipping ? (
          shippingData.map(idx => {
            const isPos = idx.changePct >= 0
            return (
              <div key={idx.indexId} className="flex items-center gap-2 py-0.5 border-t border-border/20 first:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[11px] font-medium leading-tight">{idx.name}</span>
                    <span className="text-[9px] text-muted-foreground bg-border/30 px-1 py-px rounded-sm font-mono">{idx.indexId}</span>
                    {idx.spikeAlert && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400">SPIKE</span>
                    )}
                  </div>
                </div>
                <div className="flex items-end gap-2 shrink-0">
                  <div className={`text-muted-foreground ${isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    <Sparkline history={idx.history} />
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-bold tabular-nums leading-tight">{idx.currentValue.toLocaleString()}</div>
                    <div className={`text-[10px] tabular-nums font-medium ${isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      {isPos ? '+' : ''}{idx.changePct.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          [
            { label: 'Baltic Dry Index', abbr: 'BDI', value: '1,342' },
            { label: 'Container Freight', abbr: 'FBX', value: '$2,180/FEU' },
          ].map(idx => (
            <div key={idx.abbr} className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium">{idx.label}</span>
                <span className="text-[10px] text-muted-foreground ml-1">{idx.abbr}</span>
              </div>
              <span className="text-[12px] font-bold tabular-nums">{idx.value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
