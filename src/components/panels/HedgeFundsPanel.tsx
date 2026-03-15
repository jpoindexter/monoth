import { useState, useCallback } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime } from '@/lib/panel-utils'

const HF_SYMBOLS = ['QAI', 'MNA', 'BTAL', 'DBMF', 'CTA', 'KMLM']
const HF_NAMES: Record<string, string> = {
  QAI: 'HF Multi-Strategy', MNA: 'Merger Arb', BTAL: 'Anti-Beta',
  DBMF: 'Managed Futures', CTA: 'Trend Following', KMLM: 'Macro Strategy',
}

interface StockInstitutional {
  symbol: string
  institutionsPctHeld: number | null
  insidersPctHeld: number | null
  topHolders: {
    organization: string
    pctHeld: number
    shares: number
    value: number
    reportDate: string
  }[]
}

function fmtShares(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return String(n)
}

export default function HedgeFundsPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'prices' | 'holdings' | 'news'>('news')
  const { data: newsData, loading: newsLoading, error, refresh } = useNewsData('hedgefunds')

  const { data: priceData, loading: priceLoading } = usePolling({
    fetcher: useCallback(() => fetchQuotes(HF_SYMBOLS), []),
    interval: 300_000,
    enabled: tab === 'prices',
  })

  const { data: instData, loading: instLoading } = usePolling<StockInstitutional[]>({
    fetcher: useCallback(async () => {
      const r = await fetch('/api/market/institutional')
      if (!r.ok) throw new Error('Failed to fetch institutional')
      return r.json()
    }, []),
    interval: 3_600_000,
    enabled: tab === 'holdings',
  })

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const loading = (tab === 'prices' && priceLoading) || (tab === 'holdings' && instLoading) || (tab === 'news' && newsLoading)

  return (
    <PanelWrapper title="Hedge Funds & PE" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'prices')} onClick={() => setTab('prices')}>Alt ETFs</button>
        <button className={tabCls(tab === 'holdings')} onClick={() => setTab('holdings')}>Inst. Holdings</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'prices' && (
        <table className={`w-full ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Strategy</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">Chg%</th>
              {expanded && <th className="text-right font-medium pb-1.5">Ticker</th>}
            </tr>
          </thead>
          <tbody>
            {priceData?.map((p) => {
              const isPos = p.changePercent >= 0
              return (
                <tr key={p.symbol} className="border-t border-border/20">
                  <td className={`${expanded ? 'py-1.5' : 'py-0.5'}`}>
                    <span className="font-medium">{HF_NAMES[p.symbol] ?? p.symbol}</span>
                    {!expanded && <span className="text-muted-foreground ml-1 text-[10px]">{p.symbol}</span>}
                  </td>
                  <td className="text-right tabular-nums">${p.price.toFixed(2)}</td>
                  <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{p.changePercent.toFixed(2)}%
                  </td>
                  {expanded && <td className="text-right text-muted-foreground text-[11px]">{p.symbol}</td>}
                </tr>
              )
            })}
            {(!priceData || priceData.length === 0) && !priceLoading && (
              <tr><td colSpan={expanded ? 4 : 3} className="py-2 text-center text-muted-foreground text-[10px]">No data</td></tr>
            )}
          </tbody>
        </table>
      )}

      {tab === 'holdings' && (
        <div className="space-y-0">
          {instData?.map((stock) => (
            <div key={stock.symbol} className="py-1.5 border-b border-border/15 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold">{stock.symbol}</span>
                <div className="flex items-center gap-3">
                  {stock.institutionsPctHeld != null && (
                    <span className="text-[10px] text-muted-foreground">
                      Inst: <span className="text-foreground font-medium">{(stock.institutionsPctHeld * 100).toFixed(1)}%</span>
                    </span>
                  )}
                  {stock.insidersPctHeld != null && (
                    <span className="text-[10px] text-muted-foreground">
                      Inside: <span className="text-foreground font-medium">{(stock.insidersPctHeld * 100).toFixed(1)}%</span>
                    </span>
                  )}
                </div>
              </div>
              {expanded && stock.topHolders.length > 0 && (
                <div className="space-y-0.5 pl-2">
                  {stock.topHolders.slice(0, 3).map((h, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground truncate">{h.organization}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] tabular-nums">{fmtShares(h.shares)}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{(h.pctHeld * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {(!instData || instData.length === 0) && !instLoading && (
            <div className="text-[10px] text-muted-foreground py-3 text-center">No institutional data</div>
          )}
          {instData && instData.length > 0 && (
            <div className="text-[9px] text-muted-foreground/50 pt-1">Source: Yahoo Finance · Quarterly 13F filings</div>
          )}
        </div>
      )}

      {tab === 'news' && (
        <div className="space-y-0">
          {(expanded ? newsData : newsData?.slice(0, 8))?.map((item) => {
            const cls = classifyHeadline(item.title)
            return (
              <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-1 px-1 rounded-sm transition-colors">
                <div className="flex-1 min-w-0">
                  {cls && (
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                      style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}>
                      {CATEGORY_LABELS[cls.category]}
                    </span>
                  )}
                  <span className={`font-medium leading-snug text-foreground ${expanded ? 'text-[13px]' : 'text-[11px] line-clamp-2'}`}>{item.title}</span>
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
