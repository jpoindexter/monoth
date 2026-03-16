import { GaugeChart } from '@/components/charts/GaugeChart'

interface Gauge {
  value: number
  label: string
}

interface Props {
  gauges: Gauge[]
  expanded: boolean
}

export function MarketRadarGaugesTab({ gauges, expanded }: Props) {
  return (
    <div className={`grid grid-cols-2 p-2 h-full place-items-center ${expanded ? 'gap-6' : 'gap-4'}`}>
      {gauges.map((g) => (
        <GaugeChart key={g.label} value={g.value} label={g.label} size={expanded ? 150 : 110} />
      ))}
    </div>
  )
}
