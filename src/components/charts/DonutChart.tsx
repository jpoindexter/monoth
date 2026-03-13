import { useState } from 'react'

const PALETTE = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

interface Segment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: Segment[]
  size?: number
}

export function DonutChart({ segments, size = 120 }: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const stroke = size * 0.18
  const circumference = 2 * Math.PI * r

  const arcs: { offset: number; dash: number; color: string; idx: number }[] = []
  let cumulative = 0
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!
    const frac = total > 0 ? seg.value / total : 1 / segments.length
    const dash = frac * circumference
    const offset = circumference - cumulative * circumference
    arcs.push({ offset, dash, color: seg.color, idx: i })
    cumulative += frac
  }

  const formattedTotal = total >= 1000
    ? `$${(total / 1000).toFixed(1)}k`
    : `$${total.toFixed(0)}`

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size}>
        {arcs.map((arc) => (
          <circle
            key={arc.idx}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={stroke}
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={arc.offset}
            style={{
              opacity: hovered === null || hovered === arc.idx ? 1 : 0.35,
              transition: 'opacity 0.15s',
              transform: 'rotate(-90deg)',
              transformOrigin: `${cx}px ${cy}px`,
            }}
            onMouseEnter={() => setHovered(arc.idx)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        <text
          x={cx}
          y={cy - 3}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground"
          style={{ fontSize: size * 0.115, fontWeight: 600 }}
        >
          {formattedTotal}
        </text>
        <text
          x={cx}
          y={cy + size * 0.115}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground"
          style={{ fontSize: size * 0.085 }}
        >
          total
        </text>
      </svg>

      <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5">
        {segments.map((seg, i) => {
          const pct = total > 0 ? ((seg.value / total) * 100).toFixed(1) : '0.0'
          return (
            <div
              key={seg.label}
              className="flex items-center gap-1 cursor-default"
              style={{ opacity: hovered === null || hovered === i ? 1 : 0.4, transition: 'opacity 0.15s' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-[10px] text-muted-foreground">{seg.label}</span>
              <span className="text-[10px] tabular-nums">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { PALETTE }
