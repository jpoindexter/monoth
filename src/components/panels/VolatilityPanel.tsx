import { useState, useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper } from '@/components/layout/PanelWrapper'

const VOL_SYMBOLS = ['VIXY', 'UVXY', 'SVXY', 'VXX']
const VOL_NAMES: Record<string, string> = {
  'VIXY': 'VIX Short-Term',
  'UVXY': 'VIX 1.5x',
  'SVXY': 'Short VIX',
  'VXX': 'VIX Mid-Term',
}

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function VolatilityPanel() {
  const [tab, setTab] = useState<'etfs' | 'news'>('etfs')
  const fetcher = useCallback(() => fetchQuotes(VOL_SYMBOLS), [])
  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 300_000 })
  const { data: newsData } = useNewsData('derivatives')

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Volatility" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'etfs')} onClick={() => setTab('etfs')}>ETFs</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'etfs' && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Name</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">Chg%</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((point) => {
              const isPositive = point.changePercent >= 0
              return (
                <tr key={point.symbol} className="border-t border-border/20">
                  <td className="py-1">
                    <span className="font-medium text-foreground">{VOL_NAMES[point.symbol] || point.symbol}</span>
                    <span className="text-muted-foreground ml-1.5 text-[10px]">{point.symbol}</span>
                  </td>
                  <td className="text-right tabular-nums font-medium">
                    {point.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`text-right tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{point.changePercent.toFixed(2)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'news' && (
        <div className="space-y-0">
          {newsData?.map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 -mx-1 px-1 rounded-sm transition-colors">
              <span className="text-[11px] font-medium leading-snug text-foreground line-clamp-2 flex-1">{item.title}</span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">{relTime(item.published)}</span>
            </a>
          ))}
        </div>
      )}
    </PanelWrapper>
  )
}
