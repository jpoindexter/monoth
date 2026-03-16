import { useState, useEffect } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { useMarketStore } from '@/stores'
import { useMacroData } from '@/hooks/use-macro-data'
import { tabCls } from '@/lib/panel-utils'
import { MarketRadarGaugesTab } from '@/components/panels/MarketRadarGaugesTab'
import { MarketRadarBreadthTab } from '@/components/panels/MarketRadarBreadthTab'
import { MarketRadarSignalsTab } from '@/components/panels/MarketRadarSignalsTab'
import { MarketRadarAlertsTab } from '@/components/panels/MarketRadarAlertsTab'

interface Mover {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
}

interface MoversData {
  gainers: Mover[]
  losers: Mover[]
  active: Mover[]
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val))
}

function fearGreed(indices: { symbol: string; price: number }[]): number {
  const vix = indices.find((d) => d.symbol.toUpperCase().includes('VIX'))
  if (!vix) return 50
  return clamp(90 - (vix.price - 10) * 3, 0, 100)
}

function sectorRotation(sectors: { changePercent: number }[] | null): number {
  if (!sectors || sectors.length === 0) return 50
  const changes = sectors.map((s) => s.changePercent).filter((c) => c != null && isFinite(c))
  if (changes.length === 0) return 50
  const spread = Math.max(...changes) - Math.min(...changes)
  return clamp(20 + (spread / 5) * 60, 0, 100)
}

function rateSensitivity(fredData: { seriesId: string; value: number }[] | null): number {
  if (!fredData) return 50
  const dgs2 = fredData.find((d) => d.seriesId === 'DGS2')
  const dgs10 = fredData.find((d) => d.seriesId === 'DGS10')
  if (!dgs2 || !dgs10) return 50
  const spread = dgs2.value - dgs10.value
  if (spread > 0) return clamp(30 - spread * 15, 0, 30)
  return clamp(70 + Math.abs(spread) * 15, 70, 100)
}

function commodityPressure(
  indices: { symbol: string; changePercent: number }[],
  commodities: { symbol: string; changePercent: number }[]
): number {
  const all = [...indices, ...commodities]
  const relevant = all.filter((d) => {
    const sym = d.symbol.toUpperCase()
    return sym === 'GLD' || sym === 'SLV' || sym === 'USO' || sym === 'UNG' || sym === 'COPX'
  })
  if (relevant.length === 0) return 50
  const avg = relevant.reduce((sum, d) => sum + d.changePercent, 0) / relevant.length
  return clamp(50 + (avg / 3) * 50, 0, 100)
}

type Tab = 'gauges' | 'breadth' | 'signals' | 'alerts'

export default function MarketRadarPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('gauges')
  const [movers, setMovers] = useState<MoversData | null>(null)

  const indices = useMarketStore((s) => s.indices)
  const commodities = useMarketStore((s) => s.commodities)
  const forex = useMarketStore((s) => s.forex)
  const crypto = useMarketStore((s) => s.crypto)
  const sectors = useMarketStore((s) => s.sectorData)
  const { data: fredData } = useMacroData()

  useEffect(() => {
    if (tab === 'breadth' || tab === 'signals') {
      fetch('/api/market/movers')
        .then((r) => r.json())
        .then(setMovers)
        .catch(() => {})
    }
  }, [tab])

  const gauges = [
    { value: fearGreed(indices), label: 'Fear / Greed' },
    { value: sectorRotation(sectors), label: 'Sector Rotation' },
    { value: rateSensitivity(fredData), label: 'Rate Sensitivity' },
    { value: commodityPressure(indices, commodities), label: 'Commodity Pressure' },
  ]

  return (
    <PanelWrapper title="Market Radar">
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'gauges')} onClick={() => setTab('gauges')}>Gauges</button>
        <button className={tabCls(tab === 'breadth')} onClick={() => setTab('breadth')}>Breadth</button>
        <button className={tabCls(tab === 'signals')} onClick={() => setTab('signals')}>Signals</button>
        <button className={tabCls(tab === 'alerts')} onClick={() => setTab('alerts')}>Alerts</button>
      </div>

      {tab === 'gauges' && <MarketRadarGaugesTab gauges={gauges} expanded={expanded} />}
      {tab === 'breadth' && <MarketRadarBreadthTab movers={movers} />}
      {tab === 'signals' && <MarketRadarSignalsTab indices={indices} movers={movers} />}
      {tab === 'alerts' && <MarketRadarAlertsTab indices={indices} forex={forex} crypto={crypto} />}
    </PanelWrapper>
  )
}
