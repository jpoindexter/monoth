import { useState, useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { useMacroData } from '@/hooks/use-macro-data'
import { useMarketStore } from '@/stores/market-store'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { tabCls } from '@/lib/panel-utils'
import { MacroSignalsSignalsTab } from './MacroSignalsSignalsTab'
import { MacroSignalsRegimeTab } from './MacroSignalsRegimeTab'
import { MacroSignalsIndicatorsTab } from './MacroSignalsIndicatorsTab'
import { MacroSignalsCycleTab } from './MacroSignalsCycleTab'

interface MacroSignal {
  name: string
  value: number
  label: string
  status: 'bullish' | 'bearish' | 'neutral'
  detail: string
}

export default function MacroSignalsPanel() {
  const [tab, setTab] = useState<'signals' | 'regime' | 'indicators' | 'cycle'>('signals')

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/macro/signals')
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<MacroSignal[]>
  }, [])

  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 600_000, enabled: tab === 'signals' })
  const { data: fredData } = useMacroData()

  const indices = useMarketStore((s) => s.indices)
  const forex = useMarketStore((s) => s.forex)

  return (
    <PanelWrapper title="Macro Signals" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'signals')} onClick={() => setTab('signals')}>Signals</button>
        <button className={tabCls(tab === 'regime')} onClick={() => setTab('regime')}>Regime</button>
        <button className={tabCls(tab === 'indicators')} onClick={() => setTab('indicators')}>Indicators</button>
        <button className={tabCls(tab === 'cycle')} onClick={() => setTab('cycle')}>Cycle</button>
      </div>

      {tab === 'signals' && <MacroSignalsSignalsTab signals={data ?? undefined} />}

      {tab === 'regime' && (
        <MacroSignalsRegimeTab
          indices={indices}
          fredData={fredData ?? []}
          forex={forex}
        />
      )}

      {tab === 'indicators' && <MacroSignalsIndicatorsTab fredData={fredData ?? []} />}

      {tab === 'cycle' && <MacroSignalsCycleTab fredData={fredData ?? []} />}
    </PanelWrapper>
  )
}
