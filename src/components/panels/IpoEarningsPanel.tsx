import { useState, useCallback } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime } from '@/lib/panel-utils'

interface Earning {
  reportDate: string
  epsActual: number | null
  epsEstimate: number | null
  hour: string
  revenueActual: number | null
  revenueEstimate: number | null
  symbol: string
}

interface IpoQuote {
  symbol: string
  shortName?: string
  longName?: string
  regularMarketPrice?: number
  ipoExpectedDate?: string
  exchange?: string
}

function fmtRev(n: number | null): string {
  if (n == null) return '-'
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(0) + 'M'
  return '$' + n.toFixed(0)
}

function epsSurprise(actual: number | null, estimate: number | null): string | null {
  if (actual == null || estimate == null || estimate === 0) return null
  const pct = ((actual - estimate) / Math.abs(estimate)) * 100
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%'
}


export default function IpoEarningsPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'earnings' | 'pipeline' | 'news' | 'season'>('news')
  const { data: newsData, loading: newsLoading, error: newsError, refresh } = useNewsData('ipo')

  const { data: earningsData, loading: earningsLoading } = usePolling<Earning[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/market/earnings')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 600_000,
    enabled: tab === 'earnings' || tab === 'season',
  })

  const { data: ipoData, loading: ipoLoading } = usePolling<IpoQuote[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/market/ipo')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 600_000,
    enabled: tab === 'pipeline',
  })

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const hasEarnings = earningsData && earningsData.length > 0
  const hasIpos = ipoData && ipoData.length > 0

  return (
    <PanelWrapper title="IPOs & Earnings" loading={newsLoading && earningsLoading} error={newsError} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'earnings')} onClick={() => setTab('earnings')}>Earnings</button>
        <button className={tabCls(tab === 'pipeline')} onClick={() => setTab('pipeline')}>Pipeline</button>
        <button className={tabCls(tab === 'season')} onClick={() => setTab('season')}>Season</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'earnings' && earningsLoading && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
      )}

      {tab === 'earnings' && !earningsLoading && hasEarnings && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Symbol</th>
              <th className="text-left font-medium pb-1.5">Date</th>
              <th className="text-right font-medium pb-1.5">EPS est.</th>
              <th className="text-right font-medium pb-1.5">Surprise</th>
              <th className="text-right font-medium pb-1.5">Rev</th>
            </tr>
          </thead>
          <tbody>
            {earningsData!.map((e, i) => {
              const beat = e.epsActual != null && e.epsEstimate != null && e.epsActual > e.epsEstimate
              const miss = e.epsActual != null && e.epsEstimate != null && e.epsActual < e.epsEstimate
              const surprise = epsSurprise(e.epsActual, e.epsEstimate)
              return (
                <tr key={`${e.symbol}-${i}`} className="border-t border-border/20">
                  <td className="py-0.5 font-medium">{e.symbol}</td>
                  <td className="py-0.5 text-muted-foreground text-[10px]">
                    {e.reportDate}
                    {e.hour === 'bmo' && <span className="ml-0.5 text-[9px] bg-zinc-500/15 px-1 py-px rounded-sm">BMO</span>}
                    {e.hour === 'amc' && <span className="ml-0.5 text-[9px] bg-zinc-500/15 px-1 py-px rounded-sm">AMC</span>}
                  </td>
                  <td className={`text-right tabular-nums font-medium ${beat ? 'text-emerald-600' : miss ? 'text-red-500' : ''}`}>
                    {e.epsActual != null ? e.epsActual.toFixed(2) : e.epsEstimate != null ? e.epsEstimate.toFixed(2) : '-'}
                  </td>
                  <td className={`text-right tabular-nums text-[10px] ${beat ? 'text-emerald-600' : miss ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {surprise ?? '-'}
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

      {tab === 'earnings' && !earningsLoading && !hasEarnings && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">No upcoming earnings data</div>
      )}

      {tab === 'pipeline' && ipoLoading && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
      )}

      {tab === 'pipeline' && !ipoLoading && hasIpos && (
        <div className="space-y-0">
          {ipoData!.map((ipo) => {
            const name = ipo.shortName ?? ipo.longName ?? ipo.symbol
            const date = ipo.ipoExpectedDate ?? ''
            const price = ipo.regularMarketPrice != null ? `$${ipo.regularMarketPrice.toFixed(2)}` : null
            return (
              <div key={ipo.symbol} className={`border-b border-border/20 last:border-0 ${expanded ? 'py-2' : 'py-1.5'}`}>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium truncate ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>{name}</span>
                    <span className={`text-muted-foreground ml-1 ${expanded ? 'text-[11px]' : 'text-[10px]'}`}>{ipo.symbol}</span>
                  </div>
                  {ipo.exchange && (
                    <span className="text-[9px] bg-zinc-500/15 text-muted-foreground px-1 py-px rounded-sm">{ipo.exchange}</span>
                  )}
                  {price && (
                    <span className={`tabular-nums font-medium ${expanded ? 'text-[12px]' : 'text-[10px] text-muted-foreground'}`}>{price}</span>
                  )}
                  {date && (
                    <span className={`text-muted-foreground tabular-nums ${expanded ? 'text-[11px]' : 'text-[10px]'}`}>{date}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'pipeline' && !ipoLoading && !hasIpos && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">No upcoming IPOs found</div>
      )}

      {tab === 'season' && earningsLoading && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
      )}

      {tab === 'season' && !earningsLoading && (() => {
        const upcoming = earningsData ?? []
        const today = new Date().toISOString().slice(0, 10)
        const thisWeek = upcoming.filter((e) => e.reportDate >= today).slice(0, 5)
        const nextWeek = upcoming.filter((e) => e.reportDate >= today).slice(5, 10)
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Upcoming this week</span>
              <span className="text-[9px] text-muted-foreground/60 tabular-nums">{upcoming.length} total</span>
            </div>

            {thisWeek.length > 0 ? (
              <div className="space-y-0">
                {thisWeek.map((e, i) => (
                  <div key={`${e.symbol}-${i}`} className="flex items-center gap-2 border-b border-border/20 last:border-0 py-1">
                    <span className="font-medium text-[11px] w-16 shrink-0">{e.symbol}</span>
                    <span className="text-[10px] text-muted-foreground flex-1">{e.reportDate}</span>
                    {e.epsEstimate != null && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">EPS est. {e.epsEstimate.toFixed(2)}</span>
                    )}
                    {e.hour === 'bmo' && <span className="text-[9px] bg-zinc-500/15 px-1 py-px rounded-sm text-muted-foreground">BMO</span>}
                    {e.hour === 'amc' && <span className="text-[9px] bg-zinc-500/15 px-1 py-px rounded-sm text-muted-foreground">AMC</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground/60">No earnings scheduled this week</p>
            )}

            {nextWeek.length > 0 && (
              <>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Next up</p>
                <div className="space-y-0">
                  {nextWeek.map((e, i) => (
                    <div key={`nw-${e.symbol}-${i}`} className="flex items-center gap-2 border-b border-border/20 last:border-0 py-1">
                      <span className="font-medium text-[11px] w-16 shrink-0">{e.symbol}</span>
                      <span className="text-[10px] text-muted-foreground flex-1">{e.reportDate}</span>
                      {e.epsEstimate != null && (
                        <span className="text-[10px] text-muted-foreground tabular-nums">EPS est. {e.epsEstimate.toFixed(2)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            <p className="text-[9px] text-muted-foreground/50">Beat rate stats require FactSet/S&P data, not available via this feed</p>
          </div>
        )
      })()}

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
                      className="inline-block text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
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
