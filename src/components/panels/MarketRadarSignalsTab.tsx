import { useIsExpanded } from '@/components/layout/PanelWrapper'
import type { MarketDataPoint } from '@/types'

interface Mover {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
}

interface MoversData {
  gainers: Mover[]
  losers: Mover[]
  active: Mover[]
}

interface Signal {
  name: string
  value: string
  direction: 'bull' | 'bear' | 'neutral'
}

function deriveSignals(indices: MarketDataPoint[], movers: MoversData | null): Signal[] {
  const find = (sym: string) =>
    indices.find((d) => d.symbol.toUpperCase() === sym.toUpperCase())

  const spy = find('SPY')
  const qqq = find('QQQ')
  const iwm = find('IWM')
  const vix = indices.find((d) => d.symbol.toUpperCase().includes('VIX'))
  const xly = find('XLY')
  const xlp = find('XLP')

  const signals: Signal[] = []

  if (spy) {
    const bull = spy.changePercent > 0
    signals.push({ name: 'Trend', value: bull ? 'BULLISH' : 'BEARISH', direction: bull ? 'bull' : 'bear' })
  } else {
    signals.push({ name: 'Trend', value: 'N/A', direction: 'neutral' })
  }

  if (qqq && iwm) {
    const spread = qqq.changePercent - iwm.changePercent
    const dir = spread > 0.5 ? 'bull' : spread < -0.5 ? 'bear' : 'neutral'
    const label = spread > 0.5 ? 'GROWTH LEADING' : spread < -0.5 ? 'VALUE LEADING' : 'MIXED'
    signals.push({ name: 'Momentum', value: label, direction: dir })
  } else {
    signals.push({ name: 'Momentum', value: 'N/A', direction: 'neutral' })
  }

  if (vix) {
    const v = vix.price
    const label = v < 15 ? 'LOW' : v < 20 ? 'NORMAL' : v < 30 ? 'ELEVATED' : 'HIGH'
    const dir: Signal['direction'] = v < 20 ? 'bull' : v < 30 ? 'neutral' : 'bear'
    signals.push({ name: 'Volatility', value: label, direction: dir })
  } else {
    signals.push({ name: 'Volatility', value: 'N/A', direction: 'neutral' })
  }

  if (movers) {
    const g = movers.gainers.length
    const l = movers.losers.length
    const total = g + l
    const advPct = total > 0 ? g / total : 0.5
    const label = advPct > 0.6 ? 'BROAD ADVANCE' : advPct < 0.4 ? 'BROAD DECLINE' : 'MIXED'
    const dir: Signal['direction'] = advPct > 0.6 ? 'bull' : advPct < 0.4 ? 'bear' : 'neutral'
    signals.push({ name: 'Breadth', value: label, direction: dir })
  } else {
    signals.push({ name: 'Breadth', value: 'N/A', direction: 'neutral' })
  }

  if (xly && xlp) {
    const riskOn = xly.changePercent > xlp.changePercent
    signals.push({ name: 'Rotation', value: riskOn ? 'RISK-ON' : 'RISK-OFF', direction: riskOn ? 'bull' : 'bear' })
  } else {
    signals.push({ name: 'Rotation', value: 'N/A', direction: 'neutral' })
  }

  return signals
}

function compositeSignal(signals: Signal[]): { label: string; color: string } {
  const scored = signals.filter((s) => s.value !== 'N/A')
  if (scored.length === 0) return { label: 'NEUTRAL', color: 'text-muted-foreground' }
  const bulls = scored.filter((s) => s.direction === 'bull').length
  const bears = scored.filter((s) => s.direction === 'bear').length
  const score = bulls - bears
  if (score >= 4) return { label: 'STRONG BUY', color: 'text-emerald-400' }
  if (score >= 2) return { label: 'BUY', color: 'text-emerald-500' }
  if (score <= -4) return { label: 'STRONG SELL', color: 'text-red-400' }
  if (score <= -2) return { label: 'SELL', color: 'text-red-500' }
  return { label: 'NEUTRAL', color: 'text-amber-500' }
}

function signalBadgeCls(direction: Signal['direction']) {
  if (direction === 'bull') return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
  if (direction === 'bear') return 'bg-red-500/15 text-red-400 border border-red-500/30'
  return 'bg-muted/40 text-muted-foreground border border-border'
}

interface Props {
  indices: MarketDataPoint[]
  movers: MoversData | null
}

export function MarketRadarSignalsTab({ indices, movers }: Props) {
  const expanded = useIsExpanded()
  const signals = deriveSignals(indices, movers)
  const composite = compositeSignal(signals)

  return (
    <div className="px-1 space-y-2">
      <div className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/30 border border-border">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Market Signal</span>
        <span className={`font-bold tracking-wide ${expanded ? 'text-[14px]' : 'text-[11px]'} ${composite.color}`}>
          {composite.label}
        </span>
      </div>
      <div className="space-y-1">
        {signals.map((s) => (
          <div key={s.name} className={`flex items-center justify-between px-1 ${expanded ? 'py-1.5' : 'py-1'}`}>
            <span className={`text-muted-foreground ${expanded ? 'text-[12px] w-28' : 'text-[10px] w-20'}`}>{s.name}</span>
            <span className={`font-semibold px-1.5 py-0.5 rounded ${expanded ? 'text-[11px]' : 'text-[10px]'} ${signalBadgeCls(s.direction)}`}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
