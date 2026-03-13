import { useState } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useUserStore } from '@/stores/user-store'
import { useMarketStore } from '@/stores/market-store'

const LS_KEY = 'monoth-ai-key'

export default function AiInsightsPanel() {
  const tier = useUserStore((s) => s.tier)
  const session = useUserStore((s) => s.session)
  const indices = useMarketStore((s) => s.indices)
  const crypto = useMarketStore((s) => s.crypto)
  const forex = useMarketStore((s) => s.forex)

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
    </PanelWrapper>
  )
}
