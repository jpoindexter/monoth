import { useState, useEffect } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useForexData } from '@/hooks/use-forex-data'
import { LightweightChart } from '@/components/charts/LightweightChart'

const MAJOR_CURRENCIES = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD']
const EM_CURRENCIES = ['CNY', 'INR', 'BRL', 'MXN', 'ZAR', 'TRY', 'KRW', 'THB']

export default function ForexPanel() {
  const [tab, setTab] = useState<'major' | 'em' | 'all' | 'chart'>('major')
  const [chartData, setChartData] = useState<{ time: string; value: number }[]>([])
  const [chartPair, setChartPair] = useState('EUR')
  const { data, loading, error, refresh } = useForexData()

  const filtered = tab === 'major'
    ? data?.filter((rate) => MAJOR_CURRENCIES.some((c) => rate.pair.includes(c)))
    : tab === 'em'
    ? data?.filter((rate) => EM_CURRENCIES.some((c) => rate.pair.includes(c)))
    : tab === 'all'
    ? data
    : null

  useEffect(() => {
    if (tab === 'chart') {
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
  }, [tab, chartPair])

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Forex" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'major')} onClick={() => setTab('major')}>Major</button>
        <button className={tabCls(tab === 'em')} onClick={() => setTab('em')}>EM</button>
        <button className={tabCls(tab === 'all')} onClick={() => setTab('all')}>All</button>
        <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
      </div>

      {tab === 'chart' && (
        <div>
          <div className="flex gap-1 mb-1">
            {['EUR', 'GBP', 'JPY', 'CHF'].map((c) => (
              <button
                key={c}
                className={`text-[8px] px-1 rounded-sm ${chartPair === c ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
                onClick={() => setChartPair(c)}
              >
                USD/{c}
              </button>
            ))}
          </div>
          <LightweightChart
            type="area"
            data={chartData}
            height={140}
            lineColor="#6366f1"
            areaTopColor="rgba(99, 102, 241, 0.2)"
            areaBottomColor="rgba(99, 102, 241, 0.02)"
          />
        </div>
      )}

      {filtered && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Pair</th>
              <th className="text-right font-medium pb-1.5">Rate</th>
              <th className="text-right font-medium pb-1.5">Chg%</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((rate) => {
              const isPositive = rate.changePercent >= 0
              return (
                <tr key={rate.pair} className="border-t border-border/20">
                  <td className="py-1 font-medium">{rate.pair}</td>
                  <td className="text-right tabular-nums">{rate.rate.toFixed(4)}</td>
                  <td className={`text-right tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{rate.changePercent.toFixed(2)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </PanelWrapper>
  )
}

function getDateRange(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}
