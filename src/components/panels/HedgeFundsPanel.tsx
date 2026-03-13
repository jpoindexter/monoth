import { useState, useCallback } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'

const HF_SYMBOLS = ['QAI', 'MNA', 'BTAL', 'DBMF', 'CTA', 'KMLM']
const HF_NAMES: Record<string, string> = {
  QAI: 'HF Multi-Strategy', MNA: 'Merger Arb', BTAL: 'Anti-Beta',
  DBMF: 'Managed Futures', CTA: 'Trend Following', KMLM: 'Macro Strategy',
}

const STRATEGIES = [
  { name: 'Long/Short Equity', min: 2, max: 12 },
  { name: 'Global Macro', min: -3, max: 8 },
  { name: 'Event Driven', min: 1, max: 10 },
  { name: 'Quant/Systematic', min: 3, max: 15 },
  { name: 'Credit/Distressed', min: 1, max: 8 },
  { name: 'Merger Arb', min: 2, max: 6 },
]

const HOLDINGS = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'BRK.B', name: 'Berkshire' },
  { symbol: 'JPM', name: 'JPMorgan' },
  { symbol: 'V', name: 'Visa' },
]

const SP500_YTD = 4.2

function seededReturn(name: string, min: number, max: number): number {
  const day = new Date().toISOString().slice(0, 10)
  let hash = 0
  for (const ch of name + day) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0
  const norm = (Math.abs(hash) % 1000) / 1000
  return min + norm * (max - min)
}

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function HedgeFundsPanel() {
  const [tab, setTab] = useState<'prices' | 'strategies' | 'holdings' | 'news'>('prices')
  const { data: newsData, loading: newsLoading, error, refresh } = useNewsData('hedgefunds')
  const { data: priceData, loading: priceLoading } = usePolling({
    fetcher: useCallback(() => fetchQuotes(HF_SYMBOLS), []),
    interval: 300_000,
    enabled: tab === 'prices',
  })

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const strategyData = STRATEGIES.map(s => ({
    ...s,
    ytd: seededReturn(s.name, s.min, s.max),
  }))

  const maxAbs = Math.max(...strategyData.map(s => Math.abs(s.ytd)), 0.1)

  const holdingsData = HOLDINGS.map(h => ({
    ...h,
    ownership: seededReturn(h.symbol + 'own', 85, 95),
    change: seededReturn(h.symbol + 'chg', -2, 3),
  }))

  return (
    <PanelWrapper title="Hedge Funds & PE" loading={newsLoading && priceLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'prices')} onClick={() => setTab('prices')}>Alt ETFs</button>
        <button className={tabCls(tab === 'strategies')} onClick={() => setTab('strategies')}>Strategies</button>
        <button className={tabCls(tab === 'holdings')} onClick={() => setTab('holdings')}>Holdings</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'prices' && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Strategy</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">Chg%</th>
            </tr>
          </thead>
          <tbody>
            {priceData?.map((p) => {
              const isPos = p.changePercent >= 0
              return (
                <tr key={p.symbol} className="border-t border-border/20">
                  <td className="py-0.5">
                    <span className="font-medium">{HF_NAMES[p.symbol] || p.symbol}</span>
                    <span className="text-muted-foreground ml-1 text-[10px]">{p.symbol}</span>
                  </td>
                  <td className="text-right tabular-nums">${p.price.toFixed(2)}</td>
                  <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{p.changePercent.toFixed(2)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'strategies' && (
        <div className="space-y-2">
          <div className="flex justify-between text-[9px] text-muted-foreground uppercase tracking-wider mb-1">
            <span>Strategy</span>
            <span>YTD / vs S&P</span>
          </div>
          {strategyData.map((s) => {
            const isPos = s.ytd >= 0
            const vsSpx = s.ytd - SP500_YTD
            const barWidth = (Math.abs(s.ytd) / maxAbs) * 100
            return (
              <div key={s.name}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[11px] font-medium">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isPos ? '+' : ''}{s.ytd.toFixed(1)}%
                    </span>
                    <span className={`text-[9px] tabular-nums ${vsSpx >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                      {vsSpx >= 0 ? '+' : ''}{vsSpx.toFixed(1)} vs S&P
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${isPos ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
          <p className="text-[9px] text-muted-foreground mt-2">Simulated YTD. S&P ref: +{SP500_YTD}%</p>
        </div>
      )}

      {tab === 'holdings' && (
        <div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-medium pb-1.5">Stock</th>
                <th className="text-right font-medium pb-1.5">Inst. Own</th>
                <th className="text-right font-medium pb-1.5">Chg</th>
              </tr>
            </thead>
            <tbody>
              {holdingsData.map((h) => {
                const chgPos = h.change >= 0
                return (
                  <tr key={h.symbol} className="border-t border-border/20">
                    <td className="py-0.5">
                      <span className="font-medium">{h.symbol}</span>
                      <span className="text-muted-foreground ml-1 text-[10px]">{h.name}</span>
                    </td>
                    <td className="text-right tabular-nums">{h.ownership.toFixed(1)}%</td>
                    <td className={`text-right tabular-nums font-medium ${chgPos ? 'text-emerald-600' : 'text-red-500'}`}>
                      {chgPos ? '+' : ''}{h.change.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="text-[9px] text-muted-foreground mt-2">Simulated 13F-style institutional ownership</p>
        </div>
      )}

      {tab === 'news' && (
        <div className="space-y-0">
          {newsData?.map((item) => {
            const cls = classifyHeadline(item.title)
            return (
              <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-1 px-1 rounded-sm transition-colors">
                <div className="flex-1 min-w-0">
                  {cls && (
                    <span className="inline-block text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                      style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}>
                      {CATEGORY_LABELS[cls.category]}
                    </span>
                  )}
                  <span className="text-[11px] font-medium leading-snug text-foreground line-clamp-2">{item.title}</span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">{relTime(item.published)}</span>
              </a>
            )
          })}
        </div>
      )}
    </PanelWrapper>
  )
}
