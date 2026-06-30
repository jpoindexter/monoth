import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { useMarketStore } from '@/stores/market-store'
import { tabCls } from '@/lib/panel-utils'
import { MarketAnalysisEvents } from '@/components/panels/MarketAnalysisEvents'
import { MarketAnalysisNews } from '@/components/panels/MarketAnalysisNews'
import { MarketAnalysisSentiment } from '@/components/panels/MarketAnalysisSentiment'
import { MarketAnalysisTechnicals } from '@/components/panels/MarketAnalysisTechnicals'
import { MarketAnalysisFlows } from '@/components/panels/MarketAnalysisFlows'

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

const SIGNAL_WEIGHTS: Record<Signal, number> = { bullish: 1, neutral: 0, bearish: -1 }
const CYCLICAL = ['XLY', 'XLI', 'XLF']
const DEFENSIVE = ['XLU', 'XLP', 'XLV']

function deriveSentiment(indices: ReturnType<typeof useMarketStore.getState>['indices']): SentimentSource[] {
  const spy = indices.find((i) => i.symbol === 'SPY')
  const spyPct = spy?.changePercent ?? 0
  const technical: Signal = spyPct > 0.3 ? 'bullish' : spyPct < -0.3 ? 'bearish' : 'neutral'
  const month = new Date().getMonth() + 1
  const fundamental: Signal = [1, 4, 7, 10].includes(month) ? 'bullish' : 'neutral'
  const top7 = indices.slice(0, 7)
  const positiveCount = top7.filter((i) => i.changePercent > 0).length
  const momentum: Signal = positiveCount >= 3 ? 'bullish' : positiveCount <= 2 ? 'bearish' : 'neutral'
  const totalVolume = indices.reduce((sum, i) => sum + (i.volume ?? 0), 0)
  const avgVolume = indices.length ? totalVolume / indices.length : 0
  const flow: Signal = avgVolume > 1_000_000 ? 'bullish' : 'neutral'
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
        const spyPrice = closes[closes.length - 1] ?? null
        const dma50 = sma(closes, 50) ?? null
        const dma200 = sma(closes, 200) ?? null
        setTech({ spyPrice, dma50, dma200, loading: false })
      })
      .catch(() => setTech((s) => ({ ...s, loading: false })))
  }, [tab, tech.spyPrice])

  const sentimentSources = useMemo(() => deriveSentiment(indices), [indices])
  const consensusScore = useMemo(() => {
    const sum = sentimentSources.reduce((acc, s) => acc + SIGNAL_WEIGHTS[s.signal], 0)
    return sum / sentimentSources.length
  }, [sentimentSources])
  const consensusSignal: Signal = consensusScore > 0.2 ? 'bullish' : consensusScore < -0.2 ? 'bearish' : 'neutral'

  const rotationResult = useMemo(() => {
    if (!sectorData?.length) return null
    const avg = (syms: string[]) => {
      const matches = sectorData.filter((s) => syms.includes(s.symbol))
      if (!matches.length) return 0
      return matches.reduce((sum, s) => sum + s.changePercent, 0) / matches.length
    }
    const cyclicalAvg = avg(CYCLICAL)
    const defensiveAvg = avg(DEFENSIVE)
    return { cyclicalAvg, defensiveAvg, spread: cyclicalAvg - defensiveAvg }
  }, [sectorData])

  return (
    <PanelWrapper title="Market Analysis" loading={newsLoading && evLoading} error={error} onRetry={refresh}>
      <div className="flex flex-wrap gap-1 mb-2">
        <button className={tabCls(tab === 'events')} onClick={() => setTab('events')}>Surprises</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
        <button className={tabCls(tab === 'sentiment')} onClick={() => setTab('sentiment')}>Sentiment</button>
        <button className={tabCls(tab === 'technicals')} onClick={() => setTab('technicals')}>Technicals</button>
        <button className={tabCls(tab === 'flows')} onClick={() => setTab('flows')}>Flows</button>
      </div>

      {tab === 'events' && <MarketAnalysisEvents events={events ?? null} evLoading={evLoading} expanded={expanded} />}
      {tab === 'news' && <MarketAnalysisNews newsData={newsData ?? null} expanded={expanded} />}
      {tab === 'sentiment' && (
        <MarketAnalysisSentiment
          sentimentSources={sentimentSources}
          consensusScore={consensusScore}
          consensusSignal={consensusSignal}
          consensusLabel={consensusSignal.toUpperCase()}
          rotationResult={rotationResult}
        />
      )}
      {tab === 'technicals' && (
        <MarketAnalysisTechnicals
          spyPrice={tech.spyPrice}
          dma50={tech.dma50}
          dma200={tech.dma200}
          loading={tech.loading}
        />
      )}
      {tab === 'flows' && <MarketAnalysisFlows />}
    </PanelWrapper>
  )
}
