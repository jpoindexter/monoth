import { useMemo } from 'react'
import { useIsExpanded } from '@/components/layout/PanelWrapper'
import { useNewsData } from '@/hooks/use-news-data'
import type { NewsItem } from '@/types'

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
      const trend: 'rising' | 'stable' | 'falling' =
        total === 0 ? 'stable' : rec / total > 0.3 ? 'rising' : rec / total < 0.1 ? 'falling' : 'stable'
      return { theme, count: total, trend }
    })
    .sort((a, b) => b.count - a.count)
}

export default function AiInsightsThemesTab() {
  const expanded = useIsExpanded()
  const { data: headlines } = useNewsData('markets')

  const themes = useMemo(() => scoreThemes(headlines ?? []), [headlines])
  const maxCount = themes[0]?.count ?? 1
  const dominant = themes[0]

  return (
    <div className="space-y-3">
      {dominant && dominant.count > 0 && (
        <div className="flex items-center gap-1.5">
          <span
            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-[2px]"
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
                    className="text-[9px] font-medium"
                    style={{
                      color: trend === 'rising' ? '#22c55e' : trend === 'falling' ? '#ef4444' : '#6b7280',
                    }}
                  >
                    {trend === 'rising' ? '▲' : trend === 'falling' ? '▼' : '—'}
                  </span>
                </div>
                <span className={`text-muted-foreground ${expanded ? 'text-[11px]' : 'text-[10px]'}`}>{count} stories</span>
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
