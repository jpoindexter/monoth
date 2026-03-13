import { useCallback } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { fetchSectors } from '@/services/api'

function getBlockStyle(changePercent: number): React.CSSProperties {
  const magnitude = Math.min(Math.abs(changePercent) / 3, 1)
  if (changePercent >= 0) {
    const lightness = Math.round(35 - magnitude * 20)
    return { backgroundColor: `hsl(142, 70%, ${lightness}%)` }
  } else {
    const lightness = Math.round(35 - magnitude * 20)
    return { backgroundColor: `hsl(0, 70%, ${lightness}%)` }
  }
}

export default function SectorHeatmapPanel() {
  const fetcher = useCallback(() => fetchSectors(), [])
  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 60_000 })

  return (
    <PanelWrapper title="Sector Heatmap" loading={loading} error={error} onRetry={refresh}>
      <div className="grid grid-cols-3 gap-1 h-full auto-rows-fr">
        {data?.map((sector) => (
          <div
            key={sector.symbol}
            className="flex flex-col items-center justify-center rounded px-1 py-0.5 text-white"
            style={getBlockStyle(sector.changePercent)}
          >
            <span className="text-[9px] font-medium text-center leading-tight text-white/80">{sector.name}</span>
            <span className="text-[11px] font-bold tabular-nums">
              {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent?.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </PanelWrapper>
  )
}
