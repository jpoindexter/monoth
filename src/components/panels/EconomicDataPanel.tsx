import { useState, useCallback, useEffect } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { useMacroData } from '@/hooks/use-macro-data'
import { usePolling } from '@/hooks/use-polling'
import { tabCls } from '@/lib/panel-utils'
import { EconomicDataIndicators } from '@/components/panels/EconomicDataIndicators'
import { EconomicDataCalendar } from '@/components/panels/EconomicDataCalendar'
import { EconomicDataTrends } from '@/components/panels/EconomicDataTrends'

interface CalendarEvent {
  country: string
  event: string
  actual: number | null
  estimate: number | null
  prev: number | null
  impact: string
  time: string
}

export default function EconomicDataPanel() {
  useIsExpanded()
  const [tab, setTab] = useState<'indicators' | 'calendar' | 'trends'>('indicators')
  const { data, loading, error, refresh } = useMacroData()

  const { data: calData, loading: calLoading } = usePolling<CalendarEvent[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/macro/calendar')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 300_000,
    enabled: tab === 'calendar',
  })

  useEffect(() => {
    if (!loading && data != null && !data.length && tab === 'indicators') {
      setTab('calendar')
    }
  }, [loading, data, tab])

  return (
    <PanelWrapper title="Economic Data" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'indicators')} onClick={() => setTab('indicators')}>Indicators</button>
        <button className={tabCls(tab === 'calendar')} onClick={() => setTab('calendar')}>Calendar</button>
        <button className={tabCls(tab === 'trends')} onClick={() => setTab('trends')}>Trends</button>
      </div>

      {tab === 'indicators' && !loading && data != null && (
        <EconomicDataIndicators data={data} />
      )}

      {tab === 'calendar' && (
        <EconomicDataCalendar calData={calData ?? null} loading={calLoading} />
      )}

      {tab === 'trends' && !loading && data != null && (
        <EconomicDataTrends data={data} />
      )}
    </PanelWrapper>
  )
}
