import { useState, useCallback, useEffect } from 'react'
import { useMarketStore } from '@/stores/market-store'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { tabCls } from '@/lib/panel-utils'
import { CryptoTop15 } from '@/components/panels/CryptoTop15'
import { CryptoStables } from '@/components/panels/CryptoStables'
import { CryptoDefi } from '@/components/panels/CryptoDefi'
import { CryptoDominance } from '@/components/panels/CryptoDominance'

interface Stablecoin {
  id: string; symbol: string; name: string
  price: number; pegDeviation: number; marketCap: number; volume24h: number
}

export default function CryptoPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'top15' | 'stables' | 'chart' | 'defi' | 'dominance'>('top15')
  const [chartData, setChartData] = useState<{ time: string; value: number }[]>([])
  const data = useMarketStore((s) => s.crypto)
  const loading = data.length === 0
  const refresh = () => {}

  const { data: defiData, loading: defiLoading } = usePolling<{
    protocols: { name: string; tvl: number; change24h: number | null; category: string }[]
    chains: { name: string; tvl: number; pct: number }[]
  }>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/crypto/defi')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 300_000,
    enabled: tab === 'defi',
  })

  const { data: fearGreedData } = usePolling<{
    fearGreed: { value: number; classification: string; history: { value: number; classification: string; date: string }[] }
    dominance: { btc: number; eth: number; stable: number; other: number }
  }>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/crypto/fear-greed')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 300_000,
    enabled: tab === 'dominance',
  })

  const { data: stableData, loading: stableLoading } = usePolling<Stablecoin[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/crypto/stablecoins')
      if (!res.ok) throw new Error('Failed to fetch stablecoins')
      return res.json()
    }, []),
    interval: 300_000,
    enabled: tab === 'stables',
  })

  useEffect(() => {
    if (tab === 'chart') {
      fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=90')
        .then((r) => r.json())
        .then((json) => {
          const points = json.prices?.map(([ts, price]: [number, number]) => ({
            time: new Date(ts).toISOString().slice(0, 10),
            value: price,
          })) ?? []
          const seen = new Map<string, { time: string; value: number }>()
          for (const p of points) seen.set(p.time, p)
          setChartData(Array.from(seen.values()))
        })
        .catch(() => {})
    }
  }, [tab])

  return (
    <PanelWrapper title="Crypto" loading={loading} error={null} onRetry={refresh}>
      <div className="flex flex-wrap gap-1 mb-2">
        <button className={tabCls(tab === 'top15')}     onClick={() => setTab('top15')}>Top 15</button>
        <button className={tabCls(tab === 'stables')}   onClick={() => setTab('stables')}>Stables</button>
        <button className={tabCls(tab === 'chart')}     onClick={() => setTab('chart')}>Chart</button>
        <button className={tabCls(tab === 'defi')}      onClick={() => setTab('defi')}>DeFi</button>
        <button className={tabCls(tab === 'dominance')} onClick={() => setTab('dominance')}>Dominance</button>
      </div>

      {tab === 'chart' && (
        <LightweightChart
          type="area"
          data={chartData}
          height={expanded ? 300 : 160}
          lineColor="#f59e0b"
          areaTopColor="rgba(245, 158, 11, 0.2)"
          areaBottomColor="rgba(245, 158, 11, 0.02)"
        />
      )}

      {tab === 'top15' && <CryptoTop15 data={data} />}

      {tab === 'stables' && <CryptoStables data={stableData ?? null} loading={stableLoading} />}

      {tab === 'defi' && <CryptoDefi data={defiData ?? null} loading={defiLoading} />}

      {tab === 'dominance' && <CryptoDominance data={fearGreedData ?? null} />}
    </PanelWrapper>
  )
}
