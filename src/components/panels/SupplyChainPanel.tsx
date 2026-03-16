import { useState, useCallback, useEffect } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { fetchCandles, type CandleData } from '@/services/api/candles'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { tabCls } from '@/lib/panel-utils'
import { SupplyChainLogistics } from '@/components/panels/SupplyChainLogistics'
import { SupplyChainDisruptions } from '@/components/panels/SupplyChainDisruptions'
import { SupplyChainRoutes } from '@/components/panels/SupplyChainRoutes'
import { SupplyChainChart } from '@/components/panels/SupplyChainChart'
import { SupplyChainNews } from '@/components/panels/SupplyChainNews'

const SC_SYMBOLS = ['IYT', 'XTN', 'SEA', 'FDX', 'UPS', 'ZIM']
const CHART_SYMBOLS = ['IYT', 'XTN', 'SEA'] as const
type ChartSymbol = typeof CHART_SYMBOLS[number]

interface ShippingRate {
  indexId: string
  name: string
  currentValue: number
  previousValue: number
  changePct: number
  unit: string
  history: Array<{ date: string; value: number }>
  spikeAlert: boolean
}

async function fetchShippingRates(): Promise<ShippingRate[]> {
  const res = await fetch('/api/macro/shipping-rates')
  if (!res.ok) throw new Error('shipping-rates fetch failed')
  return res.json()
}

export default function SupplyChainPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'prices' | 'disruptions' | 'news' | 'routes' | 'chart'>('prices')
  const [chartSymbol, setChartSymbol] = useState<ChartSymbol>('IYT')
  const [candles, setCandles] = useState<CandleData[]>([])
  const [candlesLoading, setCandlesLoading] = useState(false)

  const { data: newsData, loading: newsLoading, error, refresh } = useNewsData('supplychain')
  const { data: priceData, loading: priceLoading } = usePolling({
    fetcher: useCallback(() => fetchQuotes(SC_SYMBOLS), []),
    interval: 300_000,
    enabled: tab === 'prices',
  })
  const { data: shippingData } = usePolling<ShippingRate[]>({
    fetcher: useCallback(() => fetchShippingRates(), []),
    interval: 3_600_000,
    enabled: tab === 'disruptions',
  })

  useEffect(() => {
    if (tab !== 'chart') return
    setCandlesLoading(true)
    fetchCandles(chartSymbol)
      .then(setCandles)
      .catch(() => setCandles([]))
      .finally(() => setCandlesLoading(false))
  }, [tab, chartSymbol])

  const headlines = newsData?.map(n => n.title) ?? []

  return (
    <PanelWrapper title="Supply Chain" loading={newsLoading && priceLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'prices')} onClick={() => setTab('prices')}>Logistics</button>
        <button className={tabCls(tab === 'disruptions')} onClick={() => setTab('disruptions')}>Disruptions</button>
        <button className={tabCls(tab === 'routes')} onClick={() => setTab('routes')}>Routes</button>
        <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'prices' && <SupplyChainLogistics priceData={priceData} expanded={expanded} />}
      {tab === 'disruptions' && <SupplyChainDisruptions headlines={headlines} shippingData={shippingData} expanded={expanded} />}
      {tab === 'routes' && <SupplyChainRoutes headlines={headlines} expanded={expanded} />}
      {tab === 'chart' && (
        <SupplyChainChart
          candles={candles}
          candlesLoading={candlesLoading}
          chartSymbol={chartSymbol}
          expanded={expanded}
          onSymbolChange={setChartSymbol}
        />
      )}
      {tab === 'news' && <SupplyChainNews newsData={newsData} expanded={expanded} />}
    </PanelWrapper>
  )
}
