import { useState, useCallback } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { useNewsData } from '@/hooks/use-news-data'
import { fetchSectors } from '@/services/api'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'

function getBlockStyle(changePercent: number): React.CSSProperties {
  const magnitude = Math.min(Math.abs(changePercent) / 3, 1)
  if (changePercent >= 0) {
    const lightness = Math.round(35 - magnitude * 20)
    return { backgroundColor: `hsl(142, 70%, ${lightness}%)` }
  } else {
    const lightness = Math.round(35 - magnitude * 20)
    return { backgroundColor: `hsl(0, 70%, ${lightness}%)` }
  }
}

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function SectorHeatmapPanel() {
  const [tab, setTab] = useState<'heatmap' | 'table' | 'news'>('heatmap')
  const fetcher = useCallback(() => fetchSectors(), [])
  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 60_000 })
  const { data: newsData } = useNewsData('analysis')

  const sorted = data ? [...data].sort((a, b) => b.changePercent - a.changePercent) : null

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Sectors" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'heatmap')} onClick={() => setTab('heatmap')}>Heatmap</button>
        <button className={tabCls(tab === 'table')} onClick={() => setTab('table')}>Table</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'heatmap' && (
        <div className="grid grid-cols-3 gap-1 auto-rows-fr" style={{ minHeight: '120px' }}>
          {data?.map((sector) => (
            <div
              key={sector.symbol}
              className="flex flex-col items-center justify-center rounded px-1 py-0.5 text-white"
              style={getBlockStyle(sector.changePercent)}
            >
              <span className="text-[9px] font-medium text-center leading-tight text-white/80">{sector.name}</span>
              <span className="text-[11px] font-bold tabular-nums">
                {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent?.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'table' && sorted && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Sector</th>
              <th className="text-right font-medium pb-1.5">ETF</th>
              <th className="text-right font-medium pb-1.5">Chg%</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const isPos = s.changePercent >= 0
              return (
                <tr key={s.symbol} className="border-t border-border/20">
                  <td className="py-0.5 font-medium">{s.name}</td>
                  <td className="text-right text-muted-foreground">{s.symbol}</td>
                  <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{s.changePercent.toFixed(2)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'news' && (
        <div className="space-y-0">
          {newsData?.slice(0, 10).map((item) => {
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
