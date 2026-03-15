import { useState, useCallback } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'

type Hour = 'bmo' | 'amc' | 'dmh'

interface EarningsEntry {
  symbol: string
  date: string // YYYY-MM-DD
  hour: Hour
  epsEstimate: number | null
  epsActual: number | null
  revenueEstimate: number | null
  revenueActual: number | null
}

type Tab = 'this-week' | 'next-week' | 'estimates'

function getWeekBounds(offsetWeeks: number): { from: string; to: string } {
  const today = new Date()
  const mon = new Date(today)
  mon.setHours(0, 0, 0, 0)
  mon.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offsetWeeks * 7)
  const fri = new Date(mon)
  fri.setDate(mon.getDate() + 4)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(mon), to: fmt(fri) }
}

function hourBadge(h: Hour) {
  if (h === 'bmo') return { label: 'BMO', cls: 'bg-sky-900/60 text-sky-300' }
  if (h === 'amc') return { label: 'AMC', cls: 'bg-violet-900/60 text-violet-300' }
  return { label: 'DMH', cls: 'bg-muted text-muted-foreground' }
}

function surprise(actual: number | null, estimate: number | null): { pct: string; cls: string } | null {
  if (actual === null || estimate === null || estimate === 0) return null
  const pct = ((actual - estimate) / Math.abs(estimate)) * 100
  const cls = pct >= 0 ? 'text-emerald-500' : 'text-red-500'
  return { pct: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, cls }
}

function fmtRev(v: number | null) {
  if (v === null) return '--'
  if (v >= 1000) return `$${(v / 1000).toFixed(2)}T`
  return `$${v.toFixed(1)}B`
}

function groupByDate(entries: EarningsEntry[]) {
  const map = new Map<string, EarningsEntry[]>()
  for (const e of entries) {
    if (!map.has(e.date)) map.set(e.date, [])
    map.get(e.date)!.push(e)
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
}

function fmtDayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function WeekTab({ entries, expanded }: { entries: EarningsEntry[]; expanded: boolean }) {
  const groups = groupByDate(entries)
  if (!groups.length) return (
    <div className="py-4 text-center text-[10px] text-muted-foreground">No earnings this period.</div>
  )
  return (
    <div className="space-y-3">
      {groups.map(([date, rows]) => (
        <div key={date}>
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
            {fmtDayLabel(date)}
          </div>
          <div className="space-y-0.5">
            {rows.map((e) => {
              const badge = hourBadge(e.hour)
              const surp = surprise(e.epsActual, e.epsEstimate)
              return (
                <div key={e.symbol} className="flex items-center gap-1.5 border-t border-border/15 pt-1">
                  <span className="text-[11px] font-bold text-foreground w-[52px] shrink-0 tabular-nums">{e.symbol}</span>
                  <span className={`text-[9px] font-bold px-1 rounded-sm shrink-0 ${badge.cls}`}>{badge.label}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                    EPS {e.epsActual !== null ? (
                      <span className="text-foreground">{e.epsActual.toFixed(2)}</span>
                    ) : (
                      <span>E {e.epsEstimate !== null ? e.epsEstimate.toFixed(2) : '--'}</span>
                    )}
                  </span>
                  {surp && (
                    <span className={`text-[10px] font-bold tabular-nums ${surp.cls}`}>{surp.pct}</span>
                  )}
                  {expanded && (
                    <span className="text-[10px] text-muted-foreground tabular-nums ml-auto">
                      Rev {e.revenueActual !== null ? fmtRev(e.revenueActual) : `E ${fmtRev(e.revenueEstimate)}`}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function EstimatesTab({ entries, expanded }: { entries: EarningsEntry[]; expanded: boolean }) {
  const upcoming = entries
    .filter((e) => e.epsActual === null)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (!upcoming.length) return (
    <div className="py-4 text-center text-[10px] text-muted-foreground">No upcoming estimates.</div>
  )
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 pb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[52px]">Ticker</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[36px]">Date</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums flex-1 text-right">EPS Est</span>
        {expanded && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums w-[64px] text-right">Rev Est</span>
        )}
      </div>
      {upcoming.map((e) => {
        const badge = hourBadge(e.hour)
        const d = new Date(e.date + 'T12:00:00')
        const dateShort = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
        return (
          <div key={e.symbol} className="flex items-center gap-1.5 border-t border-border/15 pt-1">
            <span className="text-[11px] font-bold text-foreground w-[52px] shrink-0 tabular-nums">{e.symbol}</span>
            <span className="text-[10px] text-muted-foreground tabular-nums w-[36px] shrink-0">{dateShort}</span>
            <span className={`text-[9px] font-bold px-1 rounded-sm shrink-0 ${badge.cls}`}>{badge.label}</span>
            <span className="text-[11px] tabular-nums text-foreground flex-1 text-right">
              {e.epsEstimate !== null ? e.epsEstimate.toFixed(2) : '--'}
            </span>
            {expanded && (
              <span className="text-[10px] tabular-nums text-muted-foreground w-[64px] text-right">
                {fmtRev(e.revenueEstimate)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function EarningsCalendarPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('this-week')

  const thisBounds = getWeekBounds(0)
  const nextBounds = getWeekBounds(1)

  const fetchWeek = useCallback(async (from: string, to: string): Promise<EarningsEntry[]> => {
    const res = await fetch(`/api/market/earnings?from=${from}&to=${to}`)
    if (!res.ok) throw new Error('earnings API error')
    const raw: Record<string, unknown>[] = await res.json()
    if (!Array.isArray(raw) || !raw.length) throw new Error('empty')
    return raw.map((r) => ({
      symbol: String(r.symbol ?? ''),
      date: String(r.reportDate ?? r.date ?? ''),
      hour: (['bmo', 'amc', 'dmh'].includes(String(r.hour)) ? r.hour : 'amc') as Hour,
      epsEstimate: r.epsEstimate != null ? Number(r.epsEstimate) : null,
      // epsActual is always null — API does not fetch reported actuals yet; update fetcher when endpoint supports it
      epsActual: r.epsActual != null ? Number(r.epsActual) : null,
      revenueEstimate: r.revenueEstimate != null ? Number(r.revenueEstimate) : null,
      revenueActual: r.revenueActual != null ? Number(r.revenueActual) : null,
    }))
  }, [])

  const { data: thisWeekData, loading: loadingThis } = usePolling<EarningsEntry[]>({
    fetcher: useCallback(() => fetchWeek(thisBounds.from, thisBounds.to), [fetchWeek, thisBounds.from, thisBounds.to]),
    interval: 300_000,
    enabled: tab === 'this-week',
  })

  const { data: nextWeekData, loading: loadingNext } = usePolling<EarningsEntry[]>({
    fetcher: useCallback(() => fetchWeek(nextBounds.from, nextBounds.to), [fetchWeek, nextBounds.from, nextBounds.to]),
    interval: 300_000,
    enabled: tab === 'next-week' || tab === 'estimates',
  })

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const thisEntries = thisWeekData ?? []
  const nextEntries = nextWeekData ?? []
  const allEntries = [...thisEntries, ...nextEntries]

  const loading = (tab === 'this-week' && loadingThis) || (tab === 'next-week' && loadingNext) || (tab === 'estimates' && loadingNext)

  return (
    <PanelWrapper title="Earnings Calendar" loading={loading}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'this-week')} onClick={() => setTab('this-week')}>This Week</button>
        <button className={tabCls(tab === 'next-week')} onClick={() => setTab('next-week')}>Next Week</button>
        <button className={tabCls(tab === 'estimates')} onClick={() => setTab('estimates')}>Estimates</button>
      </div>

      {loading && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
      )}

      {!loading && tab === 'this-week' && (
        <WeekTab entries={thisEntries} expanded={expanded} />
      )}

      {!loading && tab === 'next-week' && (
        <WeekTab entries={nextEntries} expanded={expanded} />
      )}

      {!loading && tab === 'estimates' && (
        <EstimatesTab entries={allEntries} expanded={expanded} />
      )}
    </PanelWrapper>
  )
}
