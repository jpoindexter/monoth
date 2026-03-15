import { useState, useCallback, useEffect } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { fetchCandles, type CandleData } from '@/services/api/candles'
import { useMacroData } from '@/hooks/use-macro-data'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime } from '@/lib/panel-utils'

const REIT_SYMBOLS = ['VNQ', 'XLRE', 'IYR', 'SCHH', 'RWR']
const REIT_NAMES: Record<string, string> = {
  VNQ: 'Vanguard Real Estate',
  XLRE: 'Real Estate Select',
  IYR: 'US Real Estate',
  SCHH: 'Schwab US REIT',
  RWR: 'SPDR DJ REIT',
}

const CHART_SYMBOLS = ['VNQ', 'XLRE', 'IYR'] as const
type ChartSymbol = typeof CHART_SYMBOLS[number]

const HOUSING_METRICS = [
  { label: 'Median Home Price', value: '$420K', raw: 420000, fmt: (v: number) => `$${(v / 1000).toFixed(0)}K` },
  { label: 'Housing Starts', value: '1.40M', raw: 1400000, fmt: (v: number) => `${(v / 1000000).toFixed(2)}M` },
  { label: 'Existing Home Sales', value: '4.10M', raw: 4100000, fmt: (v: number) => `${(v / 1000000).toFixed(2)}M` },
  { label: 'Months of Supply', value: '3.8', raw: 3.8, fmt: (v: number) => v.toFixed(1) },
  { label: 'Case-Shiller YoY', value: '5.2%', raw: 5.2, fmt: (v: number) => `${v.toFixed(1)}%` },
]

function marketTemp(months: number): { label: string; color: string } {
  if (months < 3) return { label: 'HOT', color: '#ef4444' }
  if (months < 5) return { label: 'WARM', color: '#f97316' }
  if (months < 7) return { label: 'COOL', color: '#3b82f6' }
  return { label: 'COLD', color: '#6366f1' }
}

export default function RealEstatePanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'reits' | 'rates' | 'housing' | 'chart' | 'news'>('reits')
  const [chartSymbol, setChartSymbol] = useState<ChartSymbol>('VNQ')
  const [candles, setCandles] = useState<CandleData[]>([])
  const [candlesLoading, setCandlesLoading] = useState(false)

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
        { label: '30Y Fixed', rate: tenYear + 1.7 },
        { label: '15Y Fixed', rate: tenYear + 1.2 },
        { label: '5/1 ARM',   rate: tenYear + 0.8 },
      ]
    : null

  useEffect(() => {
    if (tab !== 'chart') return
    setCandlesLoading(true)
    fetchCandles(chartSymbol)
      .then(setCandles)
      .catch(() => setCandles([]))
      .finally(() => setCandlesLoading(false))
  }, [tab, chartSymbol])

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const monthsSupply = HOUSING_METRICS[3]?.raw ?? 3.8
  const temp = marketTemp(monthsSupply)

  return (
    <PanelWrapper title="Real Estate" loading={newsLoading && reitLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'reits')} onClick={() => setTab('reits')}>REITs</button>
        <button className={tabCls(tab === 'rates')} onClick={() => setTab('rates')}>Rates</button>
        <button className={tabCls(tab === 'housing')} onClick={() => setTab('housing')}>Housing</button>
        <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'reits' && (
        <table className={`w-full ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>
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
                    <div className="font-medium">{REIT_NAMES[p.symbol] || p.symbol}</div>
                    <div className="text-muted-foreground text-[10px]">{p.symbol}</div>
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
              <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">
                Based on 10Y Treasury {tenYear.toFixed(2)}%
              </p>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left font-medium pb-1.5">Product</th>
                    <th className="text-right font-medium pb-1.5">Rate (est.)</th>
                  </tr>
                </thead>
                <tbody>
                  {mortgageRates?.map(({ label, rate }) => (
                    <tr key={label} className="border-t border-border/20">
                      <td className="py-0.5 font-medium">{label}</td>
                      <td className="text-right tabular-nums font-medium text-[12px]">{rate.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {tab === 'housing' && (
        <div>
          {/* Market Temp gauge */}
          <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-sm border border-border/30"
            style={{ borderLeftColor: temp.color, borderLeftWidth: 3 }}>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Market Temp</span>
            <span className="font-bold text-[11px] ml-auto" style={{ color: temp.color }}>{temp.label}</span>
            <span className="text-[10px] text-muted-foreground">{monthsSupply.toFixed(1)}mo supply</span>
          </div>

          <div className="mb-1.5 px-1.5 py-0.5 rounded-sm bg-border/20 border border-border/30">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Reference · NAR / Census Bureau</span>
          </div>
          <table className={`w-full ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-medium pb-1.5">Metric</th>
                <th className="text-right font-medium pb-1.5">Value</th>
              </tr>
            </thead>
            <tbody>
              {HOUSING_METRICS.map(({ label, value }) => (
                <tr key={label} className="border-t border-border/20">
                  <td className="py-0.5 text-[10px]">{label}</td>
                  <td className="text-right tabular-nums font-medium">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'chart' && (
        <div>
          <div className="flex gap-1 mb-2">
            {CHART_SYMBOLS.map((sym) => (
              <button key={sym} className={tabCls(chartSymbol === sym)} onClick={() => setChartSymbol(sym)}>
                {sym}
              </button>
            ))}
          </div>
          {candlesLoading ? (
            <p className="text-[11px] text-muted-foreground py-2">Loading...</p>
          ) : candles.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-2">No data</p>
          ) : (
            <LightweightChart type="candlestick" data={candles} height={expanded ? 300 : 130} className="w-full" />
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
