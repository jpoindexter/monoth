import { useIsExpanded } from '@/components/layout/PanelWrapper'
import type { FredSeries } from '@/services/api/macro'

type IndicatorSignal = 'expanding' | 'contracting' | 'rising' | 'falling' | 'inverted' | 'flat' | 'steep'

interface LeadingIndicator {
  name: string
  reading: string
  signal: IndicatorSignal
  badgeLabel: string
}

const SIGNAL_COLORS: Record<IndicatorSignal, string> = {
  expanding: 'text-emerald-500',
  rising: 'text-emerald-500',
  steep: 'text-emerald-500',
  contracting: 'text-red-500',
  falling: 'text-red-500',
  inverted: 'text-red-500',
  flat: 'text-amber-500',
}

const SIGNAL_BG: Record<IndicatorSignal, string> = {
  expanding: 'bg-emerald-500/10',
  rising: 'bg-emerald-500/10',
  steep: 'bg-emerald-500/10',
  contracting: 'bg-red-500/10',
  falling: 'bg-red-500/10',
  inverted: 'bg-red-500/10',
  flat: 'bg-amber-500/10',
}

type LeiComposite = 'EXPANSION' | 'MIXED' | 'CONTRACTION'

const LEI_COMPOSITE_COLORS: Record<LeiComposite, string> = {
  EXPANSION: '#10b981',
  MIXED: '#eab308',
  CONTRACTION: '#ef4444',
}

function buildIndicators(fredData: FredSeries[]): LeadingIndicator[] {
  const get = (id: string) => fredData.find(d => d.seriesId === id)
  const dgs2 = get('DGS2')
  const dgs10 = get('DGS10')
  const cpi = get('CPI')
  const unrate = get('UNRATE')
  const fedfunds = get('FEDFUNDS')

  const indicators: LeadingIndicator[] = []

  if (dgs2 && dgs10) {
    const spread = dgs10.value - dgs2.value
    indicators.push({
      name: 'Yield Curve (2s10s)',
      reading: `${spread >= 0 ? '+' : ''}${spread.toFixed(2)}%`,
      signal: spread < 0 ? 'inverted' : spread < 0.25 ? 'flat' : 'steep',
      badgeLabel: spread < 0 ? 'INVERTED' : spread < 0.25 ? 'FLAT' : 'STEEP',
    })
  }

  if (dgs10) {
    const v = dgs10.value
    indicators.push({
      name: '10Y Treasury Yield',
      reading: `${v.toFixed(2)}%`,
      signal: v > 4.5 ? 'rising' : v < 3.5 ? 'falling' : 'flat',
      badgeLabel: v > 4.5 ? 'ELEVATED' : v < 3.5 ? 'LOW' : 'NEUTRAL',
    })
  }

  if (dgs2) {
    const v = dgs2.value
    indicators.push({
      name: '2Y Treasury Yield',
      reading: `${v.toFixed(2)}%`,
      signal: v > 4.5 ? 'rising' : v < 3.5 ? 'falling' : 'flat',
      badgeLabel: v > 4.5 ? 'ELEVATED' : v < 3.5 ? 'LOW' : 'NEUTRAL',
    })
  }

  if (fedfunds) {
    const v = fedfunds.value
    indicators.push({
      name: 'Fed Funds Rate',
      reading: `${v.toFixed(2)}%`,
      signal: v > 4 ? 'contracting' : v < 2 ? 'expanding' : 'flat',
      badgeLabel: v > 4 ? 'RESTRICTIVE' : v < 2 ? 'ACCOMMODATIVE' : 'NEUTRAL',
    })
  }

  if (cpi) {
    const v = cpi.value
    indicators.push({
      name: 'CPI Inflation',
      reading: `${v.toFixed(1)}%`,
      signal: v > 3 ? 'rising' : v < 2 ? 'falling' : 'flat',
      badgeLabel: v > 3 ? 'ABOVE TARGET' : v < 2 ? 'BELOW TARGET' : 'ON TARGET',
    })
  }

  if (unrate) {
    const v = unrate.value
    indicators.push({
      name: 'Unemployment Rate',
      reading: `${v.toFixed(1)}%`,
      signal: v > 5 ? 'rising' : v < 4 ? 'falling' : 'flat',
      badgeLabel: v > 5 ? 'ELEVATED' : v < 4 ? 'LOW' : 'NEUTRAL',
    })
  }

  return indicators
}

function computeLei(indicators: LeadingIndicator[]): { composite: LeiComposite; score: number } {
  const positive: IndicatorSignal[] = ['expanding', 'rising', 'steep']
  let bullish = 0
  let bearish = 0
  for (const ind of indicators) {
    if (positive.includes(ind.signal)) bullish++
    else if (ind.signal !== 'flat') bearish++
  }
  const score = indicators.length === 0 ? 50 : Math.round((bullish / indicators.length) * 100)
  const composite: LeiComposite = score >= 60 ? 'EXPANSION' : score <= 40 ? 'CONTRACTION' : 'MIXED'
  return { composite, score }
}

interface Props {
  fredData: FredSeries[]
}

export function MacroSignalsIndicatorsTab({ fredData }: Props) {
  const expanded = useIsExpanded()
  const indicators = buildIndicators(fredData)
  const hasData = indicators.length > 0
  const { composite, score } = computeLei(hasData ? indicators : [])
  const color = LEI_COMPOSITE_COLORS[composite]

  return (
    <div className="space-y-2">
      <div
        className="rounded-md px-3 py-2 flex items-center justify-between"
        style={{ backgroundColor: color + '1a', border: `1px solid ${color}33` }}
      >
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">LEI Composite</div>
          <div className={`font-bold tracking-wider ${expanded ? 'text-xl' : 'text-base'}`} style={{ color }}>
            {hasData ? composite : 'Calculating...'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground">Score</div>
          <div className={`font-bold tabular-nums ${expanded ? 'text-2xl' : 'text-lg'}`} style={{ color }}>
            {hasData ? score : '—'}
          </div>
        </div>
      </div>

      {!hasData && (
        <div className="text-[10px] text-muted-foreground text-center py-2">Loading FRED data...</div>
      )}

      <div className="space-y-1">
        {indicators.map((ind) => (
          <div key={ind.name} className={`flex items-center justify-between px-1.5 rounded-sm ${SIGNAL_BG[ind.signal]} ${expanded ? 'py-1.5' : 'py-1'}`}>
            <div className="min-w-0">
              <div className={`font-medium text-foreground leading-tight ${expanded ? 'text-[12px]' : 'text-[10px]'}`}>{ind.name}</div>
              <div className={`text-muted-foreground tabular-nums ${expanded ? 'text-[11px]' : 'text-[10px]'}`}>{ind.reading}</div>
            </div>
            <span className={`font-bold uppercase tracking-wider shrink-0 ml-2 ${expanded ? 'text-[11px]' : 'text-[10px]'} ${SIGNAL_COLORS[ind.signal]}`}>
              {ind.badgeLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
