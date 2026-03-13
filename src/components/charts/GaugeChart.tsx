interface GaugeChartProps {
  value: number
  label: string
  size?: number
}

function arcColor(value: number): string {
  if (value < 30) return '#ef4444'
  if (value < 50) return '#f97316'
  if (value < 70) return '#eab308'
  return '#22c55e'
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

export function GaugeChart({ value, label, size = 120 }: GaugeChartProps) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const strokeWidth = size * 0.1

  // Semicircle: 180deg to 360deg (left to right, bottom half upward)
  const startAngle = 180
  const endAngle = 360
  const fillAngle = startAngle + (value / 100) * 180

  const bgPath = describeArc(cx, cy, r, startAngle, endAngle)
  const fgPath = fillAngle > startAngle ? describeArc(cx, cy, r, startAngle, fillAngle) : null

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
        <path
          d={bgPath}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {fgPath && (
          <path
            d={fgPath}
            fill="none"
            stroke={arcColor(value)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.2}
          fontWeight="600"
          fill="currentColor"
        >
          {Math.round(value)}
        </text>
      </svg>
      <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  )
}
