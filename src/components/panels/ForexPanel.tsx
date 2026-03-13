import { useState, useEffect } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { useForexData } from '@/hooks/use-forex-data'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { fetchCandles, type CandleData } from '@/services/api/candles'

const MAJOR_CURRENCIES = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD']
const EM_CURRENCIES = ['CNY', 'INR', 'BRL', 'MXN', 'ZAR', 'TRY', 'KRW', 'THB']
const STRENGTH_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'CNY']

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵',
  CHF: '🇨🇭', AUD: '🇦🇺', CAD: '🇨🇦', CNY: '🇨🇳',
}

const CARRY_PAIRS = [
  { pair: 'USD/JPY', carry: 4.75, risk: 'LOW' as const },
  { pair: 'AUD/JPY', carry: 4.15, risk: 'LOW' as const },
  { pair: 'NZD/JPY', carry: 5.00, risk: 'LOW' as const },
  { pair: 'USD/CHF', carry: 3.75, risk: 'LOW' as const },
  { pair: 'GBP/JPY', carry: 4.75, risk: 'LOW' as const },
  { pair: 'MXN/JPY', carry: 10.50, risk: 'HIGH' as const },
]

const RISK_COLORS: Record<string, string> = {
  LOW: 'text-emerald-600 bg-emerald-500/10',
  MED: 'text-amber-500 bg-amber-500/10',
  HIGH: 'text-red-500 bg-red-500/10',
}

// Static VIX proxy: update manually when market conditions change
const STATIC_VIX = 18.5

function getCarryRisk(vix: number): { label: string; color: string } {
  if (vix < 20) return { label: 'SAFE', color: 'text-emerald-600' }
  if (vix <= 30) return { label: 'CAUTION', color: 'text-amber-500' }
  return { label: 'DANGER', color: 'text-red-500' }
}

export default function ForexPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'major' | 'em' | 'all' | 'chart' | 'strength' | 'carry'>('major')
  const [chartData, setChartData] = useState<{ time: string; value: number }[]>([])
  const [chartPair, setChartPair] = useState('EUR')
  const [dxyData, setDxyData] = useState<CandleData[]>([])
  const [dxyLoading, setDxyLoading] = useState(false)
  const { data, loading, error, refresh } = useForexData()

  const filtered = tab === 'major'
    ? (expanded ? data : data?.filter((rate) => MAJOR_CURRENCIES.some((c) => rate.pair.includes(c))))
    : tab === 'em'
    ? (expanded ? data : data?.filter((rate) => EM_CURRENCIES.some((c) => rate.pair.includes(c))))
    : tab === 'all'
    ? data
    : null

  useEffect(() => {
    if (tab === 'chart' && chartPair !== 'DXY') {
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

  useEffect(() => {
    if (tab !== 'chart' || chartPair !== 'DXY') return
    if (dxyData.length > 0) return
    setDxyLoading(true)
    fetchCandles('UUP')
      .then(setDxyData)
      .catch(() => {})
      .finally(() => setDxyLoading(false))
  }, [tab, chartPair, dxyData.length])

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

  const crossCount = expanded ? 5 : 3
  const top3 = strengthData.slice(0, crossCount).map(d => d.currency)
  const bottom3 = strengthData.slice(-crossCount).map(d => d.currency)

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
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Forex" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'major')} onClick={() => setTab('major')}>Major</button>
        <button className={tabCls(tab === 'em')} onClick={() => setTab('em')}>EM</button>
        <button className={tabCls(tab === 'all')} onClick={() => setTab('all')}>All</button>
        <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
        <button className={tabCls(tab === 'strength')} onClick={() => setTab('strength')}>Strength</button>
        <button className={tabCls(tab === 'carry')} onClick={() => setTab('carry')}>Carry</button>
      </div>

      {tab === 'chart' && (
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
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Cross Rates</div>
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

      {tab === 'carry' && (() => {
        const { label: riskLabel, color: riskColor } = getCarryRisk(STATIC_VIX)
        const maxCarry = Math.max(...CARRY_PAIRS.map(p => p.carry))
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Carry Trade Risk</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">VIX ~{STATIC_VIX}</span>
                <span className={`text-[10px] font-bold uppercase ${riskColor}`}>{riskLabel}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              {CARRY_PAIRS.map(({ pair, carry, risk }) => (
                <div key={pair} className="flex items-center gap-2">
                  <span className="text-[10px] font-medium w-14 shrink-0">{pair}</span>
                  <div className="flex-1 h-2 bg-border/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(carry / maxCarry) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-emerald-600 w-10 text-right shrink-0">
                    +{carry.toFixed(2)}%
                  </span>
                  <span className={`text-[9px] uppercase font-bold px-1 py-0.5 rounded-sm shrink-0 ${RISK_COLORS[risk]}`}>
                    {risk}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

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
