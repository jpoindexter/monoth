import { useState, useCallback } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { useCorrelationEvents, useCorrelationMatrix } from '@/hooks/use-correlation-data'
import { usePolling } from '@/hooks/use-polling'
import { tabCls } from '@/lib/panel-utils'
import {
  ASSETS,
  ASSETS_EXPANDED,
  STATIC_CORRELATIONS,
  STATIC_CORRELATIONS_EXPANDED,
  ROLLING_HISTORY,
  computeRegime,
} from '@/components/panels/correlation-data'
import { CorrelationMatrixTab } from '@/components/panels/CorrelationMatrixTab'
import { CorrelationCrossTab } from '@/components/panels/CorrelationCrossTab'
import { CorrelationEventsTab } from '@/components/panels/CorrelationEventsTab'
import { CorrelationRegimeTab } from '@/components/panels/CorrelationRegimeTab'
import { CorrelationHistoryTab } from '@/components/panels/CorrelationHistoryTab'

interface CorrelationEvent {
  id: string
  indicator: string
  country: string
  actual: number
  expected: number
  previous: number
  surprise: number
  impact: 'high' | 'medium' | 'low'
  timestamp: number
  unit: string
}

interface CorrelationEntry {
  indicator: string
  symbol: string
  beatDirection: number
  missDirection: number
  confidence: number
}

type Tab = 'matrix' | 'cross' | 'events' | 'regime' | 'history'

export default function CorrelationPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('matrix')
  const events = useCorrelationEvents()
  const matrix = useCorrelationMatrix()

  const { data: liveCorr } = usePolling<{
    assets: string[]
    matrix: number[][]
    history: { pair: string; w1: number; m1: number; m3: number; m6: number }[]
    asOf: string
  }>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/correlation/live')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 3_600_000,
    enabled: tab !== 'events',
  })

  const liveMatrix: Record<string, Record<string, number>> | null = liveCorr
    ? Object.fromEntries(
        liveCorr.assets.map((a, i) => [
          a,
          Object.fromEntries(liveCorr.assets.map((b, j) => [b, liveCorr.matrix[i]![j]! as number])),
        ])
      )
    : null

  const loading = events.loading && matrix.loading
  const error = events.error ?? matrix.error

  const eventList: CorrelationEvent[] = events.data ?? []
  const matrixList: CorrelationEntry[] = matrix.data ?? []

  const activeAssets = liveCorr?.assets ?? (expanded ? ASSETS_EXPANDED : ASSETS)
  const activeCorr = liveMatrix ?? (expanded ? STATIC_CORRELATIONS_EXPANDED : STATIC_CORRELATIONS)
  const activeHistory = liveCorr?.history ?? ROLLING_HISTORY
  const isLive = !!liveCorr

  const regime = computeRegime(activeAssets, activeCorr)
  const regimeBadgeCls =
    regime.regime === 'RISK-ON'
      ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30'
      : regime.regime === 'RISK-OFF'
      ? 'bg-red-600/20 text-red-400 border border-red-500/30'
      : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'

  return (
    <PanelWrapper
      title="Correlation Engine"
      loading={loading}
      error={error}
      onRetry={() => { events.refresh(); matrix.refresh() }}
    >
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'matrix')} onClick={() => setTab('matrix')}>Matrix</button>
        <button className={tabCls(tab === 'cross')} onClick={() => setTab('cross')}>Cross-Asset</button>
        <button className={tabCls(tab === 'events')} onClick={() => setTab('events')}>Events</button>
        <button className={tabCls(tab === 'regime')} onClick={() => setTab('regime')}>Regime</button>
        <button className={tabCls(tab === 'history')} onClick={() => setTab('history')}>History</button>
      </div>

      {tab === 'matrix' && (
        <CorrelationMatrixTab
          activeAssets={activeAssets}
          activeCorr={activeCorr}
          matrixList={matrixList}
          isLive={isLive}
          liveAsOf={liveCorr?.asOf}
          expanded={expanded}
        />
      )}
      {tab === 'cross' && (
        <CorrelationCrossTab
          activeAssets={activeAssets}
          activeCorr={activeCorr}
          isLive={isLive}
          liveAsOf={liveCorr?.asOf}
          expanded={expanded}
        />
      )}
      {tab === 'events' && (
        <CorrelationEventsTab eventList={eventList} loading={events.loading} />
      )}
      {tab === 'regime' && (
        <CorrelationRegimeTab
          regime={regime}
          regimeBadgeCls={regimeBadgeCls}
          isLive={isLive}
          liveAsOf={liveCorr?.asOf}
          activeAssetsCount={activeAssets.length}
        />
      )}
      {tab === 'history' && (
        <CorrelationHistoryTab
          history={activeHistory}
          isLive={isLive}
          liveAsOf={liveCorr?.asOf}
        />
      )}
    </PanelWrapper>
  )
}
