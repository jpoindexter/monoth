import { useState } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { useForexData } from '@/hooks/use-forex-data'
import { useMarketStore } from '@/stores/market-store'
import { tabCls } from '@/lib/panel-utils'
import { ForexChartTab } from './ForexChartTab'
import { ForexStrengthTab } from './ForexStrengthTab'
import { ForexCarryTab } from './ForexCarryTab'

const MAJOR_CURRENCIES = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD']
const EM_CURRENCIES = ['CNY', 'INR', 'BRL', 'MXN', 'ZAR', 'TRY', 'KRW', 'THB']

export default function ForexPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'major' | 'em' | 'all' | 'chart' | 'strength' | 'carry'>('major')
  const { data, loading, error, refresh } = useForexData()
  const indices = useMarketStore((s) => s.indices)
  const vixSpot = indices.find((d) => d.symbol === 'VIX' || d.symbol === 'VIXY')?.price ?? 18.5

  const filtered = tab === 'major'
    ? (expanded ? data : data?.filter((rate) => MAJOR_CURRENCIES.some((c) => rate.pair.includes(c))))
    : tab === 'em'
    ? (expanded ? data : data?.filter((rate) => EM_CURRENCIES.some((c) => rate.pair.includes(c))))
    : tab === 'all'
    ? data
    : null

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

      {tab === 'chart' && <ForexChartTab expanded={expanded} />}

      {tab === 'strength' && data && <ForexStrengthTab data={data} expanded={expanded} />}

      {tab === 'carry' && <ForexCarryTab vixSpot={vixSpot} />}

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
