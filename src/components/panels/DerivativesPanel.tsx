import { useState, useCallback, useMemo } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { useMarketStore } from '@/stores/market-store'
import { relTime } from '@/lib/panel-utils'

const VOL_SYMBOLS = ['VIXY', 'UVXY', 'SVXY', 'SQQQ', 'TQQQ', 'SPXS']
const VOL_NAMES: Record<string, string> = {
  VIXY: 'VIX Short-Term', UVXY: 'Ultra VIX', SVXY: 'Short VIX',
  SQQQ: '3x Short QQQ', TQQQ: '3x Long QQQ', SPXS: '3x Short SPX',
}

const MONTH_LABELS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8']

function buildTermStructure(spot: number) {
  // Standard contango model anchored to real VIX spot price
  const steps = [0, 0.8, 1.5, 2.1, 2.6, 3.0, 3.3, 3.5]
  return steps.map((delta, i) => ({ month: MONTH_LABELS[i] ?? `M${i + 1}`, value: +(spot + delta).toFixed(2) }))
}

function termStructureChartData(structure: { month: string; value: number }[]) {
  const base = new Date()
  base.setDate(1)
  return structure.map((pt, i) => {
    const d = new Date(base)
    d.setMonth(base.getMonth() + i)
    return { time: d.toISOString().slice(0, 10), value: pt.value }
  })
}

export default function DerivativesPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'prices' | 'term' | 'news'>('prices')
  const { data: newsData, loading: newsLoading, error, refresh } = useNewsData('derivatives')
  const { data: priceData, loading: priceLoading } = usePolling({
    fetcher: useCallback(() => fetchQuotes(VOL_SYMBOLS), []),
    interval: 300_000,
    enabled: tab === 'prices',
  })

  const indices = useMarketStore((s) => s.indices)
  const vixEntry = indices.find((d) => d.symbol === 'VIX' || d.symbol === 'VIXY')
  const vixSpot = vixEntry?.price ?? 18

  const termStructure = useMemo(() => buildTermStructure(vixSpot), [vixSpot])
  const chartData = useMemo(() => termStructureChartData(termStructure), [termStructure])

  const isBackwardation = (termStructure[0]?.value ?? 0) > (termStructure[termStructure.length - 1]?.value ?? 0)

  // P/C ratio proxy derived from VIX level (higher VIX = more put buying)
  const pcRatio = vixSpot > 25 ? 1.28 : vixSpot > 20 ? 1.05 : vixSpot > 15 ? 0.92 : 0.76
  const putsWidth = Math.min(Math.max((pcRatio / (pcRatio + 1)) * 100, 20), 80)

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Derivatives & Vol" loading={newsLoading && priceLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'prices')} onClick={() => setTab('prices')}>Vol ETFs</button>
        <button className={tabCls(tab === 'term')} onClick={() => setTab('term')}>Term Structure</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'prices' && (
        <table className={`w-full ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Name</th>
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
                    <div className="font-medium">{VOL_NAMES[p.symbol] ?? p.symbol}</div>
                    <div className="text-muted-foreground text-[10px]">{p.symbol}</div>
                  </td>
                  <td className="text-right tabular-nums">${p.price.toFixed(2)}</td>
                  <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{p.changePercent.toFixed(2)}%
                  </td>
                </tr>
              )
            })}
            {(!priceData || priceData.length === 0) && !priceLoading && (
              <tr><td colSpan={3} className="py-3 text-center text-muted-foreground text-[10px]">No data</td></tr>
            )}
          </tbody>
        </table>
      )}

      {tab === 'term' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">VIX Term Structure · contango model</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-px rounded-sm ${isBackwardation ? 'text-red-500 bg-red-500/10' : 'text-amber-500 bg-amber-500/10'}`}>
              {isBackwardation ? 'Backwardation' : 'Contango'}
            </span>
          </div>

          <LightweightChart
            type="area"
            data={chartData}
            height={expanded ? 300 : 120}
            lineColor="#f59e0b"
            areaTopColor="rgba(245,158,11,0.18)"
            areaBottomColor="rgba(245,158,11,0.02)"
          />

          <div className="grid grid-cols-8 gap-0.5 mt-1">
            {termStructure.map((pt) => (
              <div key={pt.month} className="text-center">
                <div className="text-[10px] text-muted-foreground">{pt.month}</div>
                <div className="text-[10px] tabular-nums font-medium">{pt.value.toFixed(1)}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/20 pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">P/C Ratio proxy (VIX-derived)</span>
              <span className={`text-[10px] font-medium tabular-nums ${pcRatio > 1.1 ? 'text-red-500' : pcRatio < 0.85 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {pcRatio.toFixed(2)}
              </span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden gap-px">
              <div className="bg-red-500 rounded-l-full" style={{ width: `${putsWidth}%` }} />
              <div className="bg-emerald-500 rounded-r-full flex-1" />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[10px] text-muted-foreground">Puts</span>
              <span className="text-[10px] text-muted-foreground">Calls</span>
            </div>
          </div>
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
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                      style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}>
                      {CATEGORY_LABELS[cls.category]}
                    </span>
                  )}
                  <span className={`text-[11px] font-medium leading-snug text-foreground ${expanded ? '' : 'line-clamp-2'}`}>{item.title}</span>
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
