import { useState, useCallback, useEffect } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { fetchCandles, type CandleData } from '@/services/api/candles'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime, tabCls } from '@/lib/panel-utils'

const BOND_SYMBOLS = ['TLT', 'IEF', 'SHY', 'HYG', 'LQD', 'AGG']
const BOND_NAMES: Record<string, string> = {
  TLT: '20+ Yr Treasury', IEF: '7-10 Yr Treasury', SHY: '1-3 Yr Treasury',
  HYG: 'High Yield Corp', LQD: 'IG Corp', AGG: 'US Agg Bond',
}
const BOND_YTM: Record<string, number> = {
  TLT: 4.2, IEF: 4.0, SHY: 4.5, HYG: 7.5, LQD: 5.2, AGG: 4.8,
}

const CHART_SYMBOLS = ['TLT', 'IEF', 'HYG', 'LQD']


export default function BondNewsPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'prices' | 'spreads' | 'chart' | 'news'>('prices')
  const [chartSymbol, setChartSymbol] = useState('TLT')
  const [chartData, setChartData] = useState<CandleData[]>([])

  const { data: newsData, loading: newsLoading, error, refresh } = useNewsData('bonds')
  const { data: priceData, loading: priceLoading } = usePolling({
    fetcher: useCallback(() => fetchQuotes(BOND_SYMBOLS), []),
    interval: 300_000,
    enabled: tab !== 'news' && tab !== 'chart',
  })

  useEffect(() => {
    if (tab === 'chart' || expanded) {
      fetchCandles(chartSymbol).then(setChartData).catch(() => {})
    }
  }, [tab, chartSymbol, expanded])

  const priceMap = Object.fromEntries((priceData ?? []).map((q) => [q.symbol, q]))

  const aggChg = priceMap['AGG']?.changePercent ?? 0
  const lqdChg = priceMap['LQD']?.changePercent ?? 0
  const hygChg = priceMap['HYG']?.changePercent ?? 0

  // Spread estimates in basis points derived from relative ETF performance vs AGG
  // Each 0.1% underperformance vs benchmark ~ 10bp spread widening (rough proxy)
  const igDelta = lqdChg - aggChg
  const hyDelta = hygChg - aggChg
  const igSpread = Math.round(250 + igDelta * -100)
  const hySpread = Math.round(380 + hyDelta * -100)
  const emSpread = 420

  const spreadData = [
    { name: 'IG Corp', description: 'Investment Grade', spread: igSpread, widening: igDelta < 0 },
    { name: 'HY Corp', description: 'High Yield', spread: hySpread, widening: hyDelta < 0 },
    { name: 'EM Debt', description: 'Emerging Markets', spread: emSpread, widening: false },
  ]

  const maxSpread = Math.max(...spreadData.map((s) => s.spread))
  const hyStressed = hySpread > 400

  return (
    <PanelWrapper title="Bond Markets" loading={newsLoading && priceLoading} error={error} onRetry={refresh}>
      <div className="flex flex-wrap gap-1 mb-2">
        <button className={tabCls(tab === 'prices')} onClick={() => setTab('prices')}>ETFs</button>
        <button className={tabCls(tab === 'spreads')} onClick={() => setTab('spreads')}>Spreads</button>
        <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'prices' && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Name</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">Chg%</th>
              <th className="text-right font-medium pb-1.5">YTM</th>
            </tr>
          </thead>
          <tbody>
            {(!priceData || priceData.length === 0) && !priceLoading && (
              <tr><td colSpan={4} className="py-3 text-center text-muted-foreground text-[10px]">No data available. Try News tab.</td></tr>
            )}
            {priceData?.map((p) => {
              const isPos = (p.changePercent ?? 0) >= 0
              return (
                <tr key={p.symbol} className="border-t border-border/20">
                  <td className="py-0.5">
                    <span className="font-medium">{BOND_NAMES[p.symbol] || p.symbol}</span>
                    <span className="text-muted-foreground ml-1 text-[10px]">{p.symbol}</span>
                  </td>
                  <td className="text-right tabular-nums">${p.price.toFixed(2)}</td>
                  <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{(p.changePercent ?? 0).toFixed(2)}%
                  </td>
                  <td className="text-right tabular-nums text-muted-foreground">
                    {BOND_YTM[p.symbol] != null ? `${BOND_YTM[p.symbol]!.toFixed(1)}%` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'spreads' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Credit Stress</span>
            <span className={`text-[9px] font-bold uppercase px-1 py-px rounded-sm ${hyStressed ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
              {hyStressed ? 'ELEVATED' : 'NORMAL'}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {spreadData.map((s) => {
              const barPct = Math.min((s.spread / maxSpread) * 100, 100)
              return (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-[11px] font-medium text-foreground">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">{s.description}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] tabular-nums font-bold text-foreground">{s.spread}bp</span>
                      <span className={`text-[11px] ${s.widening ? 'text-red-500' : 'text-emerald-600'}`}>
                        {s.widening ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted/40 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${s.widening ? 'bg-red-400' : 'bg-emerald-500'}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Spreads estimated from ETF relative performance vs AGG. IG base ~250bp, HY base ~380bp.</p>
        </div>
      )}

      {(tab === 'chart' || expanded) && (
        <div className={expanded ? 'mb-4' : ''}>
          {expanded && <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold py-1 border-b border-border/30 mb-2">Chart</div>}
          <div className="flex gap-1 mb-1">
            {CHART_SYMBOLS.map((sym) => (
              <button
                key={sym}
                className={`text-[9px] px-1 rounded-sm ${chartSymbol === sym ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
                onClick={() => setChartSymbol(sym)}
              >
                {sym}
              </button>
            ))}
          </div>
          <LightweightChart
            type="area"
            data={chartData}
            height={expanded ? 300 : 140}
            lineColor="#6366f1"
            areaTopColor="rgba(99, 102, 241, 0.2)"
            areaBottomColor="rgba(99, 102, 241, 0.02)"
          />
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
