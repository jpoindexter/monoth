import { useState } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useForexData } from '@/hooks/use-forex-data'
import { tabCls, fmt } from '@/lib/panel-utils'

const CURRENCIES = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'CNY', 'HKD', 'SGD', 'MXN', 'BRL', 'INR', 'ZAR', 'TRY', 'NOK', 'SEK', 'DKK', 'PLN']

const FLAGS: Record<string, string> = {
  EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CHF: '🇨🇭', CAD: '🇨🇦', AUD: '🇦🇺', NZD: '🇳🇿',
  CNY: '🇨🇳', HKD: '🇭🇰', SGD: '🇸🇬', MXN: '🇲🇽', BRL: '🇧🇷', INR: '🇮🇳', ZAR: '🇿🇦',
  TRY: '🇹🇷', NOK: '🇳🇴', SEK: '🇸🇪', DKK: '🇩🇰', PLN: '🇵🇱',
}

function heatColor(pct: number): string {
  if (pct > 1) return 'rgba(16, 185, 129, 0.35)'
  if (pct > 0) return 'rgba(16, 185, 129, 0.15)'
  if (pct === 0) return 'rgba(113, 113, 122, 0.15)'
  if (pct > -1) return 'rgba(239, 68, 68, 0.15)'
  return 'rgba(239, 68, 68, 0.35)'
}

function textColor(pct: number): string {
  if (pct > 0) return '#34d399'
  if (pct < 0) return '#f87171'
  return '#a1a1aa'
}

export default function CurrencyHeatmapPanel() {
  const [tab, setTab] = useState<'heatmap' | 'table'>('heatmap')
  const { data, loading, error, refresh } = useForexData(300_000)

  const rows = data
    ? CURRENCIES.map((c) => data.find((r) => r.pair === `USD/${c}`)).filter(Boolean)
    : []

  const sorted = [...rows].sort((a, b) => b!.changePercent - a!.changePercent)

  return (
    <PanelWrapper title="Currency Heatmap" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'heatmap')} onClick={() => setTab('heatmap')}>Heatmap</button>
        <button className={tabCls(tab === 'table')} onClick={() => setTab('table')}>Table</button>
      </div>

      {tab === 'heatmap' && (
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}
        >
          {sorted.map((r) => {
            if (!r) return null
            const currency = r.pair.replace('USD/', '')
            const pct = r.changePercent
            return (
              <div
                key={r.pair}
                className="rounded-sm p-1.5 flex flex-col items-center justify-center text-center"
                style={{ background: heatColor(pct), minHeight: 56 }}
              >
                <span className="text-base leading-none">{FLAGS[currency] ?? '🏳️'}</span>
                <span className="text-[11px] font-semibold mt-0.5" style={{ color: textColor(pct) }}>{currency}</span>
                <span className="text-[10px] tabular-nums font-medium" style={{ color: textColor(pct) }}>
                  {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'table' && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Currency</th>
              <th className="text-right font-medium pb-1.5">Rate vs USD</th>
              <th className="text-right font-medium pb-1.5">Chg%</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              if (!r) return null
              const currency = r.pair.replace('USD/', '')
              const pos = r.changePercent >= 0
              return (
                <tr key={r.pair} className="border-t border-border/20">
                  <td className="py-1 flex items-center gap-1">
                    <span>{FLAGS[currency] ?? '🏳️'}</span>
                    <span className="font-medium">{currency}</span>
                  </td>
                  <td className="text-right tabular-nums">{fmt(r.rate, 4)}</td>
                  <td className={`text-right tabular-nums font-medium ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pos ? '+' : ''}{r.changePercent.toFixed(2)}%
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
