import { useState } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useForexData } from '@/hooks/use-forex-data'

const MAJOR_CURRENCIES = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD']

export default function ForexPanel() {
  const [tab, setTab] = useState<'major' | 'all'>('major')
  const { data, loading, error, refresh } = useForexData()

  const filtered = tab === 'major'
    ? data?.filter((rate) => MAJOR_CURRENCIES.some((c) => rate.pair.includes(c)))
    : data

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Forex" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'major')} onClick={() => setTab('major')}>Major</button>
        <button className={tabCls(tab === 'all')} onClick={() => setTab('all')}>All</button>
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left font-medium pb-1.5">Pair</th>
            <th className="text-right font-medium pb-1.5">Rate</th>
            <th className="text-right font-medium pb-1.5">Chg%</th>
          </tr>
        </thead>
        <tbody>
          {filtered?.map((rate) => {
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
    </PanelWrapper>
  )
}
