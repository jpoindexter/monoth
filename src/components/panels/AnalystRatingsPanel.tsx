import { useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { tabCls } from '@/lib/panel-utils'

interface RatingEntry {
  ticker: string
  firm: string
  fromGrade: string
  toGrade: string
  action: 'up' | 'down' | 'init' | 'reit'
  date: string
}

type Tab = 'upgrades' | 'downgrades' | 'all'

const ACTION_LABEL: Record<string, string> = {
  up: 'UP', down: 'DOWN', init: 'INIT', reit: 'REIT',
}
const ACTION_COLOR: Record<string, string> = {
  up: 'text-emerald-500', down: 'text-red-500', init: 'text-sky-400', reit: 'text-muted-foreground',
}

function gradeColor(grade: string) {
  const g = grade.toLowerCase()
  if (g.includes('strong buy') || g.includes('outperform') || g.includes('buy') || g.includes('positive') || g.includes('overweight')) return 'text-emerald-500'
  if (g.includes('hold') || g.includes('neutral') || g.includes('equal') || g.includes('in-line') || g.includes('sector')) return 'text-muted-foreground'
  if (g.includes('sell') || g.includes('underperform') || g.includes('underweight') || g.includes('negative') || g.includes('reduce')) return 'text-red-500'
  return 'text-foreground'
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
}

export default function AnalystRatingsPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('upgrades')

  const { data, loading, error, refresh } = usePolling<RatingEntry[]>({
    fetcher: async () => {
      const res = await fetch('/api/market/analyst')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    interval: 600_000,
  })

  const sorted = data ? [...data].sort((a, b) => b.date.localeCompare(a.date)) : []
  const upgrades = sorted.filter((e) => e.action === 'up' || e.action === 'init')
  const downgrades = sorted.filter((e) => e.action === 'down')
  const rows = tab === 'upgrades' ? upgrades : tab === 'downgrades' ? downgrades : sorted
  const visible = expanded ? rows : rows.slice(0, 12)

  const buyCount = sorted.filter((e) => gradeColor(e.toGrade) === 'text-emerald-500').length
  const holdCount = sorted.filter((e) => gradeColor(e.toGrade) === 'text-muted-foreground').length
  const sellCount = sorted.filter((e) => gradeColor(e.toGrade) === 'text-red-500').length
  const totalCount = buyCount + holdCount + sellCount

  return (
    <PanelWrapper title="Analyst Ratings" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'upgrades')} onClick={() => setTab('upgrades')}>
          Upgrades {upgrades.length > 0 && <span className="text-[9px] opacity-60 ml-0.5">({upgrades.length})</span>}
        </button>
        <button className={tabCls(tab === 'downgrades')} onClick={() => setTab('downgrades')}>
          Downgrades {downgrades.length > 0 && <span className="text-[9px] opacity-60 ml-0.5">({downgrades.length})</span>}
        </button>
        <button className={tabCls(tab === 'all')} onClick={() => setTab('all')}>All</button>
      </div>

      {totalCount > 0 && (
        <div className="flex items-center gap-2 mb-2 text-[10px]">
          <span className="text-emerald-500 tabular-nums font-medium">{buyCount} Buy</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-muted-foreground tabular-nums">{holdCount} Hold</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-red-500 tabular-nums font-medium">{sellCount} Sell</span>
          {totalCount > 0 && (
            <span className="text-muted-foreground/50 ml-auto tabular-nums">{Math.round((buyCount / totalCount) * 100)}% buy</span>
          )}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">
          {data ? 'No recent ratings changes.' : 'Loading...'}
        </div>
      )}

      {visible.length > 0 && (
        <div className="space-y-0">
          <div className="flex items-center gap-1.5 pb-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[44px]">Ticker</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex-1">Firm</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-right w-[90px]">Change</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-right w-[28px]">Date</span>
          </div>
          {visible.map((e, i) => (
            <div key={i} className="flex items-center gap-1.5 border-t border-border/15 pt-1">
              <span className="text-[11px] font-bold text-foreground w-[44px] shrink-0 tabular-nums">{e.ticker}</span>
              <span className={`text-[10px] flex-1 truncate ${expanded ? '' : 'max-w-[80px]'}`}>{e.firm}</span>
              <span className="text-[10px] text-right w-[90px] shrink-0 tabular-nums leading-tight">
                {e.fromGrade ? (
                  <>
                    <span className={gradeColor(e.fromGrade)}>{e.fromGrade.slice(0, 8)}</span>
                    <span className="text-muted-foreground/50"> → </span>
                    <span className={`font-medium ${ACTION_COLOR[e.action] ?? ''}`}>{e.toGrade.slice(0, 8)}</span>
                  </>
                ) : (
                  <span className={`font-medium ${ACTION_COLOR[e.action] ?? ''}`}>
                    {ACTION_LABEL[e.action]} {e.toGrade.slice(0, 8)}
                  </span>
                )}
              </span>
              <span className="text-[10px] tabular-nums text-muted-foreground text-right w-[28px] shrink-0">{fmtDate(e.date)}</span>
            </div>
          ))}
          {!expanded && rows.length > visible.length && (
            <div className="text-[10px] text-muted-foreground pt-1">{rows.length - visible.length} more — expand panel</div>
          )}
        </div>
      )}
    </PanelWrapper>
  )
}
