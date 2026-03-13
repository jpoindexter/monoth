import { useState, useCallback } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { useNewsData } from '@/hooks/use-news-data'
import { fetchSectors } from '@/services/api'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime } from '@/lib/panel-utils'

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

type TabId = 'heatmap' | 'table' | 'news' | 'rotation' | 'performance'

export default function SectorHeatmapPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<TabId>('heatmap')
  const fetcher = useCallback(() => fetchSectors(), [])
  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 60_000 })
  const { data: newsData } = useNewsData('analysis')

  const sorted = data ? [...data].filter(s => s.changePercent != null).sort((a, b) => b.changePercent - a.changePercent) : null
  const byMagnitude = data ? [...data].filter(s => s.changePercent != null).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)) : null
  const best = sorted?.[0]
  const worst = sorted?.[sorted.length - 1]

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  // Rotation tab derived data
  const rotationData = (() => {
    if (!data) return null
    const median = [...data].sort((a, b) => a.changePercent - b.changePercent)[Math.floor(data.length / 2)]?.changePercent ?? 0
    return data.map((s) => {
      const pos = s.changePercent >= 0
      const aboveMedian = s.changePercent >= median
      let quadrant: 'Leading' | 'Weakening' | 'Improving' | 'Lagging'
      if (pos && aboveMedian) quadrant = 'Leading'
      else if (pos && !aboveMedian) quadrant = 'Weakening'
      else if (!pos && aboveMedian) quadrant = 'Improving'
      else quadrant = 'Lagging'
      return { ...s, quadrant }
    })
  })()

  // Performance tab derived data
  const DEFENSIVE = ['XLU', 'XLP', 'XLV']
  const CYCLICAL = ['XLY', 'XLI', 'XLB']

  const perfData = (() => {
    if (!sorted) return null
    const defAvg = sorted.filter((s) => DEFENSIVE.includes(s.symbol)).reduce((sum, s) => sum + s.changePercent, 0) / DEFENSIVE.length
    const cycAvg = sorted.filter((s) => CYCLICAL.includes(s.symbol)).reduce((sum, s) => sum + s.changePercent, 0) / CYCLICAL.length
    const riskOn = cycAvg > defAvg
    const spread = (sorted[0]?.changePercent ?? 0) - (sorted[sorted.length - 1]?.changePercent ?? 0)
    const maxAbs = Math.max(...sorted.map((s) => Math.abs(s.changePercent)), 0.01)
    return { sectors: sorted, riskOn, spread, maxAbs }
  })()

  return (
    <PanelWrapper title="Sectors" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'heatmap')} onClick={() => setTab('heatmap')}>Heatmap</button>
        <button className={tabCls(tab === 'table')} onClick={() => setTab('table')}>Table</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
        <button className={tabCls(tab === 'rotation')} onClick={() => setTab('rotation')}>Rotation</button>
        <button className={tabCls(tab === 'performance')} onClick={() => setTab('performance')}>Performance</button>
      </div>

      {tab === 'heatmap' && byMagnitude && (
        <div className="flex flex-col gap-1">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: expanded ? 'repeat(auto-fill, minmax(120px, 1fr))' : 'repeat(auto-fill, minmax(80px, 1fr))' }}
          >
            {byMagnitude.map((sector) => (
              <div
                key={sector.symbol}
                className="flex flex-col items-center justify-center rounded px-1 py-2 text-white overflow-hidden"
                style={{ ...getBlockStyle(sector.changePercent), minHeight: expanded ? '90px' : '55px' }}
              >
                <span className={`font-medium text-center leading-tight break-words hyphens-auto ${expanded ? 'text-[11px]' : 'text-[9px]'}`}>{sector.name}</span>
                <span className={`font-bold tabular-nums whitespace-nowrap ${expanded ? 'text-[16px]' : 'text-[13px]'}`}>
                  {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
                </span>
                <span className={`opacity-70 whitespace-nowrap ${expanded ? 'text-[10px]' : 'text-[9px]'}`}>{sector.symbol}</span>
              </div>
            ))}
          </div>
          {best && worst && (
            <div className="text-[10px] mt-0.5">
              <span className="text-emerald-500 font-medium">Best: {best.name} {best.changePercent >= 0 ? '+' : ''}{best.changePercent.toFixed(2)}%</span>
              <span className="text-muted-foreground mx-1">|</span>
              <span className="text-red-500 font-medium">Worst: {worst.name} {worst.changePercent.toFixed(2)}%</span>
            </div>
          )}
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
          {newsData?.slice(0, expanded ? newsData.length : 10).map((item) => {
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
                  <span className={`text-[11px] font-medium leading-snug text-foreground ${expanded ? '' : 'line-clamp-2'}`}>
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

      {tab === 'rotation' && rotationData && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Sector Rotation Cycle</div>
          <div className="grid grid-cols-2 gap-1" style={{ minHeight: '160px' }}>
            {/* Top-left: Improving */}
            <div className="border border-border/30 rounded p-1.5 flex flex-col gap-0.5 bg-blue-500/5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-blue-400 mb-0.5">Improving</div>
              <div className="text-[9px] text-muted-foreground mb-1">Negative but recovering</div>
              {rotationData.filter((s) => s.quadrant === 'Improving').map((s) => (
                <div key={s.symbol} className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-blue-400">{s.name}</span>
                  <span className="text-[10px] tabular-nums text-blue-400">{s.changePercent.toFixed(2)}%</span>
                </div>
              ))}
              {rotationData.filter((s) => s.quadrant === 'Improving').length === 0 && (
                <span className="text-[10px] text-muted-foreground italic">None</span>
              )}
            </div>
            {/* Top-right: Leading */}
            <div className="border border-border/30 rounded p-1.5 flex flex-col gap-0.5 bg-emerald-500/5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 mb-0.5">Leading</div>
              <div className="text-[9px] text-muted-foreground mb-1">Positive and strong</div>
              {rotationData.filter((s) => s.quadrant === 'Leading').map((s) => (
                <div key={s.symbol} className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-emerald-500">{s.name}</span>
                  <span className="text-[10px] tabular-nums text-emerald-500">+{s.changePercent.toFixed(2)}%</span>
                </div>
              ))}
              {rotationData.filter((s) => s.quadrant === 'Leading').length === 0 && (
                <span className="text-[10px] text-muted-foreground italic">None</span>
              )}
            </div>
            {/* Bottom-left: Lagging */}
            <div className="border border-border/30 rounded p-1.5 flex flex-col gap-0.5 bg-red-500/5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-red-500 mb-0.5">Lagging</div>
              <div className="text-[9px] text-muted-foreground mb-1">Negative and weak</div>
              {rotationData.filter((s) => s.quadrant === 'Lagging').map((s) => (
                <div key={s.symbol} className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-red-500">{s.name}</span>
                  <span className="text-[10px] tabular-nums text-red-500">{s.changePercent.toFixed(2)}%</span>
                </div>
              ))}
              {rotationData.filter((s) => s.quadrant === 'Lagging').length === 0 && (
                <span className="text-[10px] text-muted-foreground italic">None</span>
              )}
            </div>
            {/* Bottom-right: Weakening */}
            <div className="border border-border/30 rounded p-1.5 flex flex-col gap-0.5 bg-yellow-500/5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-yellow-500 mb-0.5">Weakening</div>
              <div className="text-[9px] text-muted-foreground mb-1">Positive but fading</div>
              {rotationData.filter((s) => s.quadrant === 'Weakening').map((s) => (
                <div key={s.symbol} className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-yellow-500">{s.name}</span>
                  <span className="text-[10px] tabular-nums text-yellow-500">+{s.changePercent.toFixed(2)}%</span>
                </div>
              ))}
              {rotationData.filter((s) => s.quadrant === 'Weakening').length === 0 && (
                <span className="text-[10px] text-muted-foreground italic">None</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
            <span className="text-blue-400">Improving</span>
            <span>→</span>
            <span className="text-emerald-500">Leading</span>
            <span>→</span>
            <span className="text-yellow-500">Weakening</span>
            <span>→</span>
            <span className="text-red-500">Lagging</span>
            <span>→</span>
            <span className="text-blue-400">Improving</span>
          </div>
        </div>
      )}

      {tab === 'performance' && perfData && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sector Performance</span>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                perfData.riskOn
                  ? 'bg-emerald-500/20 text-emerald-500'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {perfData.riskOn ? 'Risk-On' : 'Risk-Off'}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            {perfData.sectors.map((s) => {
              const isPos = s.changePercent >= 0
              const barWidth = `${Math.round((Math.abs(s.changePercent) / perfData.maxAbs) * 100)}%`
              return (
                <div key={s.symbol} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground w-[26px] shrink-0 text-right tabular-nums">{s.symbol}</span>
                  <div className="flex-1 h-3 bg-border/20 rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-sm ${isPos ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: barWidth }}
                    />
                  </div>
                  <span className={`text-[10px] tabular-nums font-medium w-[36px] text-right shrink-0 ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{s.changePercent.toFixed(2)}%
                  </span>
                </div>
              )
            })}
          </div>
          <div className="border-t border-border/30 mt-1 pt-1 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Spread (best - worst)</span>
            <span className="text-[10px] font-bold tabular-nums text-foreground">
              {perfData.spread.toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </PanelWrapper>
  )
}
