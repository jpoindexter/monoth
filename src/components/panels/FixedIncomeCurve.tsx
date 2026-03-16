import { useIsExpanded } from '@/components/layout/PanelWrapper'

interface CurvePoint {
  label: string
  value: number
}

export function FixedIncomeCurve({
  curvePoints,
  spread210,
}: {
  curvePoints: CurvePoint[]
  spread210: number | null
}) {
  const expanded = useIsExpanded()

  if (curvePoints.length < 2) {
    return <p className="text-[10px] text-muted-foreground">Yield data loading...</p>
  }

  const isInverted = spread210 != null && spread210 < 0
  const curveColor = isInverted ? '#ef4444' : '#059669'
  const W = 320
  const H = expanded ? 240 : 140
  const padL = 28, padR = 8, padT = 12, padB = 16
  const minY = Math.min(...curvePoints.map((p) => p.value))
  const maxY = Math.max(...curvePoints.map((p) => p.value))
  const rangeY = maxY - minY || 1
  const n = curvePoints.length
  const xOf = (i: number) => padL + (i / (n - 1)) * (W - padL - padR)
  const yOf = (v: number) => padT + (1 - (v - minY) / rangeY) * (H - padT - padB)
  const d = curvePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(p.value).toFixed(1)}`).join(' ')

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {[minY, (minY + maxY) / 2, maxY].map((tick) => (
          <g key={tick}>
            <line x1={padL} x2={W - padR} y1={yOf(tick)} y2={yOf(tick)} stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
            <text x={padL - 3} y={yOf(tick) + 3} textAnchor="end" fontSize={7} fill="currentColor" fillOpacity={0.5}>{tick.toFixed(1)}</text>
          </g>
        ))}
        <path d={d} fill="none" stroke={curveColor} strokeWidth={2} strokeLinejoin="round" />
        {curvePoints.map((p, i) => (
          <g key={p.label}>
            <circle cx={xOf(i)} cy={yOf(p.value)} r={3} fill={curveColor} />
            <text x={xOf(i)} y={yOf(p.value) - 5} textAnchor="middle" fontSize={8} fill="currentColor" fillOpacity={0.7}>{p.value.toFixed(2)}</text>
            <text x={xOf(i)} y={H - 3} textAnchor="middle" fontSize={7} fill="currentColor" fillOpacity={0.5}>{p.label}</text>
          </g>
        ))}
      </svg>

      {spread210 != null && (
        <div className="mt-2 flex items-center gap-2 border-t border-border/20 pt-2">
          <span className="text-[11px] text-muted-foreground">2Y-10Y Spread:</span>
          <span className={`text-[11px] tabular-nums font-medium ${isInverted ? 'text-red-500' : 'text-emerald-600'}`}>
            {spread210 > 0 ? '+' : ''}{spread210.toFixed(2)}%
          </span>
          <span className={`ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
            isInverted ? 'bg-red-500/15 text-red-500' : 'bg-emerald-600/15 text-emerald-600'
          }`}>
            {isInverted ? 'Inverted' : 'Normal'}
          </span>
        </div>
      )}
    </div>
  )
}
