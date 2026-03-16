import { LightweightChart } from '@/components/charts/LightweightChart'

interface Props {
  chartData: { time: string; value: number }[]
  expanded: boolean
}

export function BtcEtfChart({ chartData, expanded }: Props) {
  return (
    <LightweightChart
      type="area"
      data={chartData}
      height={expanded ? 300 : 140}
      lineColor="#f59e0b"
      areaTopColor="rgba(245, 158, 11, 0.2)"
      areaBottomColor="rgba(245, 158, 11, 0.02)"
    />
  )
}
