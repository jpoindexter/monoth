import { useCallback, useState, useEffect } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { fetchCandles } from '@/services/api/candles'
import { relTime, tabCls } from '@/lib/panel-utils'
import { CommoditiesChartTab, type ChartSymbol } from './CommoditiesChartTab'
import { CommoditiesSectorsTab } from './CommoditiesSectorsTab'
import { CommoditiesSupercycleTab } from './CommoditiesSupercycleTab'

const COMMODITY_SYMBOLS = ['GLD', 'SLV', 'USO', 'COPX', 'UNG', 'WEAT', 'DBA', 'PALL', 'PPLT']
const COMMODITY_NAMES: Record<string, string> = {
  'GLD': 'Gold', 'SLV': 'Silver', 'USO': 'Crude Oil', 'COPX': 'Copper',
  'UNG': 'Nat Gas', 'WEAT': 'Wheat', 'DBA': 'Agriculture', 'PALL': 'Palladium', 'PPLT': 'Platinum',
}

export default function CommoditiesPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'prices' | 'news' | 'chart' | 'sectors' | 'supercycle'>('prices')
  const [chartData, setChartData] = useState<any[]>([])
  const [chartSymbol, setChartSymbol] = useState<ChartSymbol>('GLD')

  const fetcher = useCallback(async () => fetchQuotes(COMMODITY_SYMBOLS), [])

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
        <CommoditiesChartTab
          chartData={chartData}
          chartSymbol={chartSymbol}
          setChartSymbol={setChartSymbol}
          expanded={expanded}
          showLabel={expanded}
        />
      )}

      {tab === 'supercycle' && <CommoditiesSupercycleTab />}

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

      {tab === 'sectors' && data && <CommoditiesSectorsTab data={data} />}

      {tab === 'news' && (
        <div className="flex flex-col">
          {newsData?.map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-muted/30 -mx-1 px-1 rounded-sm transition-colors">
              <span className={`text-[11px] font-medium leading-snug text-foreground flex-1 ${expanded ? '' : 'line-clamp-2'}`}>{item.title}</span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">{relTime(item.published)}</span>
            </a>
          ))}
        </div>
      )}
    </PanelWrapper>
  )
}
