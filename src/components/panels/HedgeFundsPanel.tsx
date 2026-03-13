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

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function HedgeFundsPanel() {
  const [tab, setTab] = useState<'prices' | 'news'>('prices')
  const { data: newsData, loading: newsLoading, error, refresh } = useNewsData('hedgefunds')
  const { data: priceData, loading: priceLoading } = usePolling({
    fetcher: useCallback(() => fetchQuotes(HF_SYMBOLS), []),
    interval: 300_000,
    enabled: tab === 'prices',
  })

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Hedge Funds & PE" loading={newsLoading && priceLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'prices')} onClick={() => setTab('prices')}>Alt ETFs</button>
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
