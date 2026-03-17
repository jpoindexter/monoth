import { useState, useCallback } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { useMacroData } from '@/hooks/use-macro-data'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { fetchFredData } from '@/services/api/macro'
import { tabCls } from '@/lib/panel-utils'
import { FixedIncomeYields } from '@/components/panels/FixedIncomeYields'
import { FixedIncomeETFs } from '@/components/panels/FixedIncomeETFs'
import { FixedIncomeSpreads } from '@/components/panels/FixedIncomeSpreads'
import { FixedIncomeCurve } from '@/components/panels/FixedIncomeCurve'
import { FixedIncomeRealRates } from '@/components/panels/FixedIncomeRealRates'

const YIELD_SERIES: Record<string, string> = {
  DGS2: '2Y', DGS5: '5Y', DGS10: '10Y', DGS30: '30Y',
}

const CURVE_SERIES = ['DGS1MO', 'DGS3MO', 'DGS6MO', 'DGS1', 'DGS2', 'DGS5', 'DGS10', 'DGS30']
const CURVE_LABELS: Record<string, string> = {
  DGS1MO: '1M', DGS3MO: '3M', DGS6MO: '6M', DGS1: '1Y',
  DGS2: '2Y', DGS5: '5Y', DGS10: '10Y', DGS30: '30Y',
}

const BOND_ETFS = ['TLT', 'IEF', 'SHY', 'HYG', 'LQD', 'AGG', 'BND', 'TIPS']

interface RealRate { maturity: string; nominal: number | null; real: number | null; breakeven: number | null }

export default function FixedIncomePanel() {
  useIsExpanded()
  const [tab, setTab] = useState<'yields' | 'etfs' | 'spreads' | 'curve' | 'real'>('yields')
  const { data, loading, error, refresh } = useMacroData()

  const { data: etfData } = usePolling({
    fetcher: useCallback(() => fetchQuotes(BOND_ETFS), []),
    interval: 300_000,
    enabled: tab === 'etfs',
  })

  const { data: realRates, loading: realLoading } = usePolling<RealRate[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/macro/real-rates')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 3_600_000,
    enabled: tab === 'real',
  })

  const { data: curveRaw } = usePolling({
    fetcher: useCallback(() => fetchFredData(CURVE_SERIES), []),
    interval: 300_000,
    enabled: tab === 'curve',
  })

  const yieldData = data?.filter((s) => s.seriesId in YIELD_SERIES)

  const y2  = yieldData?.find((s) => s.seriesId === 'DGS2')?.value
  const y5  = yieldData?.find((s) => s.seriesId === 'DGS5')?.value
  const y10 = yieldData?.find((s) => s.seriesId === 'DGS10')?.value
  const y30 = yieldData?.find((s) => s.seriesId === 'DGS30')?.value

  const spreads = [
    y10 != null && y2  != null && { label: '10Y-2Y', value: y10 - y2,  signal: y10 - y2  < 0 ? 'Inverted' : y10 - y2  < 0.5 ? 'Flat' : 'Normal' },
    y30 != null && y5  != null && { label: '30Y-5Y', value: y30 - y5,  signal: y30 - y5  < 0 ? 'Inverted' : y30 - y5  < 0.5 ? 'Flat' : 'Normal' },
    y10 != null && y5  != null && { label: '10Y-5Y', value: y10 - y5,  signal: y10 - y5  < 0 ? 'Inverted' : 'Normal' },
    y30 != null && y2  != null && { label: '30Y-2Y', value: y30 - y2,  signal: y30 - y2  < 0 ? 'Inverted' : y30 - y2  < 0.5 ? 'Flat' : 'Normal' },
  ].filter(Boolean) as { label: string; value: number; signal: string }[]

  const curvePoints = CURVE_SERIES.map((id) => {
    const s = curveRaw?.find((r) => r.seriesId === id)
    return s ? { label: CURVE_LABELS[id], value: s.value } : null
  }).filter(Boolean) as { label: string; value: number }[]

  const curveY2  = curveRaw?.find((s) => s.seriesId === 'DGS2')?.value
  const curveY10 = curveRaw?.find((s) => s.seriesId === 'DGS10')?.value
  const spread210 = curveY2 != null && curveY10 != null ? curveY10 - curveY2 : null

  return (
    <PanelWrapper title="Fixed Income" loading={loading} error={error} onRetry={refresh}>
      <div className="flex flex-wrap gap-1 mb-2">
        <button className={tabCls(tab === 'yields')}  onClick={() => setTab('yields')}>Yields</button>
        <button className={tabCls(tab === 'etfs')}    onClick={() => setTab('etfs')}>ETFs</button>
        <button className={tabCls(tab === 'spreads')} onClick={() => setTab('spreads')}>Spreads</button>
        <button className={tabCls(tab === 'curve')}   onClick={() => setTab('curve')}>Curve</button>
        <button className={tabCls(tab === 'real')}    onClick={() => setTab('real')}>Real Rates</button>
      </div>

      {tab === 'yields'  && <FixedIncomeYields data={data ?? undefined} />}
      {tab === 'etfs'    && <FixedIncomeETFs data={etfData} />}
      {tab === 'spreads' && <FixedIncomeSpreads spreads={spreads} />}
      {tab === 'curve'   && <FixedIncomeCurve curvePoints={curvePoints} spread210={spread210} />}
      {tab === 'real'    && <FixedIncomeRealRates realRates={realRates ?? null} loading={realLoading} />}
    </PanelWrapper>
  )
}
