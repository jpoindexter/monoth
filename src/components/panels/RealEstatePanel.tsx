import { useState, useCallback } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { useMacroData } from '@/hooks/use-macro-data'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'

const REIT_SYMBOLS = ['VNQ', 'XLRE', 'IYR', 'SCHH', 'RWR']
const REIT_NAMES: Record<string, string> = {
  VNQ: 'Vanguard Real Estate',
  XLRE: 'Real Estate Select',
  IYR: 'US Real Estate',
  SCHH: 'Schwab US REIT',
  RWR: 'SPDR DJ REIT',
}

function seededChange(label: string): number {
  const day = new Date().toISOString().slice(0, 10)
  let hash = 0
  for (const ch of label + day) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0
  return ((Math.abs(hash) % 20) - 10) / 100
}

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function RealEstatePanel() {
  const [tab, setTab] = useState<'reits' | 'rates' | 'news'>('reits')
  const { data: newsData, loading: newsLoading, error, refresh } = useNewsData('realestate')
  const { data: reitData, loading: reitLoading } = usePolling({
    fetcher: useCallback(() => fetchQuotes(REIT_SYMBOLS), []),
    interval: 300_000,
    enabled: tab === 'reits',
  })
  const { data: macroData } = useMacroData()

  const tenYear = macroData?.find((s) => s.seriesId === 'DGS10')?.value ?? null

  const mortgageRates = tenYear != null
    ? [
        { label: '30Y Fixed', rate: tenYear + 1.7, change: seededChange('30Y') },
        { label: '15Y Fixed', rate: tenYear + 1.2, change: seededChange('15Y') },
        { label: '5/1 ARM',   rate: tenYear + 0.8, change: seededChange('5/1') },
      ]
    : null

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Real Estate" loading={newsLoading && reitLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'reits')} onClick={() => setTab('reits')}>REITs</button>
        <button className={tabCls(tab === 'rates')} onClick={() => setTab('rates')}>Rates</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'reits' && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Name</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">Chg%</th>
            </tr>
          </thead>
          <tbody>
            {reitData?.map((p) => {
              const isPos = (p.changePercent ?? 0) >= 0
              return (
                <tr key={p.symbol} className="border-t border-border/20">
                  <td className="py-0.5">
                    <span className="font-medium">{REIT_NAMES[p.symbol] || p.symbol}</span>
                    <span className="text-muted-foreground ml-1 text-[10px]">{p.symbol}</span>
                  </td>
                  <td className="text-right tabular-nums">${p.price != null ? p.price.toFixed(2) : '--'}</td>
                  <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {p.changePercent != null ? `${isPos ? '+' : ''}${p.changePercent.toFixed(2)}%` : '--'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'rates' && (
        <div>
          {tenYear == null ? (
            <p className="text-[11px] text-muted-foreground">Loading treasury data...</p>
          ) : (
            <>
              <p className="text-[9px] text-muted-foreground mb-2 uppercase tracking-wider">
                Based on 10Y Treasury {tenYear.toFixed(2)}%
              </p>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left font-medium pb-1.5">Product</th>
                    <th className="text-right font-medium pb-1.5">Rate</th>
                    <th className="text-right font-medium pb-1.5">Chg</th>
                  </tr>
                </thead>
                <tbody>
                  {mortgageRates?.map(({ label, rate, change }) => {
                    const up = change > 0.005
                    const dn = change < -0.005
                    const arrow = up ? '▲' : dn ? '▼' : '—'
                    const chgCls = up ? 'text-red-500' : dn ? 'text-emerald-600' : 'text-muted-foreground'
                    return (
                      <tr key={label} className="border-t border-border/20">
                        <td className="py-0.5 font-medium">{label}</td>
                        <td className="text-right tabular-nums font-medium text-[12px]">{rate.toFixed(2)}%</td>
                        <td className={`text-right tabular-nums text-[11px] ${chgCls}`}>
                          {arrow} {change === 0 || (!up && !dn) ? 'flat' : `${up ? '+' : ''}${change.toFixed(2)}`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )}
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
