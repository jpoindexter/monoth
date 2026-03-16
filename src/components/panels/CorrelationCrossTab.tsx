import { correlationColor } from '@/components/panels/correlation-data'

interface Props {
  activeAssets: string[]
  activeCorr: Record<string, Record<string, number>>
  isLive: boolean
  liveAsOf?: string
  expanded: boolean
}

export function CorrelationCrossTab({ activeAssets, activeCorr, isLive, liveAsOf, expanded }: Props) {
  const cellW = expanded ? 48 : 44
  const cellH = expanded ? 'h-10' : 'h-8'

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-px" style={{ gridTemplateColumns: `minmax(36px, auto) repeat(${activeAssets.length}, ${cellW}px)` }}>
        <div className="pb-1" />
        {activeAssets.map((a) => (
          <div key={a} className="text-center text-[10px] font-medium uppercase text-muted-foreground pb-1">{a}</div>
        ))}
        {activeAssets.map((row) => (
          <>
            <div key={`l-${row}`} className={`font-medium uppercase flex items-center pr-1 text-muted-foreground ${expanded ? 'text-[11px]' : 'text-[10px]'}`}>{row}</div>
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
      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-emerald-600" /> strong +</span>
        <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-muted border border-border" /> neutral</span>
        <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-red-600" /> strong -</span>
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground/60">
        {isLive ? `Live · 6M Pearson · as of ${liveAsOf}` : 'Reference · long-run estimated correlations'}
      </div>
    </div>
  )
}
