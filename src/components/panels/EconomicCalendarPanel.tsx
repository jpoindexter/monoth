import { useState, useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { tabCls } from '@/lib/panel-utils'
import { buildMockEvents, isToday, isWithinDays } from '@/components/panels/EconomicCalendarShared'
import type { EconEvent } from '@/components/panels/EconomicCalendarShared'
import EconomicCalendarUpcomingTab from '@/components/panels/EconomicCalendarUpcomingTab'
import EconomicCalendarTodayTab from '@/components/panels/EconomicCalendarTodayTab'
import EconomicCalendarHighImpactTab from '@/components/panels/EconomicCalendarHighImpactTab'

type Tab = 'upcoming' | 'today' | 'high'

export default function EconomicCalendarPanel() {
  const [tab, setTab] = useState<Tab>('upcoming')

  const fetcher = useCallback(async (): Promise<EconEvent[]> => {
    const res = await fetch('/api/macro/calendar', { cache: 'no-store' })
    if (!res.ok) throw new Error(`calendar API ${res.status}`)
    const raw: EconEvent[] = await res.json()
    if (!Array.isArray(raw) || !raw.length) throw new Error('Empty response')
    return raw
  }, [])

  const { data, loading, error, refresh } = usePolling({
    fetcher,
    interval: 300_000,
  })

  const events: EconEvent[] = data ?? buildMockEvents()

  const todayCount = events.filter(e => isToday(e.date)).length
  const highCount = events.filter(e => e.impact === 'high' && isWithinDays(e.date, 14)).length

  return (
    <PanelWrapper title="Economic Calendar" loading={loading} error={error && !data ? error : null} onRetry={refresh}>
      <div className="flex gap-1 mb-2 items-center">
        <button className={tabCls(tab === 'upcoming')} onClick={() => setTab('upcoming')}>Upcoming</button>
        <button className={tabCls(tab === 'today')} onClick={() => setTab('today')}>
          Today{todayCount > 0 ? ` (${todayCount})` : ''}
        </button>
        <button className={tabCls(tab === 'high')} onClick={() => setTab('high')}>
          High Impact{highCount > 0 ? ` (${highCount})` : ''}
        </button>
        {error && data && (
          <span className="ml-auto text-[9px] text-muted-foreground/50">mock</span>
        )}
      </div>

      {tab === 'upcoming' && <EconomicCalendarUpcomingTab events={events} />}
      {tab === 'today' && <EconomicCalendarTodayTab events={events} />}
      {tab === 'high' && <EconomicCalendarHighImpactTab events={events} />}
    </PanelWrapper>
  )
}
