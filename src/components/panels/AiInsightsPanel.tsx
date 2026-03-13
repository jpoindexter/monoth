'use client'

import { useState } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUserStore } from '@/stores/user-store'
import { useMarketStore } from '@/stores/market-store'

const LS_KEY = 'monoth-ai-key'

function buildPrompt(
  indices: ReturnType<typeof useMarketStore.getState>['indices'],
  crypto: ReturnType<typeof useMarketStore.getState>['crypto'],
  forex: ReturnType<typeof useMarketStore.getState>['forex'],
): string {
  const topIndices = indices
    .slice(0, 5)
    .map((i) => `${i.symbol}: ${i.price.toFixed(2)} (${i.changePercent >= 0 ? '+' : ''}${i.changePercent.toFixed(2)}%)`)
    .join(', ')

  const topCrypto = crypto
    .slice(0, 3)
    .map((c) => `${c.symbol.toUpperCase()}: $${c.price.toLocaleString('en-US', { maximumFractionDigits: 2 })} (${c.changePercent24h >= 0 ? '+' : ''}${c.changePercent24h.toFixed(2)}%)`)
    .join(', ')

  const topForex = forex
    .slice(0, 3)
    .map((f) => `${f.pair}: ${f.rate.toFixed(4)} (${f.changePercent >= 0 ? '+' : ''}${f.changePercent.toFixed(2)}%)`)
    .join(', ')

  return `You are a concise financial analyst. Based on current market data, provide a brief (3-4 paragraph) market intelligence summary.

Current market snapshot:
- Equity indices: ${topIndices || 'No data available'}
- Crypto: ${topCrypto || 'No data available'}
- Forex: ${topForex || 'No data available'}

Focus on: key trends, notable movers, cross-asset correlations, and one actionable insight. Be direct and professional. No disclaimers.`
}

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
    if (typeof window !== 'undefined') {
      if (val) localStorage.setItem(LS_KEY, val)
      else localStorage.removeItem(LS_KEY)
    }
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
        if (!apiKey.trim()) throw new Error('Enter your Anthropic API key to continue')
        const prompt = buildPrompt(indices, crypto, forex)
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
          throw new Error(body.error?.message ?? `Anthropic error (${res.status})`)
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
    <PanelWrapper title="AI Market Insights">
      <div className="flex flex-col gap-4 p-1">
        {!isPro && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">
              Anthropic API key (stored locally, never sent to our servers)
            </label>
            <Input
              type="password"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => saveKey(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        )}

        <Button
          onClick={generate}
          disabled={loading || (!isPro && !apiKey.trim())}
          size="sm"
          className="w-fit"
        >
          {loading ? 'Generating...' : 'Generate Brief'}
        </Button>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        {brief && !loading && (
          <div className="flex flex-col gap-2">
            {brief.split('\n').filter(Boolean).map((para, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground/90">
                {para}
              </p>
            ))}
          </div>
        )}

        {!brief && !loading && !error && (
          <p className="text-xs text-muted-foreground">
            {isPro
              ? 'Click Generate Brief to get an AI-powered market analysis.'
              : 'Enter your Anthropic API key above, then click Generate Brief.'}
          </p>
        )}
      </div>
    </PanelWrapper>
  )
}
