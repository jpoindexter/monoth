import { useState, useEffect } from 'react'
import { useMarketStore } from '@/stores'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import type { MarketDataPoint, CryptoAsset, ForexRate } from '@/types'

interface BriefSection {
  title: string
  content: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
}

function generateBrief(
  indices: MarketDataPoint[],
  crypto: CryptoAsset[],
  forex: ForexRate[],
): BriefSection[] {
  const sections: BriefSection[] = []

  if (indices.length > 0) {
    const avg = indices.reduce((sum, i) => sum + i.changePercent, 0) / indices.length
    const bullish = indices.filter((i) => i.changePercent > 0).length
    const sentiment = avg > 0.5 ? 'bullish' : avg < -0.5 ? 'bearish' : 'neutral'
    const leader = [...indices].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))[0]

    sections.push({
      title: 'Equities',
      content: `${bullish} of ${indices.length} indices positive. ${leader?.name || leader?.symbol} leads at ${leader?.changePercent > 0 ? '+' : ''}${leader?.changePercent.toFixed(2)}%. Broad market ${sentiment === 'bullish' ? 'risk-on' : sentiment === 'bearish' ? 'risk-off' : 'mixed'}.`,
      sentiment,
    })
  }

  if (crypto.length > 0) {
    const btc = crypto.find((c) => c.symbol === 'btc' || c.symbol === 'bitcoin')
    const eth = crypto.find((c) => c.symbol === 'eth' || c.symbol === 'ethereum')
    const avg = crypto.slice(0, 10).reduce((sum, c) => sum + c.changePercent24h, 0) / Math.min(crypto.length, 10)
    const sentiment = avg > 2 ? 'bullish' : avg < -2 ? 'bearish' : 'neutral'

    let content = ''
    if (btc) content += `BTC $${btc.price.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${btc.changePercent24h > 0 ? '+' : ''}${btc.changePercent24h.toFixed(1)}%)`
    if (eth) content += `, ETH $${eth.price.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${eth.changePercent24h > 0 ? '+' : ''}${eth.changePercent24h.toFixed(1)}%)`
    content += `. Top 10 avg ${avg > 0 ? '+' : ''}${avg.toFixed(1)}%.`

    sections.push({ title: 'Crypto', content, sentiment })
  }

  if (forex.length > 0) {
    const bigMoves = forex.filter((f) => Math.abs(f.changePercent) > 0.3)
    const sentiment = bigMoves.length > 2 ? 'bearish' : 'neutral'
    const content = bigMoves.length > 0
      ? `Notable moves: ${bigMoves.slice(0, 3).map((f) => `${f.pair} ${f.changePercent > 0 ? '+' : ''}${f.changePercent.toFixed(2)}%`).join(', ')}.`
      : 'Currency markets relatively stable. No major moves in major pairs.'

    sections.push({ title: 'Forex', content, sentiment })
  }

  const overallSentiments = sections.map((s) => s.sentiment)
  const bullishCount = overallSentiments.filter((s) => s === 'bullish').length
  const bearishCount = overallSentiments.filter((s) => s === 'bearish').length
  const overall = bullishCount > bearishCount ? 'bullish' : bearishCount > bullishCount ? 'bearish' : 'neutral'

  sections.push({
    title: 'Outlook',
    content: overall === 'bullish'
      ? 'Risk appetite elevated across asset classes. Watch for overextension signals.'
      : overall === 'bearish'
        ? 'Defensive positioning warranted. Monitor safe-haven flows and credit spreads.'
        : 'Mixed signals across markets. Await catalyst for directional conviction.',
    sentiment: overall,
  })

  return sections
}

export default function DailyBriefPanel() {
  const indices = useMarketStore((s) => s.indices)
  const crypto = useMarketStore((s) => s.crypto)
  const forex = useMarketStore((s) => s.forex)
  const [brief, setBrief] = useState<BriefSection[]>([])
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [tab, setTab] = useState<'rules' | 'ai'>('rules')

  useEffect(() => {
    if (indices.length > 0 || crypto.length > 0 || forex.length > 0) {
      setBrief(generateBrief(indices, crypto, forex))
    }
  }, [indices, crypto, forex])

  useEffect(() => {
    if (tab === 'ai' && !aiSummary) {
      fetch('/api/ai/summary')
        .then(r => r.json())
        .then(data => {
          if (data.summary) setAiSummary(data.summary)
        })
        .catch(() => {})
    }
  }, [tab, aiSummary])

  const hasData = indices.length > 0 || crypto.length > 0 || forex.length > 0

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Daily Brief">
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'rules')} onClick={() => setTab('rules')}>Analysis</button>
        <button className={tabCls(tab === 'ai')} onClick={() => setTab('ai')}>AI Summary</button>
      </div>

      {tab === 'rules' && !hasData && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Waiting for market data...</div>
      )}

      {tab === 'rules' && hasData && (
        <div className="space-y-2">
          {brief.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</span>
                <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm ${
                  section.sentiment === 'bullish' ? 'bg-emerald-500/10 text-emerald-600' :
                  section.sentiment === 'bearish' ? 'bg-red-500/10 text-red-500' :
                  'bg-yellow-500/10 text-yellow-600'
                }`}>
                  {section.sentiment}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-foreground/80">{section.content}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'ai' && !aiSummary && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">
          Loading AI summary...
        </div>
      )}

      {tab === 'ai' && aiSummary && (
        <div className="text-[11px] leading-relaxed text-foreground/80 whitespace-pre-line">
          {aiSummary}
        </div>
      )}
    </PanelWrapper>
  )
}
