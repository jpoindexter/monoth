import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { tabCls } from '@/lib/panel-utils'
import { CentralBanksSignalsTab } from './CentralBanksSignalsTab'
import { CentralBanksRatesTab, FALLBACK_CENTRAL_BANKS, daysUntil, type CbRate } from './CentralBanksRatesTab'
import { CentralBanksCalendarTab } from './CentralBanksCalendarTab'
import { CentralBanksDotPlotTab } from './CentralBanksDotPlotTab'
import { CentralBanksBalanceSheetTab, type BalanceSheet } from './CentralBanksBalanceSheetTab'
import { CentralBanksEerTab, type EerEntry } from './CentralBanksEerTab'
import { CentralBanksCreditTab, type CreditEntry } from './CentralBanksCreditTab'
import { CentralBanksNewsTab } from './CentralBanksNewsTab'

interface MacroSignal {
  name: string
  value: number
  label: string
  status: 'bullish' | 'bearish' | 'neutral'
  detail: string
}

export default function CentralBanksPanel() {
  const [tab, setTab] = useState<'signals' | 'news' | 'rates' | 'calendar' | 'dotplot' | 'balancesheet' | 'eer' | 'credit'>('signals')
  const { data: newsData, loading: newsLoading, error, refresh } = useNewsData('centralbanks')

  const { data: signals, loading: sigLoading } = usePolling<MacroSignal[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/macro/signals')
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      return res.json()
    }, []),
    interval: 600_000,
    enabled: tab === 'signals',
  })

  const { data: liveCbRates } = usePolling<CbRate[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/macro/cb-rates')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 21_600_000,
    enabled: tab === 'rates' || tab === 'calendar',
  })

  const { data: eerData } = usePolling<EerEntry[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/macro/bis-exchange-rates')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 21_600_000,
    enabled: tab === 'eer',
  })

  const { data: creditData } = usePolling<CreditEntry[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/macro/bis-credit')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 43_200_000,
    enabled: tab === 'credit',
  })

  const { data: liveBalanceSheets } = usePolling<BalanceSheet[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/macro/balance-sheets')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 3_600_000,
    enabled: tab === 'balancesheet',
  })

  useEffect(() => {
    if (!sigLoading && signals != null && !signals.length && tab === 'signals') {
      setTab('news')
    }
  }, [sigLoading, signals, tab])

  const centralBanks = useMemo(() => {
    if (!liveCbRates?.length) return FALLBACK_CENTRAL_BANKS
    return liveCbRates.filter((b) => b.rate !== null)
  }, [liveCbRates])

  const balanceSheets = useMemo<BalanceSheet[]>(() => {
    if (liveBalanceSheets?.length) return liveBalanceSheets
    return [
      { name: 'Fed', currency: 'USD', current: 7.4, peak: 8.9, unit: 'T', usdEq: 7.4, qtPace: '-$60B/mo', estimated: true },
      { name: 'ECB', currency: 'EUR', current: 6.8, peak: 8.8, unit: 'T', usdEq: 7.3, qtPace: '-€15B/mo', estimated: true },
      { name: 'BoJ', currency: 'JPY', current: 760, peak: 780, unit: 'T', usdEq: 5.1, qtPace: null, estimated: true },
      { name: 'BoE', currency: 'GBP', current: 0.85, peak: 1.0, unit: 'T', usdEq: 1.1, qtPace: '-£100B/yr', estimated: true },
    ]
  }, [liveBalanceSheets])

  const maxRate = Math.max(...centralBanks.map((b) => b.rate ?? 0))
  const sortedByDate = [...centralBanks].sort((a, b) => daysUntil(a.next ?? '') - daysUntil(b.next ?? ''))

  const sortedEer = useMemo(() => {
    if (!eerData?.length) return []
    return [...eerData].sort((a, b) => b.realEer - a.realEer)
  }, [eerData])

  const sortedCredit = useMemo(() => {
    if (!creditData?.length) return []
    return [...creditData].sort((a, b) => b.creditGdpRatio - a.creditGdpRatio)
  }, [creditData])

  return (
    <PanelWrapper title="Central Bank Watch" loading={newsLoading && sigLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'signals')} onClick={() => setTab('signals')}>Signals</button>
        <button className={tabCls(tab === 'rates')} onClick={() => setTab('rates')}>Rates</button>
        <button className={tabCls(tab === 'calendar')} onClick={() => setTab('calendar')}>Calendar</button>
        <button className={tabCls(tab === 'dotplot')} onClick={() => setTab('dotplot')}>Dot Plot</button>
        <button className={tabCls(tab === 'balancesheet')} onClick={() => setTab('balancesheet')}>Balance Sheet</button>
        <button className={tabCls(tab === 'eer')} onClick={() => setTab('eer')}>EER</button>
        <button className={tabCls(tab === 'credit')} onClick={() => setTab('credit')}>Credit</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'signals' && <CentralBanksSignalsTab signals={signals ?? undefined} sigLoading={sigLoading} />}
      {tab === 'rates' && <CentralBanksRatesTab centralBanks={centralBanks} maxRate={maxRate} />}
      {tab === 'calendar' && <CentralBanksCalendarTab sortedByDate={sortedByDate} />}
      {tab === 'dotplot' && <CentralBanksDotPlotTab />}
      {tab === 'balancesheet' && <CentralBanksBalanceSheetTab balanceSheets={balanceSheets} />}
      {tab === 'eer' && <CentralBanksEerTab sortedEer={sortedEer} />}
      {tab === 'credit' && <CentralBanksCreditTab sortedCredit={sortedCredit} />}
      {tab === 'news' && <CentralBanksNewsTab newsData={newsData ?? undefined} />}
    </PanelWrapper>
  )
}
