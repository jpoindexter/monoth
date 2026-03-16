import { useState } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useUserStore } from '@/stores/user-store'
import { useMarketStore } from '@/stores/market-store'
import { tabCls } from '@/lib/panel-utils'
import AiInsightsSentimentTab from '@/components/panels/AiInsightsSentimentTab'
import AiInsightsThemesTab from '@/components/panels/AiInsightsThemesTab'
import AiInsightsRisksTab from '@/components/panels/AiInsightsRisksTab'
import AiInsightsBriefTab, { LS_KEY } from '@/components/panels/AiInsightsBriefTab'

type Tab = 'sentiment' | 'brief' | 'themes' | 'risks'

const TABS: { key: Tab; label: string }[] = [
  { key: 'sentiment', label: 'Sentiment' },
  { key: 'themes', label: 'Themes' },
  { key: 'risks', label: 'Risks' },
  { key: 'brief', label: 'Brief' },
]

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
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} className={tabCls(tab === key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'sentiment' && <AiInsightsSentimentTab />}
      {tab === 'themes' && <AiInsightsThemesTab />}
      {tab === 'risks' && <AiInsightsRisksTab />}
      {tab === 'brief' && (
        <AiInsightsBriefTab
          isPro={isPro}
          apiKey={apiKey}
          brief={brief}
          loading={loading}
          error={error}
          onSaveKey={saveKey}
          onGenerate={generate}
        />
      )}
    </PanelWrapper>
  )
}
