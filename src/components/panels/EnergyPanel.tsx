import { useState, useCallback, useEffect } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { fetchCandles, type CandleData } from '@/services/api/candles'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime, tabCls } from '@/lib/panel-utils'

const ENERGY_SYMBOLS = ['USO', 'UNG', 'XLE', 'ICLN', 'TAN', 'URA']
const ENERGY_NAMES: Record<string, string> = {
  USO: 'Crude Oil', UNG: 'Nat Gas', XLE: 'Energy ETF', ICLN: 'Clean Energy', TAN: 'Solar', URA: 'Uranium',
}

const CHART_SYMBOLS = ['USO', 'UNG', 'XLE']
const COMMODITY_SYMBOLS = ['CL=F', 'BZ=F', 'NG=F']
const COMMODITY_META: Record<string, { label: string; unit: string }> = {
  'CL=F': { label: 'WTI Crude', unit: '/bbl' },
  'BZ=F': { label: 'Brent Crude', unit: '/bbl' },
  'NG=F': { label: 'Henry Hub', unit: '/MMBtu' },
}

const ENERGY_MIX = [
  { name: 'Oil', pct: 31, color: '#1f2937' },
  { name: 'Natural Gas', pct: 24, color: '#3b82f6' },
  { name: 'Coal', pct: 15, color: '#6b7280' },
  { name: 'Nuclear', pct: 10, color: '#8b5cf6' },
  { name: 'Hydro', pct: 7, color: '#06b6d4' },
  { name: 'Wind', pct: 5, color: '#10b981' },
  { name: 'Solar', pct: 4, color: '#f59e0b' },
  { name: 'Other', pct: 4, color: '#94a3b8' },
]

export default function EnergyPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'prices' | 'mix' | 'chart' | 'news'>('news')
  const [chartSymbol, setChartSymbol] = useState('USO')
  const [chartData, setChartData] = useState<CandleData[]>([])

  const { data: newsData, loading: newsLoading, error, refresh } = useNewsData('energy')
  const { data: priceData, loading: priceLoading } = usePolling({
    fetcher: useCallback(() => fetchQuotes(ENERGY_SYMBOLS), []),
    interval: 300_000,
    enabled: tab === 'prices',
  })

  const { data: commodityData } = usePolling({
    fetcher: useCallback(() => fetchQuotes(COMMODITY_SYMBOLS), []),
    interval: 300_000,
    enabled: tab === 'mix',
  })

  const { data: eiaData } = usePolling({
    fetcher: useCallback(() => fetch('/api/market/energy-prices').then((r) => r.ok ? r.json() : []).catch(() => []), []),
    interval: 3_600_000,
    enabled: tab === 'prices',
  })

  useEffect(() => {
    if (tab === 'chart' || expanded) {
      fetchCandles(chartSymbol).then(setChartData).catch(() => {})
    }
  }, [tab, chartSymbol, expanded])

  return (
    <PanelWrapper title="Energy" loading={newsLoading && priceLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'prices')} onClick={() => setTab('prices')}>Prices</button>
        <button className={tabCls(tab === 'mix')} onClick={() => setTab('mix')}>Mix</button>
        <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'prices' && (
        <>
        {eiaData && eiaData.length > 0 && (
          <div className="mb-2">
            {eiaData.map((c: { commodity: string; name: string; price: number; unit: string; change: number; date: string }) => {
              const isPos = c.change >= 0
              return (
                <div key={c.commodity} className="flex items-baseline justify-between py-0.5 text-[11px]">
                  <span className="font-medium">{c.name}</span>
                  <span className="tabular-nums text-foreground">${c.price.toFixed(2)}/bbl</span>
                  <span className={`tabular-nums font-medium ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{c.change.toFixed(1)}%
                  </span>
                </div>
              )
            })}
            <div className="flex items-center gap-1 mt-1 mb-2">
              <div className="flex-1 border-t border-border/30" />
              <span className="text-[9px] text-muted-foreground whitespace-nowrap">via EIA · weekly</span>
              <div className="flex-1 border-t border-border/30" />
            </div>
          </div>
        )}
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Name</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">Chg%</th>
            </tr>
          </thead>
          <tbody>
            {(!priceData || priceData.length === 0) && !priceLoading && (
              <tr><td colSpan={3} className="py-3 text-center text-muted-foreground text-[10px]">No data available. Try News tab.</td></tr>
            )}
            {priceData?.map((p) => {
              if (p.price == null) return null
              const isPos = (p.changePercent ?? 0) >= 0
              return (
                <tr key={p.symbol} className="border-t border-border/20">
                  <td className="py-0.5">
                    <span className="font-medium">{ENERGY_NAMES[p.symbol] || p.symbol}</span>
                    <span className="text-muted-foreground ml-1 text-[10px]">{p.symbol}</span>
                  </td>
                  <td className="text-right tabular-nums">${p.price.toFixed(2)}</td>
                  <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{(p.changePercent ?? 0).toFixed(2)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </>
      )}

      {tab === 'mix' && (
        <div className="flex flex-col gap-3">
          <div className="h-5 rounded-full overflow-hidden flex w-full">
            {ENERGY_MIX.map((src) => (
              <div
                key={src.name}
                style={{ width: `${src.pct}%`, backgroundColor: src.color }}
                title={`${src.name}: ${src.pct}%`}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {ENERGY_MIX.map((src) => (
              <div key={src.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: src.color }} />
                <span className="text-[10px] text-muted-foreground">{src.name}</span>
                <span className="text-[10px] tabular-nums font-medium text-foreground ml-auto">{src.pct}%</span>
              </div>
            ))}
          </div>

          {commodityData && commodityData.length > 0 && (
            <div className="border-t border-border/20 pt-2 grid grid-cols-2 gap-x-4 gap-y-2">
              {commodityData.map((c) => {
                const meta = COMMODITY_META[c.symbol]
                if (!meta) return null
                const isPos = (c.changePercent ?? 0) >= 0
                return (
                  <div key={c.symbol}>
                    <div className="text-[10px] text-muted-foreground">{meta.label}</div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[12px] tabular-nums font-bold text-foreground">${c.price.toFixed(2)}</span>
                      <span className="text-[10px] text-muted-foreground">{meta.unit}</span>
                    </div>
                    <div className={`text-[10px] tabular-nums ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isPos ? '+' : ''}{(c.changePercent ?? 0).toFixed(2)}%
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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
            type="candlestick"
            data={chartData}
            height={expanded ? 300 : 140}
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
