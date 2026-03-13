import { useState, useEffect } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useForexData } from '@/hooks/use-forex-data'
import { LightweightChart } from '@/components/charts/LightweightChart'

const MAJOR_CURRENCIES = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD']
const EM_CURRENCIES = ['CNY', 'INR', 'BRL', 'MXN', 'ZAR', 'TRY', 'KRW', 'THB']
const STRENGTH_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'CNY']

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵',
  CHF: '🇨🇭', AUD: '🇦🇺', CAD: '🇨🇦', CNY: '🇨🇳',
}

export default function ForexPanel() {
  const [tab, setTab] = useState<'major' | 'em' | 'all' | 'chart' | 'strength'>('major')
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

  const strengthData = (() => {
    if (!data) return []
    const sums: Record<string, { total: number; count: number }> = {}
    STRENGTH_CURRENCIES.forEach(c => { sums[c] = { total: 0, count: 0 } })

    for (const rate of data) {
      const parts = rate.pair.split('/')
      if (parts.length !== 2) continue
      const quote = parts[1]
      if (!STRENGTH_CURRENCIES.includes(quote)) continue

      // USD/XXX positive = USD stronger
      sums['USD'].total += rate.changePercent
      sums['USD'].count += 1

      // quote currency: strong when pair falls
      if (sums[quote]) {
        sums[quote].total += -rate.changePercent
        sums[quote].count += 1
      }
    }

    return STRENGTH_CURRENCIES.map(c => ({
      currency: c,
      strength: sums[c].count > 0 ? sums[c].total / sums[c].count : 0,
    })).sort((a, b) => b.strength - a.strength)
  })()

  const maxAbs = Math.max(...strengthData.map(d => Math.abs(d.strength)), 0.01)

  const top3 = strengthData.slice(0, 3).map(d => d.currency)
  const bottom3 = strengthData.slice(-3).map(d => d.currency)

  const getRateForPair = (base: string, quote: string): number | null => {
    if (base === quote) return 1
    if (!data) return null
    // both are USD/XXX pairs, cross = (1/USD_base) * USD_quote
    const baseRate = base === 'USD' ? 1 : data.find(r => r.pair === `USD/${base}`)?.rate ?? null
    const quoteRate = quote === 'USD' ? 1 : data.find(r => r.pair === `USD/${quote}`)?.rate ?? null
    if (baseRate === null || quoteRate === null) return null
    return quoteRate / baseRate
  }

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Forex" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'major')} onClick={() => setTab('major')}>Major</button>
        <button className={tabCls(tab === 'em')} onClick={() => setTab('em')}>EM</button>
        <button className={tabCls(tab === 'all')} onClick={() => setTab('all')}>All</button>
        <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
        <button className={tabCls(tab === 'strength')} onClick={() => setTab('strength')}>Strength</button>
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

      {tab === 'strength' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            {strengthData.map(({ currency, strength }) => {
              const isPos = strength >= 0
              const pct = Math.abs(strength) / maxAbs * 50
              return (
                <div key={currency} className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold w-10 shrink-0">
                    {CURRENCY_FLAGS[currency]} {currency}
                  </span>
                  <div className="flex-1 relative h-2 flex items-center">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border/30" />
                    <div
                      className={`absolute h-2 rounded-full ${isPos ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{
                        left: isPos ? '50%' : `calc(50% - ${pct}%)`,
                        width: `${pct}%`,
                      }}
                    />
                  </div>
                  <span className={`text-[10px] tabular-nums w-10 text-right shrink-0 ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{strength.toFixed(2)}%
                  </span>
                </div>
              )
            })}
          </div>

          {top3.length >= 3 && bottom3.length >= 3 && (
            <div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Cross Rates</div>
              <table className="w-full text-[10px] tabular-nums">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left font-medium pb-1 w-8"></th>
                    {bottom3.map(q => (
                      <th key={q} className="text-right font-medium pb-1">{q}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {top3.map(base => (
                    <tr key={base} className="border-t border-border/20">
                      <td className="py-0.5 font-bold">{base}</td>
                      {bottom3.map(quote => {
                        const rate = getRateForPair(base, quote)
                        return (
                          <td key={quote} className="text-right py-0.5">
                            {rate !== null ? rate < 0.01 ? rate.toFixed(4) : rate < 10 ? rate.toFixed(4) : rate.toFixed(2) : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
