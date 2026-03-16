import { ASSETS, correlationColor, directionColor } from '@/components/panels/correlation-data'

interface CorrelationEntry {
  indicator: string
  symbol: string
  beatDirection: number
  missDirection: number
  confidence: number
}

interface Props {
  activeAssets: string[]
  activeCorr: Record<string, Record<string, number>>
  matrixList: CorrelationEntry[]
  isLive: boolean
  liveAsOf?: string
  expanded: boolean
}

export function CorrelationMatrixTab({
  activeAssets,
  activeCorr,
  matrixList,
  isLive,
  liveAsOf,
  expanded,
}: Props) {
  const indicators = [...new Set(matrixList.map((e) => e.indicator))]
  const lookup = new Map<string, number>()
  for (const entry of matrixList) {
    lookup.set(`${entry.indicator}:${entry.symbol}`, entry.beatDirection)
  }

  if (matrixList.length === 0) {
    const cellW = expanded ? 48 : 44
    const cellH = expanded ? 'h-10' : 'h-8'
    return (
      <div className="min-w-0">
        <div className="overflow-x-auto">
          <div className="grid gap-px" style={{ gridTemplateColumns: `minmax(60px, 1fr) repeat(${activeAssets.length}, ${cellW}px)` }}>
            <div className="text-[10px] font-medium uppercase text-muted-foreground pb-1">Indicator</div>
            {activeAssets.map((a) => (
              <div key={a} className="text-center text-[10px] font-medium uppercase text-muted-foreground pb-1">{a}</div>
            ))}
            {activeAssets.map((row) => (
              <>
                <div key={`l-${row}`} className={`font-medium uppercase py-0.5 truncate ${expanded ? 'text-[11px]' : 'text-[10px]'}`}>{row}</div>
                {activeAssets.map((col) => {
                  const val = activeCorr[row]?.[col] ?? 0
                  const isDiag = row === col
                  return (
                    <div
                      key={`${row}:${col}`}
                      className={`flex items-center justify-center font-semibold tabular-nums rounded-sm ${cellH} text-[10px] ${correlationColor(val)} ${isDiag ? 'ring-1 ring-foreground/20' : ''}`}
                      style={{ width: cellW }}
                    >
                      {val.toFixed(2)}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">
            {isLive ? `Live · 6M Pearson · as of ${liveAsOf}` : 'Static fallback — live data unavailable'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <div className="overflow-x-auto">
        <div className="grid gap-px text-[10px]" style={{ gridTemplateColumns: `minmax(60px, 1fr) repeat(${ASSETS.length}, 44px)` }}>
          <div className="text-muted-foreground font-medium uppercase tracking-wider pb-1">Indicator</div>
          {ASSETS.map((a) => (
            <div key={a} className="text-center text-muted-foreground font-medium uppercase tracking-wider pb-1">{a}</div>
          ))}
          {indicators.map((indicator) => (
            <>
              <div key={`l-${indicator}`} className="text-[11px] font-medium py-0.5 truncate">{indicator}</div>
              {ASSETS.map((asset) => {
                const val = lookup.get(`${indicator}:${asset}`)
                return (
                  <div key={`${indicator}:${asset}`} className={`flex items-center justify-center rounded-sm py-0.5 text-[10px] font-semibold tabular-nums ${val != null ? directionColor(val) : 'text-muted-foreground'}`}>
                    {val != null ? `${val > 0 ? '+' : ''}${val.toFixed(1)}` : '—'}
                  </div>
                )
              })}
            </>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-emerald-600" /> positive</span>
          <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-red-600" /> negative</span>
        </div>
      </div>
    </div>
  )
}
