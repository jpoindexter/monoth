import type { MarketDataPoint, CryptoAsset, ForexRate, YieldData } from '@/types'

type SignalLevel = 'BULLISH' | 'BULL' | 'NEUTRAL' | 'BEAR' | 'BEARISH'

function getSignal(change: number): SignalLevel {
  if (change > 1) return 'BULLISH'
  if (change > 0.3) return 'BULL'
  if (change < -1) return 'BEARISH'
  if (change < -0.3) return 'BEAR'
  return 'NEUTRAL'
}

function signalCls(sig: SignalLevel) {
  switch (sig) {
    case 'BULLISH': return 'bg-emerald-500/20 text-emerald-500'
    case 'BULL':    return 'bg-emerald-500/10 text-emerald-600'
    case 'BEARISH': return 'bg-red-500/20 text-red-500'
    case 'BEAR':    return 'bg-red-500/10 text-red-400'
    default:        return 'bg-amber-500/10 text-amber-500'
  }
}

function vixLabel(vix: number): { label: string; cls: string } {
  if (vix < 15) return { label: 'LOW',      cls: 'bg-emerald-500/20 text-emerald-500' }
  if (vix < 20) return { label: 'NORMAL',   cls: 'bg-amber-500/10 text-amber-500' }
  if (vix < 30) return { label: 'ELEVATED', cls: 'bg-amber-500/10 text-amber-400' }
  return           { label: 'HIGH',      cls: 'bg-red-500/20 text-red-500' }
}

interface ScorecardRow {
  asset: string
  value: string
  change: number | null
  vix?: number
}

export function DailyBriefScorecard({
  indices,
  crypto,
  forex,
  commodities,
  yields,
}: {
  indices: MarketDataPoint[]
  crypto: CryptoAsset[]
  forex: ForexRate[]
  commodities: MarketDataPoint[]
  yields: YieldData[]
}) {
  const spy   = indices.find((i) => i.symbol === 'SPY' || i.symbol === 'spy')
  const efa   = indices.find((i) => i.symbol === 'EFA' || i.symbol === 'efa')
  const btc   = crypto.find((c)  => c.symbol === 'btc' || c.symbol === 'bitcoin')
  const dxy   = forex.find((f)   => f.pair === 'DXY' || f.pair === 'USD' || f.pair.startsWith('DXY'))
  const gold  = commodities.find((c) => c.symbol === 'GC' || c.symbol === 'GOLD' || c.symbol === 'gold' || (c.name || '').toLowerCase().includes('gold'))
  const tnote = yields.find((y)  => y.maturity === '10Y' || y.maturity === '10y')
  const vix   = indices.find((i) => i.symbol === 'VIX' || i.symbol === 'vix')

  const rows: ScorecardRow[] = [
    spy   ? { asset: 'US Equities',   value: `$${spy.price.toFixed(2)}`,                                          change: spy.changePercent }           : { asset: 'US Equities',   value: '—', change: null },
    efa   ? { asset: 'Intl Equities', value: `$${efa.price.toFixed(2)}`,                                          change: efa.changePercent }           : { asset: 'Intl Equities', value: '—', change: null },
    btc   ? { asset: 'Crypto',        value: `$${btc.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, change: btc.changePercent24h }       : { asset: 'Crypto',        value: '—', change: null },
    dxy   ? { asset: 'Forex (DXY)',   value: dxy.rate.toFixed(2),                                                 change: dxy.changePercent }           : { asset: 'Forex (DXY)',   value: '—', change: null },
    gold  ? { asset: 'Commodities',   value: `$${gold.price.toFixed(0)}`,                                         change: gold.changePercent }          : { asset: 'Commodities',   value: '—', change: null },
    tnote ? { asset: 'Fixed Income',  value: `${tnote.yield.toFixed(2)}%`,                                        change: tnote.change }                : { asset: 'Fixed Income',  value: '—', change: null },
    vix   ? { asset: 'Volatility',    value: vix.price.toFixed(1),                                                change: null, vix: vix.price }        : { asset: 'Volatility',    value: '—', change: null },
  ]

  return (
    <table className="w-full text-[11px] border-collapse">
      <thead>
        <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
          <th className="text-left pb-1 font-medium">Asset Class</th>
          <th className="text-right pb-1 font-medium">Value</th>
          <th className="text-right pb-1 font-medium pl-2">Signal</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const hasChange = row.change !== null
          const isVix = row.vix !== undefined
          const sig = hasChange ? getSignal(row.change!) : null
          const vixInfo = isVix ? vixLabel(row.vix!) : null

          return (
            <tr key={row.asset} className="border-b border-border/20 last:border-0">
              <td className="py-1 text-foreground/80">{row.asset}</td>
              <td className="py-1 text-right tabular-nums text-foreground/60">
                {hasChange ? (
                  <span className={row.change! > 0 ? 'text-emerald-500' : row.change! < 0 ? 'text-red-400' : 'text-foreground/60'}>
                    {row.change! > 0 ? '▲' : row.change! < 0 ? '▼' : '─'} {Math.abs(row.change!).toFixed(2)}%
                  </span>
                ) : isVix ? (
                  <span className="text-foreground/60">─ {row.value}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-1 text-right pl-2">
                {sig && (
                  <span className={`text-[9px] font-bold uppercase px-1 py-px rounded-sm ${signalCls(sig)}`}>
                    {sig}
                  </span>
                )}
                {vixInfo && (
                  <span className={`text-[9px] font-bold uppercase px-1 py-px rounded-sm ${vixInfo.cls}`}>
                    {vixInfo.label}
                  </span>
                )}
                {!sig && !vixInfo && <span className="text-muted-foreground text-[10px]">—</span>}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
