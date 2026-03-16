import { useState, useCallback, useEffect } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { useCryptoData } from '@/hooks/use-crypto-data'
import { useMarketStore } from '@/stores'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { tabCls } from '@/lib/panel-utils'
import { BtcEtfChart } from '@/components/panels/BtcEtfChart'
import { BtcEtfEtfs } from '@/components/panels/BtcEtfEtfs'
import { BtcEtfFlows } from '@/components/panels/BtcEtfFlows'
import { BtcEtfNews } from '@/components/panels/BtcEtfNews'
import { BtcEtfCompare } from '@/components/panels/BtcEtfCompare'

const ETF_SYMBOLS = ['IBIT', 'FBTC', 'GBTC', 'ARKB', 'BITB']

type FlowsData = {
  timestamp: string
  summary: {
    etfCount: number
    totalVolume: number
    totalEstFlow: number
    netDirection: 'NET INFLOW' | 'NET OUTFLOW' | 'NEUTRAL' | 'UNAVAILABLE'
    inflowCount: number
    outflowCount: number
  }
  etfs: Array<{
    ticker: string
    issuer: string
    price: number
    priceChange: number
    volume: number
    avgVolume: number
    volumeRatio: number
    direction: 'inflow' | 'outflow' | 'neutral'
    estFlow: number
  }>
  rateLimited: boolean
}

export default function BtcEtfPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'etfs' | 'flows' | 'news' | 'chart' | 'compare'>('news')
  const [chartData, setChartData] = useState<{ time: string; value: number }[]>([])
  const { data: newsData, loading: newsLoading, error: newsError, refresh } = useNewsData('btcetf')
  useCryptoData()
  const crypto = useMarketStore((s) => s.crypto)
  const btc = crypto.find((c) => c.id === 'bitcoin')

  const { data: etfData, loading: etfLoading } = usePolling({
    fetcher: useCallback(() => fetchQuotes(ETF_SYMBOLS), []),
    interval: 60_000,
    enabled: tab === 'etfs',
  })

  const { data: flowsData, loading: flowsLoading } = usePolling<FlowsData>({
    fetcher: useCallback(() => fetch('/api/market/etf-flows').then(r => r.json()), []),
    interval: 600_000,
    enabled: tab === 'flows',
  })

  useEffect(() => {
    if (tab !== 'chart') return
    fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30')
      .then(r => r.json())
      .then(json => {
        const points = json.prices?.map(([ts, price]: [number, number]) => ({
          time: new Date(ts).toISOString().slice(0, 10),
          value: price,
        })) ?? []
        const seen = new Map<string, { time: string; value: number }>()
        for (const p of points) seen.set(p.time, p)
        setChartData(Array.from(seen.values()))
      })
      .catch(() => {})
  }, [tab])

  return (
    <PanelWrapper title="BTC ETF" loading={newsLoading && etfLoading} error={newsError} onRetry={refresh}>
      {btc && (
        <div className="border-b border-border/20 pb-1.5 mb-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-muted-foreground">BTC</span>
            <span className={`${expanded ? 'text-xl' : 'text-sm'} font-bold tabular-nums`}>
              ${btc.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
            <span className={`text-[10px] font-medium tabular-nums ${btc.changePercent24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {btc.changePercent24h >= 0 ? '+' : ''}{btc.changePercent24h.toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'etfs')} onClick={() => setTab('etfs')}>ETFs</button>
        <button className={tabCls(tab === 'flows')} onClick={() => setTab('flows')}>Flows</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
        <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
        <button className={tabCls(tab === 'compare')} onClick={() => setTab('compare')}>Compare</button>
      </div>

      {tab === 'chart' && <BtcEtfChart chartData={chartData} expanded={expanded} />}
      {tab === 'etfs' && <BtcEtfEtfs etfData={etfData} etfLoading={etfLoading} expanded={expanded} />}
      {tab === 'flows' && <BtcEtfFlows flowsData={flowsData} flowsLoading={flowsLoading} expanded={expanded} />}
      {tab === 'news' && <BtcEtfNews newsData={newsData} expanded={expanded} />}
      {tab === 'compare' && <BtcEtfCompare />}
    </PanelWrapper>
  )
}
