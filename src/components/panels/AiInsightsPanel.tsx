import { useState, useMemo } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { useUserStore } from '@/stores/user-store'
import { useMarketStore } from '@/stores/market-store'
import { useNewsData } from '@/hooks/use-news-data'
import { classifyHeadline, CATEGORY_LABELS } from '@/lib/news-classifier'
import type { ThreatCategory } from '@/lib/news-classifier'
import type { NewsItem } from '@/types'

const LS_KEY = 'monoth-ai-key'

type Tab = 'sentiment' | 'brief' | 'themes' | 'risks'

const LEVEL_SCORE: Record<string, number> = {
  critical: -2,
  high: -1,
  medium: 0,
}

const CATEGORY_COLORS: Partial<Record<ThreatCategory, string>> = {
  conflict: '#ef4444',
  military: '#f97316',
  terrorism: '#dc2626',
  economic: '#eab308',
  diplomatic: '#3b82f6',
  disaster: '#f97316',
  protest: '#a855f7',
  cyber: '#06b6d4',
  health: '#10b981',
  environmental: '#22c55e',
  infrastructure: '#6b7280',
  tech: '#8b5cf6',
  general: '#9ca3af',
  crime: '#f43f5e',
}

function sentimentLabel(score: number): string {
  if (score < 25) return 'FEAR'
  if (score < 40) return 'CAUTIOUS'
  if (score < 60) return 'NEUTRAL'
  if (score < 75) return 'OPTIMISTIC'
  return 'GREED'
}

function sentimentColor(score: number): string {
  if (score < 25) return '#ef4444'
  if (score < 40) return '#f97316'
  if (score < 60) return '#eab308'
  if (score < 75) return '#86efac'
  return '#22c55e'
}

function tabCls(active: boolean) {
  return `text-[10px] uppercase tracking-wider font-medium pb-0.5 transition-colors ${
    active
      ? 'text-foreground border-b border-foreground'
      : 'text-muted-foreground hover:text-foreground/70'
  }`
}

// ── Theme definitions ─────────────────────────────────────────────────────────

type ThemeKey = 'AI/Tech' | 'Rate Cuts' | 'Geopolitics' | 'Earnings' | 'Crypto' | 'Energy'

const THEME_KEYWORDS: Record<ThemeKey, string[]> = {
  'AI/Tech': ['ai', 'artificial intelligence', 'chip', 'semiconductor', 'nvidia', 'tech', 'technology', 'machine learning', 'llm'],
  'Rate Cuts': ['rate cut', 'fed', 'federal reserve', 'dovish', 'easing', 'interest rate', 'fomc', 'powell', 'pivot'],
  'Geopolitics': ['war', 'sanctions', 'tariff', 'conflict', 'missile', 'troops', 'invasion', 'nato', 'treaty', 'escalat'],
  'Earnings': ['earnings', 'revenue', 'profit', 'beat', 'miss', 'eps', 'guidance', 'quarterly', 'results'],
  'Crypto': ['bitcoin', 'ethereum', 'crypto', 'blockchain', 'btc', 'eth', 'defi', 'nft', 'token', 'stablecoin'],
  'Energy': ['oil', 'gas', 'opec', 'renewable', 'energy', 'crude', 'barrel', 'lng', 'solar', 'wind'],
}

const THEME_COLORS: Record<ThemeKey, string> = {
  'AI/Tech': '#8b5cf6',
  'Rate Cuts': '#3b82f6',
  'Geopolitics': '#ef4444',
  'Earnings': '#eab308',
  'Crypto': '#f97316',
  'Energy': '#22c55e',
}

function scoreThemes(items: NewsItem[]) {
  const now = Date.now()
  const oneHour = 3_600_000

  const counts: Record<ThemeKey, number> = {
    'AI/Tech': 0, 'Rate Cuts': 0, 'Geopolitics': 0, 'Earnings': 0, 'Crypto': 0, 'Energy': 0,
  }
  const recent: Record<ThemeKey, number> = { ...counts }

  for (const item of items) {
    const lower = item.title.toLowerCase()
    const isRecent = now - item.published * 1000 < oneHour * 6

    for (const [theme, kws] of Object.entries(THEME_KEYWORDS) as [ThemeKey, string[]][]) {
      if (kws.some((kw) => lower.includes(kw))) {
        counts[theme]++
        if (isRecent) recent[theme]++
      }
    }
  }

  return (Object.keys(counts) as ThemeKey[])
    .map((theme) => {
      const total = counts[theme]
      const rec = recent[theme]
      // trend: rising if recent share > 30% of total, falling if < 10%
      const trend: 'rising' | 'stable' | 'falling' =
        total === 0 ? 'stable' : rec / total > 0.3 ? 'rising' : rec / total < 0.1 ? 'falling' : 'stable'
      return { theme, count: total, trend }
    })
    .sort((a, b) => b.count - a.count)
}

function ThemesTab() {
  const expanded = useIsExpanded()
  const { data: headlines } = useNewsData('headlines')

  const themes = useMemo(() => scoreThemes(headlines ?? []), [headlines])
  const maxCount = themes[0]?.count ?? 1
  const dominant = themes[0]

  return (
    <div className="space-y-3">
      {dominant && dominant.count > 0 && (
        <div className="flex items-center gap-1.5">
          <span
            className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-[2px]"
            style={{ backgroundColor: `${THEME_COLORS[dominant.theme]}25`, color: THEME_COLORS[dominant.theme] }}
          >
            Dominant Narrative
          </span>
          <span className="text-[10px] font-semibold" style={{ color: THEME_COLORS[dominant.theme] }}>
            {dominant.theme}
          </span>
        </div>
      )}

      <div className="space-y-2">
        {themes.map(({ theme, count, trend }) => {
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
          return (
            <div key={theme}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1">
                  <span className={`text-foreground/80 ${expanded ? 'text-[12px]' : 'text-[10px]'}`}>{theme}</span>
                  <span
                    className="text-[8px] font-medium"
                    style={{
                      color: trend === 'rising' ? '#22c55e' : trend === 'falling' ? '#ef4444' : '#6b7280',
                    }}
                  >
                    {trend === 'rising' ? '▲' : trend === 'falling' ? '▼' : '—'}
                  </span>
                </div>
                <span className={`text-muted-foreground ${expanded ? 'text-[11px]' : 'text-[9px]'}`}>{count} stories</span>
              </div>
              <div className={`w-full bg-border/20 rounded-[2px] overflow-hidden ${expanded ? 'h-2.5' : 'h-1.5'}`}>
                <div
                  className="h-full rounded-[2px] transition-all"
                  style={{ width: `${pct}%`, backgroundColor: THEME_COLORS[theme] }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {(headlines ?? []).length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center">Loading headlines...</p>
      )}
    </div>
  )
}

// ── Risk definitions ──────────────────────────────────────────────────────────

type RiskCategory =
  | 'Market Risk'
  | 'Credit Risk'
  | 'Geopolitical Risk'
  | 'Policy Risk'
  | 'Liquidity Risk'
  | 'Contagion Risk'

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
    'Market Risk': 0,
    'Credit Risk': 0,
    'Geopolitical Risk': 0,
    'Policy Risk': 0,
    'Liquidity Risk': 0,
    'Contagion Risk': 0,
  }

  for (const item of items) {
    const lower = item.title.toLowerCase()
    for (const [risk, kws] of Object.entries(RISK_KEYWORDS) as [RiskCategory, string[]][]) {
      if (kws.some((kw) => lower.includes(kw))) raw[risk]++
    }
  }

  // Normalize to 0-10 with diminishing returns: score = min(hits * 1.5, 10)
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

function RisksTab() {
  const expanded = useIsExpanded()
  const { data: headlines } = useNewsData('headlines')

  const { scores, level } = useMemo(() => {
    const items = headlines ?? []
    const s = scoreRisks(items)
    return { scores: s, level: compositeLevel(s) }
  }, [headlines])

  const riskKeys: RiskCategory[] = [
    'Market Risk', 'Credit Risk', 'Geopolitical Risk', 'Policy Risk', 'Liquidity Risk', 'Contagion Risk',
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Risk Level</span>
        <span
          className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-[2px]"
          style={{
            backgroundColor: `${compositeLevelColor(level)}20`,
            color: compositeLevelColor(level),
          }}
        >
          {level}
        </span>
      </div>

      <div className="space-y-2">
        {riskKeys.map((risk) => {
          const score = scores[risk]
          const pct = (score / 10) * 100
          const color = riskColor(score)
          return (
            <div key={risk}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-foreground/80 ${expanded ? 'text-[12px]' : 'text-[10px]'}`}>{risk}</span>
                <span className={`tabular-nums font-medium ${expanded ? 'text-[11px]' : 'text-[9px]'}`} style={{ color }}>
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

      <div className="text-[9px] text-muted-foreground">
        Scores derived from {(headlines ?? []).length} headlines. Scale 0–10.
      </div>
    </div>
  )
}

// ── Sentiment tab (unchanged) ─────────────────────────────────────────────────

function SentimentTab() {
  const expanded = useIsExpanded()
  const { data: headlines } = useNewsData('headlines')

  const { score, categoryBreakdown, topThreats } = useMemo(() => {
    const items = headlines ?? []
    if (items.length === 0) return { score: 50, categoryBreakdown: [], topThreats: [] }

    let total = 0
    const catCount: Partial<Record<ThreatCategory, number>> = {}
    const threats: { title: string; level: string; category: ThreatCategory }[] = []

    for (const item of items) {
      const cls = classifyHeadline(item.title)
      if (cls) {
        total += LEVEL_SCORE[cls.level] ?? 0
        catCount[cls.category] = (catCount[cls.category] ?? 0) + 1
        if (cls.level === 'critical' || cls.level === 'high') {
          threats.push({ title: item.title, level: cls.level, category: cls.category })
        }
      } else {
        total += 0.5
      }
    }

    const min = items.length * -2
    const max = items.length * 0.5
    const normalized = Math.round(((total - min) / (max - min)) * 100)
    const clamped = Math.max(0, Math.min(100, normalized))

    const breakdown = Object.entries(catCount)
      .map(([cat, count]) => ({ cat: cat as ThreatCategory, count: count ?? 0 }))
      .sort((a, b) => b.count - a.count)

    const top3 = threats
      .sort((a, b) => (a.level === 'critical' ? -1 : b.level === 'critical' ? 1 : 0))
      .slice(0, 3)

    return { score: clamped, categoryBreakdown: breakdown, topThreats: top3 }
  }, [headlines])

  const totalCats = categoryBreakdown.reduce((s, c) => s + c.count, 0)
  const label = sentimentLabel(score)
  const color = sentimentColor(score)

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center py-2">
        <span className={`font-bold tabular-nums ${expanded ? 'text-5xl' : 'text-3xl'}`} style={{ color }}>{score}</span>
        <span className={`uppercase tracking-wider font-bold mt-0.5 ${expanded ? 'text-[13px]' : 'text-[10px]'}`} style={{ color }}>{label}</span>
        <span className="text-[9px] text-muted-foreground mt-0.5">{(headlines ?? []).length} headlines analyzed</span>
      </div>

      {categoryBreakdown.length > 0 && (
        <div>
          <div className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wider">Category breakdown</div>
          <div className="flex h-2 w-full rounded-sm overflow-hidden">
            {categoryBreakdown.map(({ cat, count }) => (
              <div
                key={cat}
                style={{
                  width: `${(count / totalCats) * 100}%`,
                  backgroundColor: CATEGORY_COLORS[cat] ?? '#6b7280',
                }}
                title={`${CATEGORY_LABELS[cat]}: ${count}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
            {categoryBreakdown.slice(0, 6).map(({ cat, count }) => (
              <div key={cat} className="flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 rounded-[1px]" style={{ backgroundColor: CATEGORY_COLORS[cat] ?? '#6b7280' }} />
                <span className="text-[9px] text-muted-foreground">{CATEGORY_LABELS[cat]} {count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topThreats.length > 0 && (
        <div>
          <div className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wider">Top threats</div>
          <div className="space-y-1">
            {(expanded ? topThreats : topThreats.slice(0, 3)).map((t, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span
                  className="text-[8px] font-bold uppercase px-1 py-0.5 rounded-[2px] shrink-0 mt-px"
                  style={{
                    backgroundColor: t.level === 'critical' ? '#ef444420' : '#f9731620',
                    color: t.level === 'critical' ? '#ef4444' : '#f97316',
                  }}
                >
                  {t.level}
                </span>
                <span className={`text-foreground/80 leading-tight ${expanded ? 'text-[12px]' : 'text-[10px] line-clamp-2'}`}>{t.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(headlines ?? []).length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center">Loading headlines...</p>
      )}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function AiInsightsPanel() {
  const expanded = useIsExpanded()
  const tier = useUserStore((s) => s.tier)
  const session = useUserStore((s) => s.session)
  const indices = useMarketStore((s) => s.indices)
  const crypto = useMarketStore((s) => s.crypto)

  const [tab, setTab] = useState<Tab>('sentiment')
  const [apiKey, setApiKey] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) ?? '' : ''
  )
  const [brief, setBrief] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPro = tier === 'pro' || tier === 'api' || tier === 'enterprise'

  function saveKey(val: string) {
    setApiKey(val)
    if (val) localStorage.setItem(LS_KEY, val)
    else localStorage.removeItem(LS_KEY)
  }

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      if (isPro) {
        const token = session?.access_token
        if (!token) throw new Error('Not authenticated')
        const res = await fetch('/api/ai/brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `Request failed (${res.status})`)
        }
        const data = await res.json()
        setBrief(data.brief)
      } else {
        if (!apiKey.trim()) throw new Error('Enter your Anthropic API key')
        const topIndices = indices.slice(0, 5).map((i) => `${i.symbol}: ${i.changePercent >= 0 ? '+' : ''}${i.changePercent.toFixed(2)}%`).join(', ')
        const topCrypto = crypto.slice(0, 3).map((c) => `${c.symbol.toUpperCase()}: $${c.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`).join(', ')
        const prompt = `Concise financial analyst. Current market: Indices: ${topIndices || 'N/A'}. Crypto: ${topCrypto || 'N/A'}. Give 3-4 paragraph market brief. Direct, no disclaimers.`

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey.trim(),
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 512,
            messages: [{ role: 'user', content: prompt }],
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error?.message ?? `Error (${res.status})`)
        }
        const data = await res.json()
        setBrief(data.content?.[0]?.text ?? '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'sentiment', label: 'Sentiment' },
    { key: 'themes', label: 'Themes' },
    { key: 'risks', label: 'Risks' },
    { key: 'brief', label: 'Brief' },
  ]

  return (
    <PanelWrapper title="AI Insights">
      <div className="flex gap-2 mb-3 border-b border-border/20 pb-2">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} className={tabCls(tab === key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'sentiment' && <SentimentTab />}
      {tab === 'themes' && <ThemesTab />}
      {tab === 'risks' && <RisksTab />}

      {tab === 'brief' && (
        <div>
          {!isPro && (
            <div className="mb-2">
              <div className="text-[9px] text-muted-foreground mb-1">Anthropic API key (stored locally)</div>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={(e) => saveKey(e.target.value)}
                className="w-full bg-transparent border border-border/30 rounded-sm px-1.5 py-0.5 text-[11px] font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
              />
            </div>
          )}

          <button
            onClick={generate}
            disabled={loading || (!isPro && !apiKey.trim())}
            className="text-[10px] font-medium bg-foreground text-background px-2 py-1 rounded-sm disabled:opacity-50 mb-2"
          >
            {loading ? 'Generating...' : 'Generate Brief'}
          </button>

          {error && <p className="text-[10px] text-red-500 mb-1">{error}</p>}

          {brief && (
            <div className={`leading-relaxed text-foreground/80 whitespace-pre-line ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>
              {brief}
            </div>
          )}

          {!brief && !loading && !error && (
            <p className="text-[10px] text-muted-foreground">
              {isPro ? 'Generate an AI market analysis.' : 'Add API key above to generate briefs.'}
            </p>
          )}
        </div>
      )}
    </PanelWrapper>
  )
}
