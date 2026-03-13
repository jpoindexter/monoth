import { useState, useCallback, useEffect } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { fetchCandles, type CandleData } from '@/services/api/candles'
import { useMarketStore } from '@/stores/market-store'

const VOL_SYMBOLS = ['VIXY', 'UVXY', 'SVXY', 'VXX']
const VOL_NAMES: Record<string, string> = {
  'VIXY': 'VIX Short-Term',
  'UVXY': 'VIX 1.5x',
  'SVXY': 'Short VIX',
  'VXX': 'VIX Mid-Term',
}

const VIX_RANGE = { low52: 11.5, high52: 35.2, avg: 18.5 }

const STRIKES = ['-10%', '-5%', 'ATM', '+5%', '+10%']
const MONTHS = ['1M', '2M', '3M', '6M']

function generateVolSurface(vixSpot: number) {
  return MONTHS.map((m, mi) => ({
    month: m,
    values: STRIKES.map((_, si) => {
      const base = vixSpot + mi * 0.8
      const skew = (2 - si) * 1.5
      return Math.max(base + skew, 5)
    }),
  }))
}

function ivColor(iv: number, minIv: number, maxIv: number): string {
  const t = Math.min(1, Math.max(0, (iv - minIv) / (maxIv - minIv)))
  const r = Math.round(120 + t * 135)
  const g = Math.round(40 - t * 20)
  const b = Math.round(40 - t * 20)
  return `rgb(${r},${g},${b})`
}

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function VolatilityPanel() {
  const [tab, setTab] = useState<'etfs' | 'news' | 'chart' | 'surface'>('news')
  const [chartData, setChartData] = useState<CandleData[]>([])
  const fetcher = useCallback(() => fetchQuotes(VOL_SYMBOLS), [])
  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 300_000 })
  const { data: newsData } = useNewsData('derivatives')
  const indices = useMarketStore((s) => s.indices)

  const vixEntry = indices.find((i) => i.symbol === 'VIX' || i.symbol === 'VIXY')
  const vixSpot = vixEntry?.price ?? 18.5

  useEffect(() => {
    if (tab === 'chart') {
      fetchCandles('VIXY').then(setChartData).catch(() => {})
    }
  }, [tab])

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const surface = generateVolSurface(vixSpot)
  const allIvs = surface.flatMap((r) => r.values)
  const minIv = Math.min(...allIvs)
  const maxIv = Math.max(...allIvs)

  const skew = surface[0].values[0] - surface[0].values[4]
  const skewLabel = skew > 5 ? 'Heavy put demand' : skew >= 2 ? 'Normal skew' : 'Low skew / complacency'
  const skewColor = skew > 5 ? 'text-red-500' : skew >= 2 ? 'text-muted-foreground' : 'text-amber-500'

  const pct = Math.round(((vixSpot - VIX_RANGE.low52) / (VIX_RANGE.high52 - VIX_RANGE.low52)) * 100)
  const markerLeft = Math.min(100, Math.max(0, pct))

  return (
    <PanelWrapper title="Volatility" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'etfs')} onClick={() => setTab('etfs')}>ETFs</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
        <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
        <button className={tabCls(tab === 'surface')} onClick={() => setTab('surface')}>Surface</button>
      </div>

      {tab === 'chart' && (
        <LightweightChart
          type="area"
          data={chartData}
          height={140}
          lineColor="#ef4444"
          areaTopColor="rgba(239, 68, 68, 0.2)"
          areaBottomColor="rgba(239, 68, 68, 0.02)"
        />
      )}

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
            {(!data || data.length === 0) && !loading && (
              <tr><td colSpan={3} className="py-3 text-center text-muted-foreground text-[10px]">No data available. Try News tab.</td></tr>
            )}
            {data?.map((point) => {
              const isPositive = (point.changePercent ?? 0) >= 0
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
                    {isPositive ? '+' : ''}{(point.changePercent ?? 0).toFixed(2)}%
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

      {tab === 'surface' && (
        <div className="space-y-3">
          {/* Vol surface heatmap */}
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">IV Surface</div>
            <div className="overflow-x-auto">
              <table className="text-[9px]">
                <thead>
                  <tr>
                    <td className="w-7 pr-1" />
                    {STRIKES.map((s) => (
                      <th key={s} className="text-center text-muted-foreground font-medium pb-1 w-11">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {surface.map((row) => (
                    <tr key={row.month}>
                      <td className="text-muted-foreground font-medium pr-1 text-[9px]">{row.month}</td>
                      {row.values.map((iv, ci) => (
                        <td key={ci} className="pb-0.5 pr-0.5">
                          <div
                            className="w-11 h-7 text-[9px] tabular-nums font-semibold rounded-sm flex items-center justify-center"
                            style={{ backgroundColor: ivColor(iv, minIv, maxIv), color: '#fff' }}
                          >
                            {iv.toFixed(1)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Skew indicator */}
          <div className="border-t border-border/20 pt-2">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Skew (1M)</div>
            <div className="flex items-baseline gap-2">
              <span className="text-[12px] font-semibold tabular-nums">{skew.toFixed(1)} pts</span>
              <span className={`text-[10px] font-medium ${skewColor}`}>{skewLabel}</span>
            </div>
          </div>

          {/* VIX 52-week range */}
          <div className="border-t border-border/20 pt-2">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">VIX 52-Week Range</div>
            <div className="relative">
              <div className="h-3 rounded-full bg-muted/30 relative overflow-visible">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-foreground z-10"
                  style={{ left: `calc(${markerLeft}% - 1px)` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-muted-foreground tabular-nums">{VIX_RANGE.low52}</span>
                <span className="text-[9px] font-semibold tabular-nums">{vixSpot.toFixed(1)} ({pct}th pct)</span>
                <span className="text-[9px] text-muted-foreground tabular-nums">{VIX_RANGE.high52}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </PanelWrapper>
  )
}
