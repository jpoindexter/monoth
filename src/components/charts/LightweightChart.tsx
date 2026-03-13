import { useRef, useEffect } from 'react'
import { createChart, type IChartApi, type ISeriesApi, ColorType } from 'lightweight-charts'

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
}

export function LightweightChart({
  type = 'area',
  data,
  height = 120,
  lineColor = '#2563eb',
  areaTopColor = 'rgba(37, 99, 235, 0.2)',
  areaBottomColor = 'rgba(37, 99, 235, 0.02)',
  className = '',
}: LightweightChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<any> | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
        fontSize: 9,
      },
      grid: {
        vertLines: { color: 'rgba(0,0,0,0.04)' },
        horzLines: { color: 'rgba(0,0,0,0.04)' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.05 },
      },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        vertLine: { labelVisible: false },
      },
      handleScroll: false,
      handleScale: false,
    })

    chartRef.current = chart

    if (type === 'area') {
      const series = chart.addAreaSeries({
        lineColor,
        topColor: areaTopColor,
        bottomColor: areaBottomColor,
        lineWidth: 1.5,
        crosshairMarkerRadius: 3,
      })
      series.setData(data as any)
      seriesRef.current = series
    } else if (type === 'candlestick') {
      const series = chart.addCandlestickSeries({
        upColor: '#059669',
        downColor: '#ef4444',
        borderUpColor: '#059669',
        borderDownColor: '#ef4444',
        wickUpColor: '#059669',
        wickDownColor: '#ef4444',
      })
      series.setData(data as any)
      seriesRef.current = series
    } else if (type === 'line') {
      const series = chart.addLineSeries({
        color: lineColor,
        lineWidth: 1.5,
        crosshairMarkerRadius: 3,
      })
      series.setData(data as any)
      seriesRef.current = series
    } else if (type === 'histogram') {
      const series = chart.addHistogramSeries({
        color: lineColor,
      })
      series.setData(data as any)
      seriesRef.current = series
    }

    chart.timeScale().fitContent()

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        if (width > 0) chart.applyOptions({ width })
      }
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data as any)
      chartRef.current?.timeScale().fitContent()
    }
  }, [data])

  return <div ref={containerRef} className={className} />
}
