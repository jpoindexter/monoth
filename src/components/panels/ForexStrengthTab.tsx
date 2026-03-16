import type { ForexRate } from '@/types'

const STRENGTH_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'CNY']

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵',
  CHF: '🇨🇭', AUD: '🇦🇺', CAD: '🇨🇦', CNY: '🇨🇳',
}

function computeStrength(data: ForexRate[]) {
  const sums: Record<string, { total: number; count: number }> = {}
  STRENGTH_CURRENCIES.forEach(c => { sums[c] = { total: 0, count: 0 } })

  for (const rate of data) {
    const parts = rate.pair.split('/')
    if (parts.length !== 2) continue
    const quote = parts[1] ?? ''
    if (!STRENGTH_CURRENCIES.includes(quote)) continue

    const usdEntry = sums['USD']
    if (usdEntry) { usdEntry.total += rate.changePercent; usdEntry.count += 1 }

    const quoteEntry = sums[quote]
    if (quoteEntry) { quoteEntry.total += -rate.changePercent; quoteEntry.count += 1 }
  }

  return STRENGTH_CURRENCIES.map(c => {
    const entry = sums[c]
    return {
      currency: c,
      strength: entry && entry.count > 0 ? entry.total / entry.count : 0,
    }
  }).sort((a, b) => b.strength - a.strength)
}

function getRateForPair(data: ForexRate[], base: string, quote: string): number | null {
  if (base === quote) return 1
  const baseRate = base === 'USD' ? 1 : data.find(r => r.pair === `USD/${base}`)?.rate ?? null
  const quoteRate = quote === 'USD' ? 1 : data.find(r => r.pair === `USD/${quote}`)?.rate ?? null
  if (baseRate === null || quoteRate === null) return null
  return quoteRate / baseRate
}

export function ForexStrengthTab({ data, expanded }: { data: ForexRate[]; expanded: boolean }) {
  const strengthData = computeStrength(data)
  const maxAbs = Math.max(...strengthData.map(d => Math.abs(d.strength)), 0.01)

  const crossCount = expanded ? 5 : 3
  const top3 = strengthData.slice(0, crossCount).map(d => d.currency)
  const bottom3 = strengthData.slice(-crossCount).map(d => d.currency)

  return (
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
                    const rate = getRateForPair(data, base, quote)
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
  )
}
