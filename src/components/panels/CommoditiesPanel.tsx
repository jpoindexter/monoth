import { useCallback, useState, useEffect } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { fetchCandles, type CandleData } from '@/services/api/candles'

const COMMODITY_SYMBOLS = ['GLD', 'SLV', 'USO', 'COPX', 'UNG', 'WEAT', 'DBA', 'PALL', 'PPLT']
const COMMODITY_NAMES: Record<string, string> = {
  'GLD': 'Gold',
  'SLV': 'Silver',
  'USO': 'Crude Oil',
  'COPX': 'Copper',
  'UNG': 'Nat Gas',
  'WEAT': 'Wheat',
  'DBA': 'Agriculture',
  'PALL': 'Palladium',
  'PPLT': 'Platinum',
}

const SECTORS = [
  { name: 'Precious Metals', symbols: ['GLD', 'SLV'], color: '#f59e0b' },
  { name: 'Energy', symbols: ['USO', 'UNG'], color: '#ef4444' },
  { name: 'Industrial', symbols: ['COPX'], color: '#6366f1' },
  { name: 'Agriculture', symbols: ['WEAT', 'DBA'], color: '#10b981' },
]

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

const tabCls = (active: boolean) =>
  `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

export default function CommoditiesPanel() {
  const [tab, setTab] = useState<'prices' | 'news' | 'chart' | 'sectors'>('prices')
  const [chartData, setChartData] = useState<CandleData[]>([])
  const [chartSymbol, setChartSymbol] = useState('GLD')

  const fetcher = useCallback(async () => {
    return fetchQuotes(COMMODITY_SYMBOLS)
  }, [])

  const { data, loading, error, refresh } = usePolling({
    fetcher,
    interval: 300_000,
  })

  const { data: newsData } = useNewsData('commodities')

  useEffect(() => {
    if (tab === 'chart') {
      fetchCandles(chartSymbol).then(setChartData).catch(() => {})
    }
  }, [tab, chartSymbol])

  const priceMap = Object.fromEntries((data ?? []).map((q) => [q.symbol, q]))

  const sectorData = SECTORS.map((s) => {
    const quotes = s.symbols.map((sym) => priceMap[sym]).filter(Boolean)
    const avg = quotes.length > 0
      ? quotes.reduce((sum, q) => sum + q.changePercent, 0) / quotes.length
      : 0
    return { ...s, avg }
  }).sort((a, b) => b.avg - a.avg)

  const maxAbs = Math.max(...sectorData.map((s) => Math.abs(s.avg)), 0.01)

  const preciousAvg = sectorData.find((s) => s.name === 'Precious Metals')?.avg ?? 0
  const energyAvg = sectorData.find((s) => s.name === 'Energy')?.avg ?? 0
  const spread = preciousAvg - energyAvg

  const spreadLabel = Math.abs(spread) < 0.15 ? 'BALANCED' : spread > 0 ? 'SAFE HAVEN BID' : 'GROWTH BID'
  const spreadLabelCls = Math.abs(spread) < 0.15
    ? 'text-muted-foreground bg-muted'
    : spread > 0
    ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
    : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'

  const gldPrice = priceMap['GLD']?.price
  const slvPrice = priceMap['SLV']?.price
  const usoPrice = priceMap['USO']?.price
  const ungPrice = priceMap['UNG']?.price

  const goldSilverRatio = gldPrice && slvPrice ? gldPrice / slvPrice : null
  const oilGasRatio = usoPrice && ungPrice ? usoPrice / ungPrice : null

  return (
    <PanelWrapper title="Commodities" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'prices')} onClick={() => setTab('prices')}>Prices</button>
        <button className={tabCls(tab === 'sectors')} onClick={() => setTab('sectors')}>Sectors</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
        <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
      </div>

      {tab === 'chart' && (
        <div>
          <div className="flex gap-1 mb-1">
            {['GLD', 'USO', 'SLV', 'UNG'].map((sym) => (
              <button
                key={sym}
                className={`text-[8px] px-1 rounded-sm ${chartSymbol === sym ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
                onClick={() => setChartSymbol(sym)}
              >
                {sym}
              </button>
            ))}
          </div>
          <LightweightChart type="area" data={chartData} height={140} lineColor="#059669" areaTopColor="rgba(5, 150, 105, 0.2)" areaBottomColor="rgba(5, 150, 105, 0.02)" />
        </div>
      )}

      {tab === 'prices' && (
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
                    <span className="font-medium text-foreground">{COMMODITY_NAMES[point.symbol] || point.symbol}</span>
                    <span className="text-muted-foreground ml-1.5">{point.symbol}</span>
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

      {tab === 'sectors' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {sectorData.map((sector) => {
              const isPositive = sector.avg >= 0
              const barWidth = Math.min(Math.abs(sector.avg) / maxAbs * 100, 100)
              return (
                <div key={sector.name}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[11px] font-medium text-foreground">{sector.name}</span>
                    <span className={`text-[11px] tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{sector.avg.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted/40 rounded-sm h-3">
                    <div
                      className="h-3 rounded-sm"
                      style={{ width: `${barWidth}%`, backgroundColor: sector.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-border/20 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-muted-foreground">Gold/Oil Spread: </span>
                <span className={`text-[11px] tabular-nums font-medium ${spread >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {spread >= 0 ? '+' : ''}{spread.toFixed(2)}%
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${spreadLabelCls}`}>
                {spreadLabel}
              </span>
            </div>
          </div>

          <div className="border-t border-border/20 pt-2 flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground">Gold/Silver ratio</span>
              {goldSilverRatio != null ? (
                <div className="text-right">
                  <span className="text-[11px] tabular-nums font-medium text-foreground">{goldSilverRatio.toFixed(1)}x</span>
                  <span className="text-[11px] text-muted-foreground ml-1.5">
                    {goldSilverRatio > 80 ? '(Silver cheap)' : goldSilverRatio < 60 ? '(Silver pricey)' : '(Normal range)'}
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-muted-foreground">—</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground">Oil/Gas ratio</span>
              {oilGasRatio != null ? (
                <div className="text-right">
                  <span className="text-[11px] tabular-nums font-medium text-foreground">{oilGasRatio.toFixed(1)}x</span>
                  <span className="text-[11px] text-muted-foreground ml-1.5">
                    {oilGasRatio > 25 ? '(Gas cheap)' : oilGasRatio < 10 ? '(Gas pricey)' : '(Normal range)'}
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'news' && (
        <div className="flex flex-col">
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
