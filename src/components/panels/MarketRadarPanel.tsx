import { useState, useCallback, useEffect } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { GaugeChart } from '@/components/charts/GaugeChart'
import { useMarketStore } from '@/stores'
import { usePolling } from '@/hooks/use-polling'
import { useMacroData } from '@/hooks/use-macro-data'
import { fetchSectors } from '@/services/api'
import type { MarketDataPoint, ForexRate, CryptoAsset } from '@/types'

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

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val))
}

function fearGreed(indices: { symbol: string; price: number }[]): number {
  const vix = indices.find((d) => d.symbol.toUpperCase().includes('VIX'))
  if (!vix) return 50
  const score = 90 - (vix.price - 10) * 3
  return clamp(score, 0, 100)
}

function sectorRotation(sectors: { changePercent: number }[] | null): number {
  if (!sectors || sectors.length === 0) return 50
  const changes = sectors.map((s) => s.changePercent).filter((c) => c != null && isFinite(c))
  if (changes.length === 0) return 50
  const spread = Math.max(...changes) - Math.min(...changes)
  return clamp(20 + (spread / 5) * 60, 0, 100)
}

function rateSensitivity(fredData: { seriesId: string; value: number }[] | null): number {
  if (!fredData) return 50
  const dgs2 = fredData.find((d) => d.seriesId === 'DGS2')
  const dgs10 = fredData.find((d) => d.seriesId === 'DGS10')
  if (!dgs2 || !dgs10) return 50
  const spread = dgs2.value - dgs10.value
  if (spread > 0) return clamp(30 - spread * 15, 0, 30)
  return clamp(70 + Math.abs(spread) * 15, 70, 100)
}

function commodityPressure(
  indices: { symbol: string; changePercent: number }[],
  commodities: { symbol: string; changePercent: number }[]
): number {
  const all = [...indices, ...commodities]
  const relevant = all.filter((d) => {
    const sym = d.symbol.toUpperCase()
    return sym === 'GLD' || sym === 'SLV' || sym === 'USO' || sym === 'UNG' || sym === 'COPX'
  })
  if (relevant.length === 0) return 50
  const avg = relevant.reduce((sum, d) => sum + d.changePercent, 0) / relevant.length
  return clamp(50 + (avg / 3) * 50, 0, 100)
}

function BreadthBar({ advances, declines }: { advances: number; declines: number }) {
  const total = advances + declines
  if (total === 0) return null
  const advPct = (advances / total) * 100
  const decPct = (declines / total) * 100
  const ratio = declines > 0 ? (advances / declines).toFixed(2) : advances > 0 ? '∞' : '0'

  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Advance / Decline</span>
          <span className="text-[10px] text-muted-foreground">A/D {ratio}</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden gap-px">
          <div
            className="bg-emerald-500 rounded-l-full transition-all duration-500"
            style={{ width: `${advPct}%` }}
          />
          <div
            className="bg-red-500 rounded-r-full transition-all duration-500"
            style={{ width: `${decPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-emerald-500">{advances} advancing</span>
          <span className="text-[10px] text-red-500">{declines} declining</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Breadth Meter</span>
        </div>
        <div className="relative h-3 bg-muted/40 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-red-500/70 rounded-l-full"
            style={{ width: `${decPct}%` }}
          />
          <div
            className="absolute right-0 top-0 h-full bg-emerald-500/70 rounded-r-full"
            style={{ width: `${advPct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-semibold text-foreground/80 leading-none">
              {advPct.toFixed(0)}% adv
            </span>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-center text-muted-foreground pt-1">
        {advances > declines ? (
          <span className="text-emerald-500 font-medium">Breadth bullish</span>
        ) : declines > advances ? (
          <span className="text-red-500 font-medium">Breadth bearish</span>
        ) : (
          <span>Breadth neutral</span>
        )}
        <span className="text-muted-foreground"> — A/D ratio {ratio}</span>
      </div>
    </div>
  )
}

function NewHighsLows({ gainers, losers }: { gainers: Mover[]; losers: Mover[] }) {
  const newHighs = gainers.filter((m) => m.changePercent > 5).length
  const newLows = losers.filter((m) => m.changePercent < -5).length
  const total = newHighs + newLows
  const highPct = total > 0 ? (newHighs / total) * 100 : 50

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">New Highs vs Lows</span>
        <span className="text-[10px] text-muted-foreground">&gt;5% move</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        <div
          className="bg-emerald-500 rounded-l-full transition-all duration-500"
          style={{ width: `${highPct}%` }}
        />
        <div
          className="bg-red-500 rounded-r-full transition-all duration-500"
          style={{ width: `${100 - highPct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-emerald-500">{newHighs} new highs</span>
        <span className="text-[10px] text-red-500">{newLows} new lows</span>
      </div>
    </div>
  )
}

// ── Signals tab ──────────────────────────────────────────────────────────────

interface Signal {
  name: string
  value: string
  direction: 'bull' | 'bear' | 'neutral'
}

function deriveSignals(
  indices: MarketDataPoint[],
  movers: MoversData | null
): Signal[] {
  const find = (sym: string) =>
    indices.find((d) => d.symbol.toUpperCase() === sym.toUpperCase())

  const spy = find('SPY')
  const qqq = find('QQQ')
  const iwm = find('IWM')
  const vix = indices.find((d) => d.symbol.toUpperCase().includes('VIX'))
  const xly = find('XLY')
  const xlp = find('XLP')

  const signals: Signal[] = []

  // Trend
  if (spy) {
    const bull = spy.changePercent > 0
    signals.push({
      name: 'Trend',
      value: bull ? 'BULLISH' : 'BEARISH',
      direction: bull ? 'bull' : 'bear',
    })
  } else {
    signals.push({ name: 'Trend', value: 'N/A', direction: 'neutral' })
  }

  // Momentum (QQQ vs IWM spread)
  if (qqq && iwm) {
    const spread = qqq.changePercent - iwm.changePercent
    const dir = spread > 0.5 ? 'bull' : spread < -0.5 ? 'bear' : 'neutral'
    const label = spread > 0.5 ? 'GROWTH LEADING' : spread < -0.5 ? 'VALUE LEADING' : 'MIXED'
    signals.push({ name: 'Momentum', value: label, direction: dir })
  } else {
    signals.push({ name: 'Momentum', value: 'N/A', direction: 'neutral' })
  }

  // Volatility via VIX
  if (vix) {
    const v = vix.price
    const label = v < 15 ? 'LOW' : v < 20 ? 'NORMAL' : v < 30 ? 'ELEVATED' : 'HIGH'
    const dir: Signal['direction'] = v < 20 ? 'bull' : v < 30 ? 'neutral' : 'bear'
    signals.push({ name: 'Volatility', value: label, direction: dir })
  } else {
    signals.push({ name: 'Volatility', value: 'N/A', direction: 'neutral' })
  }

  // Breadth
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

  // Rotation
  if (xly && xlp) {
    const riskOn = xly.changePercent > xlp.changePercent
    signals.push({
      name: 'Rotation',
      value: riskOn ? 'RISK-ON' : 'RISK-OFF',
      direction: riskOn ? 'bull' : 'bear',
    })
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
  return { label: 'NEUTRAL', color: 'text-yellow-500' }
}

function signalBadgeCls(direction: Signal['direction']) {
  if (direction === 'bull') return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
  if (direction === 'bear') return 'bg-red-500/15 text-red-400 border border-red-500/30'
  return 'bg-muted/40 text-muted-foreground border border-border'
}

function SignalsTab({ indices, movers }: { indices: MarketDataPoint[]; movers: MoversData | null }) {
  const expanded = useIsExpanded()
  const signals = deriveSignals(indices, movers)
  const composite = compositeSignal(signals)

  return (
    <div className="px-1 space-y-2">
      <div className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/30 border border-border">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Market Signal
        </span>
        <span className={`font-bold tracking-wide ${expanded ? 'text-[14px]' : 'text-[11px]'} ${composite.color}`}>
          {composite.label}
        </span>
      </div>
      <div className="space-y-1">
        {signals.map((s) => (
          <div key={s.name} className={`flex items-center justify-between px-1 ${expanded ? 'py-1.5' : 'py-1'}`}>
            <span className={`text-muted-foreground ${expanded ? 'text-[12px] w-28' : 'text-[10px] w-20'}`}>{s.name}</span>
            <span className={`font-semibold px-1.5 py-0.5 rounded ${expanded ? 'text-[11px]' : 'text-[9px]'} ${signalBadgeCls(s.direction)}`}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Alerts tab ───────────────────────────────────────────────────────────────

interface Alert {
  title: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  ts: number
}

function deriveAlerts(
  indices: MarketDataPoint[],
  forex: ForexRate[],
  crypto: CryptoAsset[]
): Alert[] {
  const alerts: Alert[] = []
  const now = Date.now()

  const find = (sym: string) =>
    indices.find((d) => d.symbol.toUpperCase() === sym.toUpperCase())

  // Selloff: any index down > 2%
  const selloff = indices.filter((d) => d.changePercent < -2)
  if (selloff.length > 0) {
    alerts.push({ title: 'SELLOFF ALERT', severity: 'CRITICAL', ts: now })
  }

  // VIX spike
  const vix = indices.find((d) => d.symbol.toUpperCase().includes('VIX'))
  if (vix && vix.price > 25) {
    alerts.push({ title: 'VOLATILITY SPIKE', severity: 'WARNING', ts: now })
  }

  // BTC dump > 5%
  const btc = crypto.find((c) => c.symbol.toUpperCase() === 'BTC' || c.id === 'bitcoin')
  if (btc && btc.changePercent24h < -5) {
    alerts.push({ title: 'CRYPTO DUMP', severity: 'WARNING', ts: now })
  }

  // Dollar surge: DXY proxy via USD/JPY or EUR/USD strong dollar
  const eurusd = forex.find((f) => f.pair === 'EUR/USD' || f.pair === 'EURUSD')
  const usdjpy = forex.find((f) => f.pair === 'USD/JPY' || f.pair === 'USDJPY')
  const dollarSurge =
    (eurusd && eurusd.changePercent < -0.5) || (usdjpy && usdjpy.changePercent > 0.5)
  if (dollarSurge) {
    alerts.push({ title: 'DOLLAR SURGE', severity: 'INFO', ts: now })
  }

  // Risk-on rally: all major indices green
  const majors = ['SPY', 'QQQ', 'IWM'].map(find).filter(Boolean) as MarketDataPoint[]
  if (majors.length === 3 && majors.every((d) => d.changePercent > 0)) {
    alerts.push({ title: 'RISK-ON RALLY', severity: 'INFO', ts: now })
  }

  return alerts
}

function severityCls(s: Alert['severity']) {
  if (s === 'CRITICAL') return 'bg-red-500/15 text-red-400 border border-red-500/30'
  if (s === 'WARNING') return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
  return 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function AlertsTab({
  indices,
  forex,
  crypto,
}: {
  indices: MarketDataPoint[]
  forex: ForexRate[]
  crypto: CryptoAsset[]
}) {
  const expanded = useIsExpanded()
  const alerts = deriveAlerts(indices, forex, crypto)

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center px-2">
        <span className="text-emerald-500 text-lg">&#10003;</span>
        <span className="text-[11px] text-emerald-500 font-medium">All Clear</span>
        <span className="text-[10px] text-muted-foreground">No active market alerts</span>
      </div>
    )
  }

  return (
    <div className="px-1 space-y-1.5">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={`flex items-center justify-between px-2 rounded-md bg-muted/20 border border-border ${expanded ? 'py-2.5' : 'py-1.5'}`}
        >
          <div className="flex items-center gap-2">
            <span className={`font-bold px-1.5 py-0.5 rounded ${expanded ? 'text-[11px]' : 'text-[9px]'} ${severityCls(a.severity)}`}>
              {a.severity}
            </span>
            <span className={`text-foreground font-medium ${expanded ? 'text-[12px]' : 'text-[10px]'}`}>{a.title}</span>
          </div>
          <span className="text-[9px] text-muted-foreground">{fmtTime(a.ts)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main panel ───────────────────────────────────────────────────────────────

export default function MarketRadarPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'gauges' | 'breadth' | 'signals' | 'alerts'>('gauges')
  const [movers, setMovers] = useState<MoversData | null>(null)

  const indices = useMarketStore((s) => s.indices)
  const commodities = useMarketStore((s) => s.commodities)
  const forex = useMarketStore((s) => s.forex)
  const crypto = useMarketStore((s) => s.crypto)

  const sectorFetcher = useCallback(() => fetchSectors(), [])
  const { data: sectors } = usePolling({ fetcher: sectorFetcher, interval: 60_000 })
  const { data: fredData } = useMacroData()

  useEffect(() => {
    if (tab === 'breadth' || tab === 'signals') {
      fetch('/api/market/movers')
        .then((r) => r.json())
        .then(setMovers)
        .catch(() => {})
    }
  }, [tab])

  const gauges = [
    { value: fearGreed(indices), label: 'Fear / Greed' },
    { value: sectorRotation(sectors), label: 'Sector Rotation' },
    { value: rateSensitivity(fredData), label: 'Rate Sensitivity' },
    { value: commodityPressure(indices, commodities), label: 'Commodity Pressure' },
  ]

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Market Radar">
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'gauges')} onClick={() => setTab('gauges')}>Gauges</button>
        <button className={tabCls(tab === 'breadth')} onClick={() => setTab('breadth')}>Breadth</button>
        <button className={tabCls(tab === 'signals')} onClick={() => setTab('signals')}>Signals</button>
        <button className={tabCls(tab === 'alerts')} onClick={() => setTab('alerts')}>Alerts</button>
      </div>

      {tab === 'gauges' && (
        <div className={`grid grid-cols-2 p-2 h-full place-items-center ${expanded ? 'gap-6' : 'gap-4'}`}>
          {gauges.map((g) => (
            <GaugeChart key={g.label} value={g.value} label={g.label} size={expanded ? 150 : 110} />
          ))}
        </div>
      )}

      {tab === 'breadth' && (
        <div className="px-1 space-y-4">
          {movers ? (
            <>
              <BreadthBar advances={movers.gainers.length} declines={movers.losers.length} />
              <NewHighsLows gainers={movers.gainers} losers={movers.losers} />
            </>
          ) : (
            <div className="text-[10px] text-muted-foreground text-center pt-6">Loading breadth data...</div>
          )}
        </div>
      )}

      {tab === 'signals' && (
        <SignalsTab indices={indices} movers={movers} />
      )}

      {tab === 'alerts' && (
        <AlertsTab indices={indices} forex={forex} crypto={crypto} />
      )}
    </PanelWrapper>
  )
}
