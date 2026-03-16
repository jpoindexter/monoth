import { useMemo } from 'react'
import { useIsExpanded } from '@/components/layout/PanelWrapper'
import { useNewsData } from '@/hooks/use-news-data'
import type { NewsItem } from '@/types'

type RiskCategory =
  | 'Market Risk'
  | 'Credit Risk'
  | 'Geopolitical Risk'
  | 'Policy Risk'
  | 'Liquidity Risk'
  | 'Contagion Risk'

const RISK_KEYS: RiskCategory[] = [
  'Market Risk', 'Credit Risk', 'Geopolitical Risk', 'Policy Risk', 'Liquidity Risk', 'Contagion Risk',
]

const RISK_KEYWORDS: Record<RiskCategory, string[]> = {
  'Market Risk': ['crash', 'selloff', 'sell-off', 'plunge', 'rout', 'correction', 'bear', 'volatile', 'volatility', 'drop'],
  'Credit Risk': ['default', 'bankruptcy', 'debt', 'downgrade', 'credit', 'yield spread', 'junk', 'rating', 'insolvency'],
  'Geopolitical Risk': ['war', 'conflict', 'sanctions', 'tariff', 'invasion', 'missile', 'attack', 'troops', 'escalat'],
  'Policy Risk': ['fed', 'rate hike', 'tightening', 'regulation', 'ban', 'restriction', 'policy', 'law', 'legislation'],
  'Liquidity Risk': ['freeze', 'illiquid', 'liquidity', 'margin call', 'redemption', 'bank run', 'withdrawal', 'halt'],
  'Contagion Risk': ['contagion', 'spillover', 'systemic', 'crisis', 'collapse', 'domino', 'exposure', 'interconnect'],
}

function scoreRisks(items: NewsItem[]): Record<RiskCategory, number> {
  const raw: Record<RiskCategory, number> = {
    'Market Risk': 0, 'Credit Risk': 0, 'Geopolitical Risk': 0,
    'Policy Risk': 0, 'Liquidity Risk': 0, 'Contagion Risk': 0,
  }
  for (const item of items) {
    const lower = item.title.toLowerCase()
    for (const [risk, kws] of Object.entries(RISK_KEYWORDS) as [RiskCategory, string[]][]) {
      if (kws.some((kw) => lower.includes(kw))) raw[risk]++
    }
  }
  const scores = {} as Record<RiskCategory, number>
  for (const key of Object.keys(raw) as RiskCategory[]) {
    scores[key] = Math.min(raw[key] * 1.5, 10)
  }
  return scores
}

function riskColor(score: number) {
  if (score < 3) return '#22c55e'
  if (score <= 6) return '#eab308'
  return '#ef4444'
}

function compositeLevel(scores: Record<RiskCategory, number>): 'LOW' | 'MODERATE' | 'ELEVATED' {
  const avg = Object.values(scores).reduce((s, v) => s + v, 0) / Object.values(scores).length
  if (avg < 3) return 'LOW'
  if (avg <= 6) return 'MODERATE'
  return 'ELEVATED'
}

function compositeLevelColor(level: 'LOW' | 'MODERATE' | 'ELEVATED') {
  if (level === 'LOW') return '#22c55e'
  if (level === 'MODERATE') return '#eab308'
  return '#ef4444'
}

export default function AiInsightsRisksTab() {
  const expanded = useIsExpanded()
  const { data: headlines } = useNewsData('markets')

  const { scores, level } = useMemo(() => {
    const items = headlines ?? []
    const s = scoreRisks(items)
    return { scores: s, level: compositeLevel(s) }
  }, [headlines])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Level</span>
        <span
          className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-[2px]"
          style={{
            backgroundColor: `${compositeLevelColor(level)}20`,
            color: compositeLevelColor(level),
          }}
        >
          {level}
        </span>
      </div>

      <div className="space-y-2">
        {RISK_KEYS.map((risk) => {
          const score = scores[risk]
          const pct = (score / 10) * 100
          const color = riskColor(score)
          return (
            <div key={risk}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-foreground/80 ${expanded ? 'text-[12px]' : 'text-[10px]'}`}>{risk}</span>
                <span className={`tabular-nums font-medium ${expanded ? 'text-[11px]' : 'text-[10px]'}`} style={{ color }}>
                  {score.toFixed(1)}/10
                </span>
              </div>
              <div className={`w-full bg-border/20 rounded-[2px] overflow-hidden ${expanded ? 'h-2.5' : 'h-1.5'}`}>
                <div
                  className="h-full rounded-[2px] transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-[10px] text-muted-foreground">
        Scores derived from {(headlines ?? []).length} headlines. Scale 0-10.
      </div>
    </div>
  )
}
