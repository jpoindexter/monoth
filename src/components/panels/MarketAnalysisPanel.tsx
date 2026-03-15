import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { useMarketStore } from '@/stores/market-store'
import { relTime } from '@/lib/panel-utils'

interface CorrelationEvent {
  event: string
  actual: number
  estimate: number
  surprise: number
  date: string
}

type Signal = 'bullish' | 'bearish' | 'neutral'

interface SentimentSource {
  name: string
  signal: Signal
}

const SIGNAL_COLORS: Record<Signal, string> = {
  bullish: 'bg-emerald-500',
  bearish: 'bg-red-500',
  neutral: 'bg-yellow-400',
}

const SIGNAL_TEXT: Record<Signal, string> = {
  bullish: 'text-emerald-600',
  bearish: 'text-red-500',
  neutral: 'text-yellow-500',
}

const SIGNAL_WEIGHTS: Record<Signal, number> = { bullish: 1, neutral: 0, bearish: -1 }

const CYCLICAL = ['XLY', 'XLI', 'XLF']
const DEFENSIVE = ['XLU', 'XLP', 'XLV']

function deriveSentiment(indices: ReturnType<typeof useMarketStore.getState>['indices']): SentimentSource[] {
  const spy = indices.find((i) => i.symbol === 'SPY')
  const spyPct = spy?.changePercent ?? 0

  const technical: Signal = spyPct > 0.3 ? 'bullish' : spyPct < -0.3 ? 'bearish' : 'neutral'

  const month = new Date().getMonth() + 1
  const earningsSeason = [1, 4, 7, 10].includes(month)
  const fundamental: Signal = earningsSeason ? 'bullish' : 'neutral'

  const top7 = indices.slice(0, 7)
  const positiveCount = top7.filter((i) => i.changePercent > 0).length
  const momentum: Signal = positiveCount >= 3 ? 'bullish' : positiveCount <= 2 ? 'bearish' : 'neutral'

  const totalVolume = indices.reduce((sum, i) => sum + (i.volume ?? 0), 0)
  const avgVolume = indices.length ? totalVolume / indices.length : 0
  const flow: Signal = avgVolume > 1_000_000 ? 'bullish' : avgVolume > 0 ? 'neutral' : 'neutral'

  const vixLike = indices.find((i) => i.symbol === 'VIX' || i.symbol === '^VIX')
  const vix = vixLike?.price ?? null
  const volatility: Signal = vix === null ? 'neutral' : vix < 15 ? 'bullish' : vix > 25 ? 'bearish' : 'neutral'

  return [
    { name: 'Technical', signal: technical },
    { name: 'Fundamental', signal: fundamental },
    { name: 'Momentum', signal: momentum },
    { name: 'Flow', signal: flow },
    { name: 'Volatility', signal: volatility },
  ]
}

// --- Technicals tab ---
interface TechState {
  spyPrice: number | null
  dma50: number | null
  dma200: number | null
  loading: boolean
}

function sma(closes: number[], period: number): number | null {
  if (closes.length < period) return null
  const slice = closes.slice(closes.length - period)
  return slice.reduce((a, b) => a + b, 0) / period
}

// Static fallback levels — displayed only if candle data is available to provide context
const SUPPORT_LEVELS = [510, 500, 490]
const RESISTANCE_LEVELS = [535, 545, 560]

function deriveTechnicalOutlook(spyPrice: number | null, dma50: number | null, dma200: number | null): Signal {
  if (spyPrice === null || dma50 === null || dma200 === null) return 'neutral'
  const aboveBoth = spyPrice > dma50 && spyPrice > dma200
  const belowBoth = spyPrice < dma50 && spyPrice < dma200
  if (aboveBoth) return 'bullish'
  if (belowBoth) return 'bearish'
  return 'neutral'
}

// --- Static data for Flows tab ---
interface FlowItem {
  name: string
  flow: number // in billions
}

const ETF_FLOWS: FlowItem[] = [
  { name: 'US Equity', flow: 2.1 },
  { name: 'Intl Equity', flow: -0.8 },
  { name: 'Fixed Income', flow: 1.5 },
  { name: 'Money Market', flow: 3.2 },
  { name: 'Commodities', flow: 0.4 },
  { name: 'Crypto', flow: 0.6 },
]

const MAX_FLOW = Math.max(...ETF_FLOWS.map((f) => Math.abs(f.flow)))

function deriveRiskAppetite(): Signal {
  const usEquity = ETF_FLOWS.find((f) => f.name === 'US Equity')?.flow ?? 0
  const moneyMkt = ETF_FLOWS.find((f) => f.name === 'Money Market')?.flow ?? 0
  if (usEquity > 0 && usEquity > moneyMkt * 0.5) return 'bullish'
  if (moneyMkt > usEquity * 1.5) return 'bearish'
  return 'neutral'
}

export default function MarketAnalysisPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'events' | 'news' | 'sentiment' | 'technicals' | 'flows'>('news')
  const { data: newsData, loading: newsLoading, error, refresh } = useNewsData('analysis')
  const { data: events, loading: evLoading } = usePolling<CorrelationEvent[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/correlation/events')
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      return res.json()
    }, []),
    interval: 600_000,
    enabled: tab === 'events',
  })

  const sectorData = useMarketStore((s) => s.sectorData)

  const indices = useMarketStore((s) => s.indices)

  const [tech, setTech] = useState<TechState>({ spyPrice: null, dma50: null, dma200: null, loading: false })

  useEffect(() => {
    if (tab !== 'technicals') return
    if (tech.spyPrice !== null) return
    setTech((s) => ({ ...s, loading: true }))
    fetch('/api/market/candles?symbol=SPY')
      .then((r) => r.json())
      .then((candles: { close: number }[]) => {
        if (!Array.isArray(candles) || !candles.length) return
        const closes = candles.map((c) => c.close)
        const spyPrice = closes[closes.length - 1]
        const dma50 = sma(closes, 50)
        const dma200 = sma(closes, 200)
        setTech({ spyPrice, dma50, dma200, loading: false })
      })
      .catch(() => setTech((s) => ({ ...s, loading: false })))
  }, [tab])

  const sentimentSources = useMemo(() => deriveSentiment(indices), [indices])

  const consensusScore = useMemo(() => {
    const sum = sentimentSources.reduce((acc, s) => acc + SIGNAL_WEIGHTS[s.signal], 0)
    return sum / sentimentSources.length
  }, [sentimentSources])

  const consensusSignal: Signal = consensusScore > 0.2 ? 'bullish' : consensusScore < -0.2 ? 'bearish' : 'neutral'
  const consensusLabel = consensusSignal.toUpperCase()

  const rotationResult = useMemo(() => {
    if (!sectorData?.length) return null
    const avg = (syms: string[]) => {
      const matches = sectorData.filter((s) => syms.includes(s.symbol))
      if (!matches.length) return 0
      return matches.reduce((sum, s) => sum + s.changePercent, 0) / matches.length
    }
    const cyclicalAvg = avg(CYCLICAL)
    const defensiveAvg = avg(DEFENSIVE)
    const spread = cyclicalAvg - defensiveAvg
    return { cyclicalAvg, defensiveAvg, spread }
  }, [sectorData])

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Market Analysis" loading={newsLoading && evLoading} error={error} onRetry={refresh}>
      <div className="flex flex-wrap gap-1 mb-2">
        <button className={tabCls(tab === 'events')} onClick={() => setTab('events')}>Surprises</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
        <button className={tabCls(tab === 'sentiment')} onClick={() => setTab('sentiment')}>Sentiment</button>
        <button className={tabCls(tab === 'technicals')} onClick={() => setTab('technicals')}>Technicals</button>
        <button className={tabCls(tab === 'flows')} onClick={() => setTab('flows')}>Flows</button>
      </div>

      {tab === 'events' && (
        <div className="space-y-0">
          {events?.slice(0, expanded ? 30 : 15).map((ev, i) => {
            const isPositive = ev.surprise > 0
            return (
              <div key={`${ev.event}-${i}`} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
                <div className="flex-1 min-w-0">
                  <span className={`font-medium block ${expanded ? 'text-[13px]' : 'text-[11px] truncate'}`}>{ev.event}</span>
                  <span className="text-[10px] text-muted-foreground">{ev.date}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    Est {ev.estimate.toFixed(2)} / Act {ev.actual.toFixed(2)}
                  </span>
                  <span className={`ml-1.5 text-[10px] tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{ev.surprise.toFixed(2)}
                  </span>
                </div>
              </div>
            )
          })}
          {!events?.length && !evLoading && (
            <p className="text-[10px] text-muted-foreground">No recent economic events</p>
          )}
        </div>
      )}

      {tab === 'news' && (
        <div className="space-y-0">
          {(expanded ? newsData : newsData?.slice(0, 8))?.map((item) => {
            const cls = classifyHeadline(item.title)
            return (
              <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-1 px-1 rounded-sm transition-colors">
                <div className="flex-1 min-w-0">
                  {cls && (
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                      style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}>
                      {CATEGORY_LABELS[cls.category]}
                    </span>
                  )}
                  <span className={`font-medium leading-snug text-foreground ${expanded ? 'text-[13px]' : 'text-[11px] line-clamp-2'}`}>{item.title}</span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">{relTime(item.published)}</span>
              </a>
            )
          })}
        </div>
      )}

      {tab === 'sentiment' && (
        <div className="space-y-3">
          <div className="space-y-2">
            {sentimentSources.map((src) => (
              <div key={src.name} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{src.name}</span>
                  <span className={`text-[10px] font-bold uppercase ${SIGNAL_TEXT[src.signal]}`}>{src.signal}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-border/30">
                  <div className={`h-2 rounded-full ${SIGNAL_COLORS[src.signal]} transition-all`}
                    style={{ width: src.signal === 'neutral' ? '50%' : src.signal === 'bullish' ? '80%' : '20%' }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Consensus</span>
              <span className={`text-[13px] font-bold ${SIGNAL_TEXT[consensusSignal]}`}>{consensusLabel}</span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-border/30">
              <div className={`h-2 rounded-full ${SIGNAL_COLORS[consensusSignal]} transition-all`}
                style={{ width: `${Math.round(((consensusScore + 1) / 2) * 100)}%` }} />
            </div>
          </div>

          {rotationResult && (
            <div className="pt-2 border-t border-border/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sector Rotation</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                  rotationResult.spread > 0
                    ? 'bg-emerald-500/15 text-emerald-600'
                    : 'bg-red-500/15 text-red-500'
                }`}>
                  {rotationResult.spread > 0 ? 'RISK-ON ROTATION' : 'RISK-OFF ROTATION'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Cyclical {rotationResult.cyclicalAvg >= 0 ? '+' : ''}{rotationResult.cyclicalAvg.toFixed(2)}%</span>
                <span className="tabular-nums">Spread {rotationResult.spread >= 0 ? '+' : ''}{rotationResult.spread.toFixed(2)}%</span>
                <span>Defensive {rotationResult.defensiveAvg >= 0 ? '+' : ''}{rotationResult.defensiveAvg.toFixed(2)}%</span>
              </div>
            </div>
          )}

          {!rotationResult && (
            <p className="text-[10px] text-muted-foreground pt-2 border-t border-border/30">Loading sector data...</p>
          )}
        </div>
      )}

      {tab === 'technicals' && (() => {
        const { spyPrice, dma50, dma200, loading: techLoading } = tech
        const outlook = deriveTechnicalOutlook(spyPrice, dma50, dma200)
        if (techLoading) {
          return <p className="text-[10px] text-muted-foreground">Computing technicals...</p>
        }
        return (
          <div className="space-y-3">
            {/* Moving Averages */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Moving Averages · SPY</span>
              {spyPrice !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground w-16">Price</span>
                  <span className="text-[10px] tabular-nums font-semibold text-foreground">${spyPrice.toFixed(2)}</span>
                  <span />
                </div>
              )}
              {[{ label: '50 DMA', level: dma50 }, { label: '200 DMA', level: dma200 }].map(({ label, level }) => {
                if (level === null || spyPrice === null) {
                  return (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground w-16">{label}</span>
                      <span className="text-[10px] text-muted-foreground">—</span>
                      <span />
                    </div>
                  )
                }
                const above = spyPrice > level
                return (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground w-16">{label}</span>
                    <span className="text-[10px] tabular-nums font-medium">${level.toFixed(2)}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-px rounded-sm ${above ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'}`}>
                      SPY {above ? `+$${(spyPrice - level).toFixed(0)}` : `-$${(level - spyPrice).toFixed(0)}`}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Levels */}
            {spyPrice !== null && (
              <div className="pt-2 border-t border-border/30 grid grid-cols-2 gap-x-3 gap-y-1">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-600 block mb-1">Support</span>
                  {SUPPORT_LEVELS.map((lvl) => (
                    <div key={lvl} className="flex items-center justify-between">
                      <div className="h-1 flex-1 mr-2 rounded-full bg-emerald-500/20">
                        <div className="h-1 rounded-full bg-emerald-500" style={{ width: `${(lvl / spyPrice) * 100}%` }} />
                      </div>
                      <span className="text-[10px] tabular-nums font-medium">${lvl}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-red-500 block mb-1">Resistance</span>
                  {RESISTANCE_LEVELS.map((lvl) => (
                    <div key={lvl} className="flex items-center justify-between">
                      <div className="h-1 flex-1 mr-2 rounded-full bg-red-500/20">
                        <div className="h-1 rounded-full bg-red-500" style={{ width: `${(spyPrice / lvl) * 100}%` }} />
                      </div>
                      <span className="text-[10px] tabular-nums font-medium">${lvl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Outlook */}
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Technical Outlook</span>
              <span className={`text-[13px] font-bold ${SIGNAL_TEXT[outlook]}`}>{outlook.toUpperCase()}</span>
            </div>
          </div>
        )
      })()}

      {tab === 'flows' && (() => {
        const riskAppetite = deriveRiskAppetite()
        const totalEquity = ETF_FLOWS.filter((f) => f.name.includes('Equity')).reduce((s, f) => s + f.flow, 0)
        const moneyMkt = ETF_FLOWS.find((f) => f.name === 'Money Market')?.flow ?? 0
        return (
          <div className="space-y-3">
            <div className="space-y-1.5">
              {ETF_FLOWS.map((item) => {
                const pos = item.flow >= 0
                const barPct = (Math.abs(item.flow) / MAX_FLOW) * 100
                const fmt = (v: number) => `${v >= 0 ? '+' : ''}$${Math.abs(v) >= 1 ? `${v.toFixed(1)}B` : `${(v * 1000).toFixed(0)}M`}`
                return (
                  <div key={item.name} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground w-24">{item.name}</span>
                      <div className="flex-1 mx-2 h-2 rounded-full bg-border/30 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${pos ? 'bg-emerald-500' : 'bg-red-500'} transition-all`}
                          style={{ width: `${barPct}%`, marginLeft: pos ? '0' : 'auto' }}
                        />
                      </div>
                      <div className="flex items-center gap-1 w-16 justify-end">
                        <span className={`text-[10px] tabular-nums font-medium ${pos ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(item.flow)}</span>
                        <span className={`text-[10px] ${pos ? 'text-emerald-600' : 'text-red-500'}`}>{pos ? '▲' : '▼'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Risk Appetite */}
            <div className="pt-2 border-t border-border/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Appetite</span>
                <span className={`text-[13px] font-bold ${SIGNAL_TEXT[riskAppetite]}`}>{riskAppetite.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Equity flows {totalEquity >= 0 ? '+' : ''}${totalEquity.toFixed(1)}B</span>
                <span>Money Mkt +${moneyMkt.toFixed(1)}B</span>
              </div>
            </div>
          </div>
        )
      })()}

    </PanelWrapper>
  )
}
