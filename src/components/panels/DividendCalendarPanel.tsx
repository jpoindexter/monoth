import { useState, useCallback } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { tabCls, fmt } from '@/lib/panel-utils'

type Tab = 'upcoming' | 'yield' | 'all'

interface DividendEntry {
  symbol: string
  name: string
  exDivDate: string | null
  payDate: string | null
  dividendRate: number | null
  dividendYield: number | null
  payoutRatio: number | null
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T12:00:00')
  return Math.round((target.getTime() - now.getTime()) / 86_400_000)
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function DaysChip({ days }: { days: number }) {
  if (days < 0) return <span className="text-[8px] text-muted-foreground/50">passed</span>
  if (days === 0) return <span className="text-[8px] font-bold text-amber-400">Today</span>
  if (days <= 7) return <span className="text-[8px] font-bold text-amber-400">{days}d</span>
  return <span className="text-[8px] text-muted-foreground/60">{days}d</span>
}

function DivRow({ row, showYield }: { row: DividendEntry; showYield: boolean }) {
  const days = row.exDivDate ? daysUntil(row.exDivDate) : null
  const yieldPct = row.dividendYield != null ? row.dividendYield * 100 : null

  return (
    <div className="grid grid-cols-[52px_60px_52px_50px_28px] gap-x-1 py-0.5 border-b border-border/10 hover:bg-muted/30 rounded-sm items-center">
      <span className="text-[11px] font-bold text-foreground tabular-nums">{row.symbol}</span>
      <span className="text-[10px] text-muted-foreground tabular-nums">
        {row.exDivDate ? fmtDate(row.exDivDate) : '—'}
      </span>
      <span className="text-[10px] text-foreground tabular-nums text-right">
        {row.dividendRate != null ? `$${fmt(row.dividendRate)}` : '—'}
      </span>
      <span className={`text-[10px] tabular-nums text-right font-medium ${showYield && yieldPct != null && yieldPct >= 4 ? 'text-emerald-400' : 'text-foreground'}`}>
        {yieldPct != null ? `${fmt(yieldPct, 2)}%` : '—'}
      </span>
      {days !== null ? <DaysChip days={days} /> : <span />}
    </div>
  )
}

export default function DividendCalendarPanel() {
  const [tab, setTab] = useState<Tab>('upcoming')

  const fetcher = useCallback(async (): Promise<DividendEntry[]> => {
    const res = await fetch('/api/market/dividends')
    if (!res.ok) throw new Error('dividends API error')
    return res.json()
  }, [])

  const { data, loading, error, refresh } = usePolling<DividendEntry[]>({
    fetcher,
    interval: 3_600_000,
  })

  const all = data ?? []

  const upcoming = all
    .filter((r) => {
      if (!r.exDivDate) return false
      const d = daysUntil(r.exDivDate)
      return d >= 0 && d <= 30
    })
    .sort((a, b) => (a.exDivDate ?? '').localeCompare(b.exDivDate ?? ''))

  const byYield = [...all].sort((a, b) => (b.dividendYield ?? 0) - (a.dividendYield ?? 0))

  const rows = tab === 'upcoming' ? upcoming : tab === 'yield' ? byYield : all

  return (
    <PanelWrapper
      title="Dividend Calendar"
      loading={loading}
      error={error}
      onRetry={refresh}
    >
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'upcoming')} onClick={() => setTab('upcoming')}>Upcoming</button>
        <button className={tabCls(tab === 'yield')} onClick={() => setTab('yield')}>High Yield</button>
        <button className={tabCls(tab === 'all')} onClick={() => setTab('all')}>All</button>
      </div>

      <div className="grid grid-cols-[52px_60px_52px_50px_28px] gap-x-1 pb-1 border-b border-border/20">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Symbol</span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Ex-Div</span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground text-right">Annual $</span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground text-right">Yield</span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground text-right">In</span>
      </div>

      <div className="space-y-0">
        {rows.length === 0 && (
          <p className="text-[10px] text-muted-foreground py-4 text-center">
            {tab === 'upcoming' ? 'No ex-dividend dates in next 30 days.' : 'No data available.'}
          </p>
        )}
        {rows.map((row) => (
          <DivRow key={row.symbol} row={row} showYield={tab === 'yield'} />
        ))}
      </div>
    </PanelWrapper>
  )
}
