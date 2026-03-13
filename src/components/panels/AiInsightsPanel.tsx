import { useState, useMemo } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useUserStore } from '@/stores/user-store'
import { useMarketStore } from '@/stores/market-store'
import { useNewsData } from '@/hooks/use-news-data'
import { classifyHeadline, CATEGORY_LABELS, ThreatCategory } from '@/lib/news-classifier'

const LS_KEY = 'monoth-ai-key'

type Tab = 'sentiment' | 'brief'

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

function SentimentTab() {
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

    // normalize to 0-100: theoretical range is items*-2 to items*0.5
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
        <span className="text-3xl font-bold tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[10px] uppercase tracking-wider font-bold mt-0.5" style={{ color }}>{label}</span>
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
            {topThreats.map((t, i) => (
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
                <span className="text-[10px] text-foreground/80 leading-tight line-clamp-2">{t.title}</span>
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

export default function AiInsightsPanel() {
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

  return (
    <PanelWrapper title="AI Insights">
      <div className="flex gap-2 mb-3 border-b border-border/20 pb-2">
        {(['sentiment', 'brief'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-[10px] uppercase tracking-wider font-medium pb-0.5 transition-colors ${
              tab === t
                ? 'text-foreground border-b border-foreground'
                : 'text-muted-foreground hover:text-foreground/70'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'sentiment' && <SentimentTab />}

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
            <div className="text-[11px] leading-relaxed text-foreground/80 whitespace-pre-line">
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
