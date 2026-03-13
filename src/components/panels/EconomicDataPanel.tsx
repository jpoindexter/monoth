import { useState, useCallback, useEffect } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useMacroData } from '@/hooks/use-macro-data'
import { usePolling } from '@/hooks/use-polling'

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
  const [tab, setTab] = useState<'indicators' | 'calendar'>('indicators')
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

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const impactColor = (impact: string) => {
    if (impact === 'high') return 'text-red-500'
    if (impact === 'medium') return 'text-yellow-500'
    return 'text-muted-foreground'
  }

  return (
    <PanelWrapper title="Economic Data" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'indicators')} onClick={() => setTab('indicators')}>Indicators</button>
        <button className={tabCls(tab === 'calendar')} onClick={() => setTab('calendar')}>Calendar</button>
      </div>

      {tab === 'indicators' && !loading && data != null && !data.length && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">
          No data available. Refreshes automatically.
        </div>
      )}

      {tab === 'indicators' && data && !!data.length && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Indicator</th>
              <th className="text-right font-medium pb-1.5">Latest</th>
              <th className="text-right font-medium pb-1.5">Prev</th>
              <th className="text-right font-medium pb-1.5">Chg</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((series) => {
              const diff = series.value - series.previous
              const isPositive = diff >= 0
              return (
                <tr key={series.seriesId} className="border-t border-border/20">
                  <td className="py-1 font-medium">{series.name}</td>
                  <td className="text-right tabular-nums">{series.value.toFixed(2)}</td>
                  <td className="text-right tabular-nums text-muted-foreground">{series.previous.toFixed(2)}</td>
                  <td className={`text-right tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{diff.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'calendar' && calLoading && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
      )}

      {tab === 'calendar' && !calLoading && calData != null && !calData.length && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">
          No data available. Refreshes automatically.
        </div>
      )}

      {tab === 'calendar' && calData && !!calData.length && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Event</th>
              <th className="text-right font-medium pb-1.5">Act</th>
              <th className="text-right font-medium pb-1.5">Est</th>
              <th className="text-right font-medium pb-1.5">Prev</th>
            </tr>
          </thead>
          <tbody>
            {calData.slice(0, 20).map((evt, i) => (
              <tr key={i} className="border-t border-border/20">
                <td className="py-0.5">
                  <div className="flex items-center gap-1">
                    <span className={`text-[8px] font-bold ${impactColor(evt.impact)}`}>
                      {evt.country}
                    </span>
                    <span className="text-[10px] font-medium line-clamp-1">{evt.event}</span>
                  </div>
                </td>
                <td className="text-right tabular-nums font-medium">
                  {evt.actual != null ? evt.actual : '-'}
                </td>
                <td className="text-right tabular-nums text-muted-foreground">
                  {evt.estimate != null ? evt.estimate : '-'}
                </td>
                <td className="text-right tabular-nums text-muted-foreground">
                  {evt.prev != null ? evt.prev : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PanelWrapper>
  )
}
