import { useState, useCallback } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'

interface Earning {
  date: string
  epsActual: number | null
  epsEstimate: number | null
  hour: string
  quarter: number
  revenueActual: number | null
  revenueEstimate: number | null
  symbol: string
  year: number
}

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function fmtRev(n: number | null): string {
  if (n == null) return '-'
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(0) + 'M'
  return '$' + n.toFixed(0)
}

export default function IpoEarningsPanel() {
  const [tab, setTab] = useState<'earnings' | 'news'>('news')
  const { data: newsData, loading: newsLoading, error: newsError, refresh } = useNewsData('ipo')

  const { data: earningsData, loading: earningsLoading } = usePolling<Earning[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/market/earnings')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 600_000,
    enabled: tab === 'earnings',
  })

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="IPOs & Earnings" loading={newsLoading && earningsLoading} error={newsError} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'earnings')} onClick={() => setTab('earnings')}>Earnings</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'earnings' && earningsLoading && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
      )}

      {tab === 'earnings' && earningsData && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Symbol</th>
              <th className="text-left font-medium pb-1.5">Date</th>
              <th className="text-right font-medium pb-1.5">EPS</th>
              <th className="text-right font-medium pb-1.5">Rev</th>
            </tr>
          </thead>
          <tbody>
            {earningsData.map((e, i) => {
              const beat = e.epsActual != null && e.epsEstimate != null && e.epsActual > e.epsEstimate
              const miss = e.epsActual != null && e.epsEstimate != null && e.epsActual < e.epsEstimate
              return (
                <tr key={`${e.symbol}-${i}`} className="border-t border-border/20">
                  <td className="py-0.5">
                    <span className="font-medium">{e.symbol}</span>
                    <span className="text-[8px] text-muted-foreground ml-1">Q{e.quarter}</span>
                  </td>
                  <td className="py-0.5 text-muted-foreground text-[10px]">
                    {e.date}
                    {e.hour === 'bmo' && <span className="ml-0.5">AM</span>}
                    {e.hour === 'amc' && <span className="ml-0.5">PM</span>}
                  </td>
                  <td className={`text-right tabular-nums font-medium ${beat ? 'text-emerald-600' : miss ? 'text-red-500' : ''}`}>
                    {e.epsActual != null ? e.epsActual.toFixed(2) : e.epsEstimate != null ? `(${e.epsEstimate.toFixed(2)})` : '-'}
                  </td>
                  <td className="text-right tabular-nums text-muted-foreground">
                    {fmtRev(e.revenueActual ?? e.revenueEstimate)}
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
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-1 px-1 rounded-sm transition-colors"
              >
                <div className="flex-1 min-w-0">
                  {cls && (
                    <span
                      className="inline-block text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                      style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}
                    >
                      {CATEGORY_LABELS[cls.category]}
                    </span>
                  )}
                  <span className="text-[11px] font-medium leading-snug text-foreground line-clamp-2">
                    {item.title}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                  {relTime(item.published)}
                </span>
              </a>
            )
          })}
        </div>
      )}
    </PanelWrapper>
  )
}
