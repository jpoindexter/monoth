import { useState, useEffect } from 'react'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { fetchCandles, type CandleData } from '@/services/api/candles'

function getDateRange(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function ForexChartTab({ expanded }: { expanded: boolean }) {
  const [chartData, setChartData] = useState<{ time: string; value: number }[]>([])
  const [chartPair, setChartPair] = useState('EUR')
  const [dxyData, setDxyData] = useState<CandleData[]>([])
  const [dxyLoading, setDxyLoading] = useState(false)

  useEffect(() => {
    if (chartPair !== 'DXY') {
      fetch(`https://api.frankfurter.dev/${getDateRange(90)}..?to=${chartPair}`)
        .then(r => r.json())
        .then(json => {
          const rates = json.rates ?? {}
          const points = Object.entries(rates).map(([date, val]: [string, any]) => ({
            time: date,
            value: val[chartPair] ?? 0,
          })).filter(p => p.value > 0)
          setChartData(points)
        })
        .catch(() => {})
    }
  }, [chartPair])

  useEffect(() => {
    if (chartPair !== 'DXY') return
    if (dxyData.length > 0) return
    setDxyLoading(true)
    fetchCandles('UUP')
      .then(setDxyData)
      .catch(() => {})
      .finally(() => setDxyLoading(false))
  }, [chartPair, dxyData.length])

  return (
    <div>
      <div className="flex gap-1 mb-1">
        <button
          className={`text-[9px] px-1 rounded-sm ${chartPair === 'DXY' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
          onClick={() => setChartPair('DXY')}
        >
          DXY
        </button>
        {['EUR', 'GBP', 'JPY', 'CHF'].map((c) => (
          <button
            key={c}
            className={`text-[9px] px-1 rounded-sm ${chartPair === c ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
            onClick={() => setChartPair(c)}
          >
            USD/{c}
          </button>
        ))}
      </div>
      {chartPair === 'DXY' ? (
        dxyLoading ? (
          <div className="h-[140px] flex items-center justify-center text-[10px] text-muted-foreground">Loading DXY...</div>
        ) : (
          <LightweightChart
            type="area"
            data={dxyData.map(d => ({ time: d.time, value: d.close }))}
            height={expanded ? 300 : 140}
            lineColor="#f59e0b"
            areaTopColor="rgba(245, 158, 11, 0.2)"
            areaBottomColor="rgba(245, 158, 11, 0.02)"
          />
        )
      ) : (
        <LightweightChart
          type="area"
          data={chartData}
          height={expanded ? 300 : 140}
          lineColor="#6366f1"
          areaTopColor="rgba(99, 102, 241, 0.2)"
          areaBottomColor="rgba(99, 102, 241, 0.02)"
        />
      )}
    </div>
  )
}
