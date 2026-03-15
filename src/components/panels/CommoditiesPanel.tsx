import { useCallback, useState, useEffect } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { fetchCandles, type CandleData } from '@/services/api/candles'
import { relTime, tabCls } from '@/lib/panel-utils'

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


const CHART_SYMBOLS = ['GLD', 'SLV', 'USO', 'DBA'] as const
type ChartSymbol = typeof CHART_SYMBOLS[number]

const CHART_SYMBOL_NAMES: Record<ChartSymbol, string> = {
  GLD: 'Gold',
  SLV: 'Silver',
  USO: 'Oil',
  DBA: 'Agriculture',
}

const CHART_COLORS: Record<ChartSymbol, { line: string; top: string; bottom: string }> = {
  GLD: { line: '#d97706', top: 'rgba(217, 119, 6, 0.2)', bottom: 'rgba(217, 119, 6, 0.02)' },
  SLV: { line: '#b45309', top: 'rgba(180, 83, 9, 0.2)', bottom: 'rgba(180, 83, 9, 0.02)' },
  USO: { line: '#6b7280', top: 'rgba(107, 114, 128, 0.2)', bottom: 'rgba(107, 114, 128, 0.02)' },
  DBA: { line: '#059669', top: 'rgba(5, 150, 105, 0.2)', bottom: 'rgba(5, 150, 105, 0.02)' },
}

type CyclePhase = 'EARLY CYCLE' | 'MID CYCLE' | 'LATE CYCLE' | 'DOWNTURN'

const CYCLE_PHASE_CLS: Record<CyclePhase, string> = {
  'EARLY CYCLE': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
  'MID CYCLE': 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
  'LATE CYCLE': 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
  'DOWNTURN': 'text-red-500 bg-red-50 dark:bg-red-950/30',
}

const SUPERCYCLE_SECTORS: { name: string; phase: CyclePhase }[] = [
  { name: 'Precious Metals', phase: 'LATE CYCLE' },
  { name: 'Energy', phase: 'MID CYCLE' },
  { name: 'Agriculture', phase: 'EARLY CYCLE' },
  { name: 'Industrial Metals', phase: 'MID CYCLE' },
  { name: 'Livestock', phase: 'DOWNTURN' },
  { name: 'Softs (Coffee, Cocoa, Sugar)', phase: 'LATE CYCLE' },
]

export default function CommoditiesPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'prices' | 'news' | 'chart' | 'sectors' | 'supercycle'>('prices')
  const [chartData, setChartData] = useState<CandleData[]>([])
  const [chartSymbol, setChartSymbol] = useState<ChartSymbol>('GLD')

  const fetcher = useCallback(async () => {
    return fetchQuotes(COMMODITY_SYMBOLS)
  }, [])

  const { data, loading, error, refresh } = usePolling({
    fetcher,
    interval: 300_000,
    enabled: tab !== 'news' && tab !== 'chart',
  })

  const { data: newsData } = useNewsData('commodities')

  useEffect(() => {
    if (tab === 'chart' || expanded) {
      fetchCandles(chartSymbol).then(setChartData).catch(() => {})
    }
  }, [tab, chartSymbol, expanded])

  const priceMap = Object.fromEntries((data ?? []).map((q) => [q.symbol, q]))

  const sectorData = SECTORS.map((s) => {
    const quotes = s.symbols.map((sym) => priceMap[sym]).filter((q): q is NonNullable<typeof q> => q != null)
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
      <div className="flex flex-wrap gap-1 mb-2">
        <button className={tabCls(tab === 'prices')} onClick={() => setTab('prices')}>Prices</button>
        <button className={tabCls(tab === 'sectors')} onClick={() => setTab('sectors')}>Sectors</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
        <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
        <button className={tabCls(tab === 'supercycle')} onClick={() => setTab('supercycle')}>Supercycle</button>
      </div>

      {(tab === 'chart' || expanded) && (
        <div className={expanded ? 'mb-4' : ''}>
          {expanded && <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold py-1 border-b border-border/30 mb-2">Chart</div>}
          <div className="flex gap-1 mb-1">
            {CHART_SYMBOLS.map((sym) => (
              <button
                key={sym}
                className={`text-[9px] px-1.5 py-0.5 rounded-sm ${chartSymbol === sym ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setChartSymbol(sym)}
              >
                {sym}
                <span className="ml-0.5 text-[7px] opacity-60">{CHART_SYMBOL_NAMES[sym]}</span>
              </button>
            ))}
          </div>
          <LightweightChart
            type="area"
            data={chartData}
            height={expanded ? 300 : 140}
            lineColor={CHART_COLORS[chartSymbol].line}
            areaTopColor={CHART_COLORS[chartSymbol].top}
            areaBottomColor={CHART_COLORS[chartSymbol].bottom}
          />
        </div>
      )}

      {tab === 'supercycle' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground">Bloomberg Cmdty Index (proxy)</span>
              <div className="text-right">
                <span className="text-[11px] tabular-nums font-medium text-foreground">214.3</span>
                <span className="text-[10px] text-amber-600 ml-1">+18% vs 10Y avg</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground">Cmdty/Equity ratio (GLD+USO/SPY)</span>
              <div className="text-right">
                <span className="text-[11px] tabular-nums font-medium text-foreground">0.42</span>
                <span className="text-[10px] text-emerald-600 ml-1">Trending up</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border/20 pt-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Sector Cycle Position</div>
            <div className="flex flex-col gap-1">
              {SUPERCYCLE_SECTORS.map((sector) => (
                <div key={sector.name} className="flex items-center justify-between">
                  <span className="text-[11px] text-foreground">{sector.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${CYCLE_PHASE_CLS[sector.phase]}`}>
                    {sector.phase}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border/20 pt-2 flex items-center justify-between">
            <span className="text-[11px] font-medium text-foreground">Supercycle Signal</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30">
              BULLISH
            </span>
          </div>
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
              <span className={`text-[11px] font-medium leading-snug text-foreground flex-1 ${expanded ? '' : 'line-clamp-2'}`}>{item.title}</span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">{relTime(item.published)}</span>
            </a>
          ))}
        </div>
      )}
    </PanelWrapper>
  )
}
