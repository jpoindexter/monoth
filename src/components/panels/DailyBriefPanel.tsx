import { useState, useEffect } from 'react'
import { useMarketStore } from '@/stores'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { tabCls } from '@/lib/panel-utils'
import { DailyBriefAnalysis, generateBrief } from '@/components/panels/DailyBriefAnalysis'
import { DailyBriefScorecard } from '@/components/panels/DailyBriefScorecard'

interface BriefSection {
  title: string
  content: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
}

export default function DailyBriefPanel() {
  const expanded = useIsExpanded()
  const indices     = useMarketStore((s) => s.indices)
  const crypto      = useMarketStore((s) => s.crypto)
  const forex       = useMarketStore((s) => s.forex)
  const commodities = useMarketStore((s) => s.commodities)
  const yields      = useMarketStore((s) => s.yields)
  const [brief, setBrief] = useState<BriefSection[]>([])
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [tab, setTab] = useState<'rules' | 'scorecard' | 'ai'>('rules')

  useEffect(() => {
    if (indices.length > 0 || crypto.length > 0 || forex.length > 0) {
      setBrief(generateBrief(indices, crypto, forex, commodities, yields))
    }
  }, [indices, crypto, forex, commodities, yields])

  useEffect(() => {
    if (tab === 'ai' && !aiSummary) {
      fetch('/api/ai/summary')
        .then((r) => r.json())
        .then((data) => { if (data.summary) setAiSummary(data.summary) })
        .catch(() => {})
    }
  }, [tab, aiSummary])

  const hasData = indices.length > 0 || crypto.length > 0 || forex.length > 0

  return (
    <PanelWrapper title="Daily Brief">
      <div className="flex flex-wrap gap-1 mb-2">
        <button className={tabCls(tab === 'rules')}     onClick={() => setTab('rules')}>Analysis</button>
        <button className={tabCls(tab === 'scorecard')} onClick={() => setTab('scorecard')}>Scorecard</button>
        <button className={tabCls(tab === 'ai')}        onClick={() => setTab('ai')}>AI Summary</button>
      </div>

      {tab === 'rules' && !hasData && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Waiting for market data...</div>
      )}
      {tab === 'rules' && hasData && <DailyBriefAnalysis brief={brief} />}

      {tab === 'scorecard' && !hasData && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Waiting for market data...</div>
      )}
      {tab === 'scorecard' && hasData && (
        <DailyBriefScorecard
          indices={indices}
          crypto={crypto}
          forex={forex}
          commodities={commodities}
          yields={yields}
        />
      )}

      {tab === 'ai' && !aiSummary && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Loading AI summary...</div>
      )}
      {tab === 'ai' && aiSummary && (
        <div className={`leading-relaxed text-foreground/80 whitespace-pre-line ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>
          {aiSummary}
        </div>
      )}
    </PanelWrapper>
  )
}
