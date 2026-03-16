import { useIsExpanded } from '@/components/layout/PanelWrapper'
import type { MarketDataPoint, ForexRate, CryptoAsset } from '@/types'

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

  const selloff = indices.filter((d) => d.changePercent < -2)
  if (selloff.length > 0) {
    alerts.push({ title: 'SELLOFF ALERT', severity: 'CRITICAL', ts: now })
  }

  const vix = indices.find((d) => d.symbol.toUpperCase().includes('VIX'))
  if (vix && vix.price > 25) {
    alerts.push({ title: 'VOLATILITY SPIKE', severity: 'WARNING', ts: now })
  }

  const btc = crypto.find((c) => c.symbol.toUpperCase() === 'BTC' || c.id === 'bitcoin')
  if (btc && btc.changePercent24h < -5) {
    alerts.push({ title: 'CRYPTO DUMP', severity: 'WARNING', ts: now })
  }

  const eurusd = forex.find((f) => f.pair === 'EUR/USD' || f.pair === 'EURUSD')
  const usdjpy = forex.find((f) => f.pair === 'USD/JPY' || f.pair === 'USDJPY')
  const dollarSurge =
    (eurusd && eurusd.changePercent < -0.5) || (usdjpy && usdjpy.changePercent > 0.5)
  if (dollarSurge) {
    alerts.push({ title: 'DOLLAR SURGE', severity: 'INFO', ts: now })
  }

  const majors = ['SPY', 'QQQ', 'IWM'].map(find).filter(Boolean) as MarketDataPoint[]
  if (majors.length === 3 && majors.every((d) => d.changePercent > 0)) {
    alerts.push({ title: 'RISK-ON RALLY', severity: 'INFO', ts: now })
  }

  return alerts
}

function severityCls(s: Alert['severity']) {
  if (s === 'CRITICAL') return 'bg-red-500/15 text-red-400 border border-red-500/30'
  if (s === 'WARNING') return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
  return 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

interface Props {
  indices: MarketDataPoint[]
  forex: ForexRate[]
  crypto: CryptoAsset[]
}

export function MarketRadarAlertsTab({ indices, forex, crypto }: Props) {
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
            <span className={`font-bold px-1.5 py-0.5 rounded ${expanded ? 'text-[11px]' : 'text-[10px]'} ${severityCls(a.severity)}`}>
              {a.severity}
            </span>
            <span className={`text-foreground font-medium ${expanded ? 'text-[12px]' : 'text-[10px]'}`}>{a.title}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{fmtTime(a.ts)}</span>
        </div>
      ))}
    </div>
  )
}
