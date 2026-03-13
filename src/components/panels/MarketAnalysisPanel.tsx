import { useState, useCallback, useMemo } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { useMarketStore } from '@/stores/market-store'
import { fetchSectors } from '@/services/api'

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

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
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

export default function MarketAnalysisPanel() {
  const [tab, setTab] = useState<'events' | 'news' | 'sentiment'>('news')
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

  const { data: sectorData } = usePolling<{ symbol: string; name: string; price: number; change: number; changePercent: number }[]>({
    fetcher: useCallback(() => fetchSectors(), []),
    interval: 120_000,
    enabled: tab === 'sentiment',
  })

  const indices = useMarketStore((s) => s.indices)

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
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Market Analysis" loading={newsLoading && evLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'events')} onClick={() => setTab('events')}>Surprises</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
        <button className={tabCls(tab === 'sentiment')} onClick={() => setTab('sentiment')}>Sentiment</button>
      </div>

      {tab === 'events' && (
        <div className="space-y-0">
          {events?.slice(0, 15).map((ev, i) => {
            const isPositive = ev.surprise > 0
            return (
              <div key={`${ev.event}-${i}`} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium truncate block">{ev.event}</span>
                  <span className="text-[9px] text-muted-foreground">{ev.date}</span>
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
          {newsData?.map((item) => {
            const cls = classifyHeadline(item.title)
            return (
              <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-1 px-1 rounded-sm transition-colors">
                <div className="flex-1 min-w-0">
                  {cls && (
                    <span className="inline-block text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                      style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}>
                      {CATEGORY_LABELS[cls.category]}
                    </span>
                  )}
                  <span className="text-[11px] font-medium leading-snug text-foreground line-clamp-2">{item.title}</span>
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
                  <span className={`text-[9px] font-bold uppercase ${SIGNAL_TEXT[src.signal]}`}>{src.signal}</span>
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
              <div className="flex items-center justify-between text-[9px] text-muted-foreground">
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
    </PanelWrapper>
  )
}
