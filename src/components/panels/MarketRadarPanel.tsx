import { useState, useCallback, useEffect } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { GaugeChart } from '@/components/charts/GaugeChart'
import { useMarketStore } from '@/stores'
import { usePolling } from '@/hooks/use-polling'
import { useMacroData } from '@/hooks/use-macro-data'
import { fetchSectors } from '@/services/api'

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
  const score = 90 - (vix.price - 10) * 3
  return clamp(score, 0, 100)
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

function BreadthBar({ advances, declines }: { advances: number; declines: number }) {
  const total = advances + declines
  if (total === 0) return null
  const advPct = (advances / total) * 100
  const decPct = (declines / total) * 100
  const ratio = declines > 0 ? (advances / declines).toFixed(2) : advances > 0 ? '∞' : '0'

  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Advance / Decline</span>
          <span className="text-[10px] text-muted-foreground">A/D {ratio}</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden gap-px">
          <div
            className="bg-emerald-500 rounded-l-full transition-all duration-500"
            style={{ width: `${advPct}%` }}
          />
          <div
            className="bg-red-500 rounded-r-full transition-all duration-500"
            style={{ width: `${decPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-emerald-500">{advances} advancing</span>
          <span className="text-[10px] text-red-500">{declines} declining</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Breadth Meter</span>
        </div>
        <div className="relative h-3 bg-muted/40 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-red-500/70 rounded-l-full"
            style={{ width: `${decPct}%` }}
          />
          <div
            className="absolute right-0 top-0 h-full bg-emerald-500/70 rounded-r-full"
            style={{ width: `${advPct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-semibold text-foreground/80 leading-none">
              {advPct.toFixed(0)}% adv
            </span>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-center text-muted-foreground pt-1">
        {advances > declines ? (
          <span className="text-emerald-500 font-medium">Breadth bullish</span>
        ) : declines > advances ? (
          <span className="text-red-500 font-medium">Breadth bearish</span>
        ) : (
          <span>Breadth neutral</span>
        )}
        <span className="text-muted-foreground"> — A/D ratio {ratio}</span>
      </div>
    </div>
  )
}

function NewHighsLows({ gainers, losers }: { gainers: Mover[]; losers: Mover[] }) {
  const newHighs = gainers.filter((m) => m.changePercent > 5).length
  const newLows = losers.filter((m) => m.changePercent < -5).length
  const total = newHighs + newLows
  const highPct = total > 0 ? (newHighs / total) * 100 : 50

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">New Highs vs Lows</span>
        <span className="text-[10px] text-muted-foreground">&gt;5% move</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        <div
          className="bg-emerald-500 rounded-l-full transition-all duration-500"
          style={{ width: `${highPct}%` }}
        />
        <div
          className="bg-red-500 rounded-r-full transition-all duration-500"
          style={{ width: `${100 - highPct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-emerald-500">{newHighs} new highs</span>
        <span className="text-[10px] text-red-500">{newLows} new lows</span>
      </div>
    </div>
  )
}

export default function MarketRadarPanel() {
  const [tab, setTab] = useState<'gauges' | 'breadth'>('gauges')
  const [movers, setMovers] = useState<MoversData | null>(null)

  const indices = useMarketStore((s) => s.indices)
  const commodities = useMarketStore((s) => s.commodities)

  const sectorFetcher = useCallback(() => fetchSectors(), [])
  const { data: sectors } = usePolling({ fetcher: sectorFetcher, interval: 60_000 })
  const { data: fredData } = useMacroData()

  useEffect(() => {
    if (tab === 'breadth') {
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

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Market Radar">
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'gauges')} onClick={() => setTab('gauges')}>Gauges</button>
        <button className={tabCls(tab === 'breadth')} onClick={() => setTab('breadth')}>Breadth</button>
      </div>

      {tab === 'gauges' && (
        <div className="grid grid-cols-2 gap-4 p-2 h-full place-items-center">
          {gauges.map((g) => (
            <GaugeChart key={g.label} value={g.value} label={g.label} size={110} />
          ))}
        </div>
      )}

      {tab === 'breadth' && (
        <div className="px-1 space-y-4">
          {movers ? (
            <>
              <BreadthBar advances={movers.gainers.length} declines={movers.losers.length} />
              <NewHighsLows gainers={movers.gainers} losers={movers.losers} />
            </>
          ) : (
            <div className="text-[10px] text-muted-foreground text-center pt-6">Loading breadth data...</div>
          )}
        </div>
      )}
    </PanelWrapper>
  )
}
