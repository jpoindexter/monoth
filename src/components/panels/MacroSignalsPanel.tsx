import { useState, useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { useMacroData } from '@/hooks/use-macro-data'
import { useMarketStore } from '@/stores/market-store'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import type { MarketDataPoint, ForexRate } from '@/types'
import type { FredSeries } from '@/services/api/macro'

interface MacroSignal {
  name: string
  value: number
  label: string
  status: 'bullish' | 'bearish' | 'neutral'
  detail: string
}

const STATUS_COLORS = {
  bullish: 'text-emerald-600',
  bearish: 'text-red-500',
  neutral: 'text-yellow-500',
}

const STATUS_BG = {
  bullish: 'bg-emerald-500/10',
  bearish: 'bg-red-500/10',
  neutral: 'bg-yellow-500/10',
}

function GaugeChart({ value, label }: { value: number; label: string }) {
  const angle = -90 + (value / 100) * 180
  const r = 40
  const cx = 50
  const cy = 50

  const color = value >= 60 ? '#059669' : value <= 40 ? '#ef4444' : '#eab308'

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="60" viewBox="0 0 100 60">
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-border/40"
          strokeLinecap="round"
        />
        <path d="M 10 50 A 40 40 0 0 1 30 14" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        <path d="M 30 14 A 40 40 0 0 1 50 10" fill="none" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        <path d="M 50 10 A 40 40 0 0 1 70 14" fill="none" stroke="#eab308" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        <path d="M 70 14 A 40 40 0 0 1 90 50" fill="none" stroke="#059669" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        <line
          x1={cx}
          y1={cy}
          x2={cx + r * 0.75 * Math.cos((angle * Math.PI) / 180)}
          y2={cy + r * 0.75 * Math.sin((angle * Math.PI) / 180)}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="3" fill={color} />
      </svg>
      <div className="text-center -mt-1">
        <span className="text-lg font-bold tabular-nums" style={{ color }}>{value}</span>
        <span className="block text-[8px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

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

function RegimeTab({ indices, fredData }: { indices: MarketDataPoint[]; fredData: FredSeries[] }) {
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
        <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
          <span>Confidence</span>
          <span>{r.confidence}%</span>
        </div>
        <div className="h-2 rounded-full bg-border/30">
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${r.confidence}%`, backgroundColor: r.color }}
          />
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-foreground/80">{r.description}</p>

      <div className="space-y-1 pt-1 border-t border-border/20">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Inputs</div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">SPY Change</span>
          <span className={r.spyChg >= 0 ? 'text-emerald-500' : 'text-red-500'}>
            {r.spyChg >= 0 ? '+' : ''}{r.spyChg.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">VIX Level</span>
          <span className={r.vixLevel > 25 ? 'text-red-500' : r.vixLevel < 15 ? 'text-emerald-500' : 'text-yellow-500'}>
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
    </div>
  )
}

function JpyIndicator({ forex }: { forex: ForexRate[] }) {
  const jpyPair = forex.find(f => f.pair.includes('JPY') && f.pair.startsWith('USD'))
    ?? forex.find(f => f.pair.includes('JPY'))

  if (!jpyPair) {
    return (
      <div className="text-[10px] text-muted-foreground text-center py-2">JPY data unavailable</div>
    )
  }

  const rate = jpyPair.rate
  const chg = jpyPair.changePercent

  // Normalize: JPY strength index (higher = stronger JPY = lower USD/JPY)
  // Use a rough range of 100-160 for USD/JPY
  const normalized = Math.max(0, Math.min(100, ((160 - rate) / 60) * 100))
  const isCarryUnwind = chg < -0.5 // JPY strengthening (USD/JPY falling fast)

  return (
    <div className="space-y-2 pt-1 border-t border-border/20">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">JPY Liquidity Proxy</span>
        {isCarryUnwind && (
          <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-orange-500/20 text-orange-400 tracking-wider">
            CARRY UNWIND
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div>
          <div className="text-[9px] text-muted-foreground">{jpyPair.pair}</div>
          <div className="text-sm font-bold tabular-nums">{rate.toFixed(2)}</div>
          <div className={`text-[9px] tabular-nums ${chg >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
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
          <div className="flex justify-between text-[8px] text-muted-foreground mt-0.5">
            <span>Weak</span>
            <span>Strong</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MacroSignalsPanel() {
  const [tab, setTab] = useState<'signals' | 'regime'>('signals')

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/macro/signals')
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<MacroSignal[]>
  }, [])

  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 600_000 })
  const { data: fredData } = useMacroData()

  const indices = useMarketStore((s) => s.indices)
  const forex = useMarketStore((s) => s.forex)

  const fearGreed = data?.find((s) => s.name === 'Fear & Greed')
  const otherSignals = data?.filter((s) => s.name !== 'Fear & Greed')

  const bullCount = data?.filter((s) => s.status === 'bullish').length ?? 0
  const bearCount = data?.filter((s) => s.status === 'bearish').length ?? 0
  const total = data?.length ?? 0

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Macro Signals" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'signals')} onClick={() => setTab('signals')}>Signals</button>
        <button className={tabCls(tab === 'regime')} onClick={() => setTab('regime')}>Regime</button>
      </div>

      {tab === 'signals' && (
        <>
          {fearGreed && (
            <div className="flex items-center gap-3 mb-2 pb-2 border-b border-border/20">
              <GaugeChart value={fearGreed.value} label={fearGreed.label} />
              <div className="flex-1 text-[10px]">
                <div className="text-muted-foreground mb-1">Market Sentiment</div>
                <div className="flex gap-2">
                  <span className="text-emerald-600 font-medium">{bullCount} bullish</span>
                  <span className="text-red-500 font-medium">{bearCount} bearish</span>
                  <span className="text-muted-foreground">{total - bullCount - bearCount} neutral</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {otherSignals?.map((signal) => (
              <div key={signal.name} className={`flex items-center justify-between py-1.5 px-1.5 rounded-sm ${STATUS_BG[signal.status]}`}>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-foreground">{signal.name}</div>
                  <div className="text-[9px] text-muted-foreground">{signal.detail}</div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className={`text-[11px] font-bold uppercase tracking-wider ${STATUS_COLORS[signal.status]}`}>
                    {signal.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'regime' && (
        <div className="space-y-3">
          <RegimeTab indices={indices} fredData={fredData ?? []} />
          <JpyIndicator forex={forex} />
        </div>
      )}
    </PanelWrapper>
  )
}
