import { useCallback } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { GaugeChart } from '@/components/charts/GaugeChart'
import { useMarketStore } from '@/stores'
import { usePolling } from '@/hooks/use-polling'
import { useMacroData } from '@/hooks/use-macro-data'
import { fetchSectors } from '@/services/api'

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val))
}

function fearGreed(indices: { symbol: string; price: number }[]): number {
  const vix = indices.find((d) => d.symbol.toUpperCase().includes('VIX'))
  if (!vix) return 50
  // VIX 10 = 90 (greed), VIX 30 = 30 (fear), VIX 50 = 0 (extreme fear)
  // Linear interpolation: score = 90 - (vix - 10) * 3
  const score = 90 - (vix.price - 10) * 3
  return clamp(score, 0, 100)
}

function sectorRotation(sectors: { changePercent: number }[] | null): number {
  if (!sectors || sectors.length === 0) return 50
  const changes = sectors.map((s) => s.changePercent)
  const spread = Math.max(...changes) - Math.min(...changes)
  // 0% spread = 50, >=3% spread = 100
  return clamp(50 + (spread / 3) * 50, 50, 100)
}

function rateSensitivity(fredData: { seriesId: string; value: number }[] | null): number {
  if (!fredData) return 50
  const dgs2 = fredData.find((d) => d.seriesId === 'DGS2')
  const dgs10 = fredData.find((d) => d.seriesId === 'DGS10')
  if (!dgs2 || !dgs10) return 50
  const spread = dgs2.value - dgs10.value // 2Y - 10Y
  if (spread > 0) {
    // Inverted: 0 to -2 range mapped to 30 down to 0
    return clamp(30 - spread * 15, 0, 30)
  }
  // Normal: spread <= 0 means 2Y < 10Y, map to 70-100
  return clamp(70 + Math.abs(spread) * 15, 70, 100)
}

function commodityPressure(
  indices: { symbol: string; changePercent: number }[],
  commodities: { symbol: string; changePercent: number }[]
): number {
  const all = [...indices, ...commodities]
  const relevant = all.filter((d) => {
    const sym = d.symbol.toUpperCase()
    return sym.includes('GC') || sym.includes('GOLD') || sym.includes('CL') || sym.includes('OIL') || sym.includes('WTI')
  })
  if (relevant.length === 0) return 50
  const avg = relevant.reduce((sum, d) => sum + d.changePercent, 0) / relevant.length
  // -3% = 0, 0% = 50, +3% = 100
  return clamp(50 + (avg / 3) * 50, 0, 100)
}

export default function MarketRadarPanel() {
  const indices = useMarketStore((s) => s.indices)
  const commodities = useMarketStore((s) => s.commodities)

  const sectorFetcher = useCallback(() => fetchSectors(), [])
  const { data: sectors } = usePolling({ fetcher: sectorFetcher, interval: 60_000 })
  const { data: fredData } = useMacroData()

  const gauges = [
    { value: fearGreed(indices), label: 'Fear / Greed' },
    { value: sectorRotation(sectors), label: 'Sector Rotation' },
    { value: rateSensitivity(fredData), label: 'Rate Sensitivity' },
    { value: commodityPressure(indices, commodities), label: 'Commodity Pressure' },
  ]

  return (
    <PanelWrapper title="Market Radar">
      <div className="grid grid-cols-2 gap-4 p-2 h-full place-items-center">
        {gauges.map((g) => (
          <GaugeChart key={g.label} value={g.value} label={g.label} size={110} />
        ))}
      </div>
    </PanelWrapper>
  )
}
