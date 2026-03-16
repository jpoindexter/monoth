import type { MarketDataPoint, ForexRate } from '@/types'
import type { FredSeries } from '@/services/api/macro'

function detectRegime(indices: MarketDataPoint[], fredData: FredSeries[]): {
  regime: string
  confidence: number
  description: string
  color: string
  spyChg: number
  vixLevel: number
  spread: number
} {
  const spy = indices.find(i => i.symbol === 'SPY')
  const vix = indices.find(i => i.symbol.includes('VIX'))
  const spyChg = spy?.changePercent ?? 0
  const vixLevel = vix?.price ?? 18

  const dgs2 = fredData?.find(d => d.seriesId === 'DGS2')
  const dgs10 = fredData?.find(d => d.seriesId === 'DGS10')
  const spread = dgs2 && dgs10 ? dgs10.value - dgs2.value : 0.5

  if (vixLevel > 30 && spyChg < -1) return { regime: 'CRISIS', confidence: 85, description: 'Elevated volatility with equity selloff. Risk-off positioning recommended.', color: '#ef4444', spyChg, vixLevel, spread }
  if (vixLevel > 25) return { regime: 'RISK-OFF', confidence: 70, description: 'High volatility regime. Defensive sectors and safe havens favored.', color: '#f97316', spyChg, vixLevel, spread }
  if (spread < 0) return { regime: 'LATE CYCLE', confidence: 65, description: 'Inverted yield curve signals late-cycle dynamics. Watch for recession indicators.', color: '#eab308', spyChg, vixLevel, spread }
  if (spyChg > 0.5 && vixLevel < 15) return { regime: 'RISK-ON', confidence: 75, description: 'Low volatility bull market. Growth and momentum strategies favored.', color: '#10b981', spyChg, vixLevel, spread }
  return { regime: 'TRANSITIONAL', confidence: 55, description: 'Mixed signals across indicators. No dominant regime.', color: '#6366f1', spyChg, vixLevel, spread }
}

function JpyIndicator({ forex }: { forex: ForexRate[] }) {
  const jpyPair = forex.find(f => f.pair.includes('JPY') && f.pair.startsWith('USD'))
    ?? forex.find(f => f.pair.includes('JPY'))

  if (!jpyPair) {
    return <div className="text-[10px] text-muted-foreground text-center py-2">JPY data unavailable</div>
  }

  const rate = jpyPair.rate
  const chg = jpyPair.changePercent
  const normalized = Math.max(0, Math.min(100, ((160 - rate) / 60) * 100))
  const isCarryUnwind = chg < -0.5

  return (
    <div className="space-y-2 pt-1 border-t border-border/20">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">JPY Liquidity Proxy</span>
        {isCarryUnwind && (
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-400 tracking-wider">
            CARRY UNWIND
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div>
          <div className="text-[10px] text-muted-foreground">{jpyPair.pair}</div>
          <div className="text-sm font-bold tabular-nums">{rate.toFixed(2)}</div>
          <div className={`text-[10px] tabular-nums ${chg >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>JPY Strength</span>
            <span>{normalized.toFixed(0)}</span>
          </div>
          <div className="h-2 rounded-full bg-border/30">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${normalized}%`,
                backgroundColor: normalized > 60 ? '#10b981' : normalized < 30 ? '#ef4444' : '#eab308',
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
            <span>Weak</span>
            <span>Strong</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  indices: MarketDataPoint[]
  fredData: FredSeries[]
  forex: ForexRate[]
}

export function MacroSignalsRegimeTab({ indices, fredData, forex }: Props) {
  const r = detectRegime(indices, fredData)

  return (
    <div className="space-y-3">
      <div
        className="rounded-md px-3 py-2 text-center"
        style={{ backgroundColor: r.color + '22', border: `1px solid ${r.color}44` }}
      >
        <div className="text-xl font-bold tracking-wider" style={{ color: r.color }}>{r.regime}</div>
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>Confidence</span>
          <span>{r.confidence}%</span>
        </div>
        <div className="h-2 rounded-full bg-border/30">
          <div className="h-2 rounded-full transition-all" style={{ width: `${r.confidence}%`, backgroundColor: r.color }} />
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-foreground/80">{r.description}</p>

      <div className="space-y-1 pt-1 border-t border-border/20">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Inputs</div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">SPY Change</span>
          <span className={r.spyChg >= 0 ? 'text-emerald-500' : 'text-red-500'}>
            {r.spyChg >= 0 ? '+' : ''}{r.spyChg.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">VIX Level</span>
          <span className={r.vixLevel > 25 ? 'text-red-500' : r.vixLevel < 15 ? 'text-emerald-500' : 'text-amber-500'}>
            {r.vixLevel.toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">2s10s Spread</span>
          <span className={r.spread < 0 ? 'text-red-500' : 'text-emerald-500'}>
            {r.spread >= 0 ? '+' : ''}{r.spread.toFixed(2)}%
          </span>
        </div>
      </div>

      <JpyIndicator forex={forex} />
    </div>
  )
}
