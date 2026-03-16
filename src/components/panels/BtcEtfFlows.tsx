type FlowsData = {
  timestamp: string
  summary: {
    etfCount: number
    totalVolume: number
    totalEstFlow: number
    netDirection: 'NET INFLOW' | 'NET OUTFLOW' | 'NEUTRAL' | 'UNAVAILABLE'
    inflowCount: number
    outflowCount: number
  }
  etfs: Array<{
    ticker: string
    issuer: string
    price: number
    priceChange: number
    volume: number
    avgVolume: number
    volumeRatio: number
    direction: 'inflow' | 'outflow' | 'neutral'
    estFlow: number
  }>
  rateLimited: boolean
}

function fmtVol(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  return `${(v / 1e3).toFixed(0)}K`
}

function fmtFlow(v: number): string {
  const abs = Math.abs(v)
  const sign = v >= 0 ? '+' : '-'
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`
  return `${sign}$${(abs / 1e3).toFixed(0)}K`
}

function directionDot(dir: 'inflow' | 'outflow' | 'neutral') {
  if (dir === 'inflow') return 'bg-emerald-500'
  if (dir === 'outflow') return 'bg-red-500'
  return 'bg-muted-foreground'
}

function directionText(dir: 'inflow' | 'outflow' | 'neutral') {
  if (dir === 'inflow') return 'text-emerald-500'
  if (dir === 'outflow') return 'text-red-500'
  return 'text-muted-foreground'
}

interface Props {
  flowsData: FlowsData | null | undefined
  flowsLoading: boolean
  expanded: boolean
}

export function BtcEtfFlows({ flowsData, flowsLoading, expanded }: Props) {
  return (
    <div className="space-y-2">
      {flowsLoading && !flowsData && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
      )}
      {!flowsLoading && !flowsData && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">No data available</div>
      )}
      {flowsData && (
        <>
          {flowsData.rateLimited && (
            <div className="text-[10px] text-amber-500 border border-amber-500/20 bg-amber-500/10 rounded px-2 py-1">
              Rate limited — showing cached data
            </div>
          )}
          <div className="border-b border-border/20 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-px rounded-sm ${
                  flowsData.summary.netDirection === 'NET INFLOW'
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : flowsData.summary.netDirection === 'NET OUTFLOW'
                    ? 'bg-red-500/20 text-red-500'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {flowsData.summary.netDirection}
                </span>
                <span className={`text-[12px] font-bold tabular-nums ${
                  flowsData.summary.totalEstFlow >= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {fmtFlow(flowsData.summary.totalEstFlow)}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground tabular-nums">
                <span className="text-emerald-500">{flowsData.summary.inflowCount} in</span>
                {' / '}
                <span className="text-red-500">{flowsData.summary.outflowCount} out</span>
              </div>
            </div>
          </div>
          <table className={`w-full ${expanded ? 'text-[12px]' : 'text-[11px]'}`}>
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-medium pb-1.5">Ticker</th>
                <th className="text-left font-medium pb-1.5 hidden sm:table-cell">Issuer</th>
                <th className="text-right font-medium pb-1.5">Chg%</th>
                <th className="text-right font-medium pb-1.5">Volume</th>
                <th className="text-right font-medium pb-1.5">Dir</th>
              </tr>
            </thead>
            <tbody>
              {flowsData.etfs.map((etf) => {
                const isPos = etf.priceChange >= 0
                return (
                  <tr key={etf.ticker} className="border-t border-border/20">
                    <td className="py-1 font-medium">{etf.ticker}</td>
                    <td className="py-1 text-muted-foreground hidden sm:table-cell">{etf.issuer}</td>
                    <td className={`py-1 text-right tabular-nums ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isPos ? '+' : ''}{etf.priceChange.toFixed(2)}%
                    </td>
                    <td className="py-1 text-right tabular-nums">
                      <div>{fmtVol(etf.volume)}</div>
                      <div className="text-[9px] text-muted-foreground">{etf.volumeRatio.toFixed(1)}x avg</div>
                    </td>
                    <td className="py-1 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${directionDot(etf.direction)}`} />
                        <span className={`text-[10px] ${directionText(etf.direction)}`}>{etf.direction}</span>
                      </div>
                      {expanded && (
                        <div className={`text-[9px] tabular-nums ${etf.estFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {fmtFlow(etf.estFlow)}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {flowsData.etfs.length === 0 && (
                <tr><td colSpan={5} className="py-2 text-center text-muted-foreground text-[10px]">No data available</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
