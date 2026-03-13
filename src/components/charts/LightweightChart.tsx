import { useId } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

interface ChartDataPoint {
  time: string // 'YYYY-MM-DD' format
  value?: number
  open?: number
  high?: number
  low?: number
  close?: number
}

interface LightweightChartProps {
  type?: 'area' | 'candlestick' | 'line' | 'histogram'
  data: ChartDataPoint[]
  height?: number
  lineColor?: string
  areaTopColor?: string
  areaBottomColor?: string
  className?: string
  showAxes?: boolean
}

function getDataKey(d: ChartDataPoint) {
  return d.value !== undefined ? 'value' : 'close'
}

function formatValue(v: number) {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

const tickStyle = { fontSize: 9, fill: '#9ca3af' }

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  return (
    <div style={{ background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: 4, fontSize: 11, color: '#f3f4f6' }}>
      {val !== undefined ? formatValue(val) : null}
    </div>
  )
}

function fmtPrice(v: number) {
  if (v >= 1000) return '$' + v.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return '$' + v.toFixed(2)
}

export function LightweightChart({
  type = 'area',
  data,
  height = 120,
  lineColor = '#2563eb',
  areaTopColor = 'rgba(37, 99, 235, 0.2)',
  areaBottomColor = 'rgba(37, 99, 235, 0.02)',
  className = '',
  showAxes = false,
}: LightweightChartProps) {
  const gradId = useId()

  if (!data || data.length === 0) return <div style={{ height }} className={className} />

  const dataKey = getDataKey(data[0])
  const tickCount = Math.min(4, data.length)

  const shared = {
    data,
    margin: showAxes
      ? { top: 4, right: 8, left: 4, bottom: 0 }
      : { top: 4, right: 4, left: 0, bottom: 0 },
  }

  const xAxis = showAxes ? (
    <XAxis
      dataKey="time"
      tick={tickStyle}
      axisLine={false}
      tickLine={false}
      interval="preserveStartEnd"
      tickCount={tickCount}
      minTickGap={40}
    />
  ) : (
    <XAxis dataKey="time" hide />
  )

  const yAxis = showAxes ? (
    <YAxis
      domain={['auto', 'auto']}
      tick={tickStyle}
      axisLine={false}
      tickLine={false}
      tickFormatter={fmtPrice}
      width={52}
    />
  ) : (
    <YAxis hide domain={['auto', 'auto']} />
  )

  const tooltip = <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(156,163,175,0.3)', strokeWidth: 1 }} />

  if (type === 'line') {
    return (
      <div style={{ height }} className={className}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart {...shared}>
            {xAxis}
            {yAxis}
            {tooltip}
            <Line type="monotone" dataKey={dataKey} stroke={lineColor} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === 'histogram') {
    return (
      <div style={{ height }} className={className}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart {...shared}>
            {xAxis}
            {yAxis}
            {tooltip}
            <Bar dataKey={dataKey} fill={lineColor} radius={[1, 1, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // area + candlestick both render as area chart
  return (
    <div style={{ height }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...shared}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={areaTopColor} stopOpacity={1} />
              <stop offset="100%" stopColor={areaBottomColor} stopOpacity={1} />
            </linearGradient>
          </defs>
          {xAxis}
          {yAxis}
          {tooltip}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={lineColor}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
