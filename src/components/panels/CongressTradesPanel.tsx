import { useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { tabCls } from '@/lib/panel-utils'

interface CongressFiling {
  chamber: 'senate' | 'house'
  name: string
  party?: string
  state?: string
  filedDate: string
  type: string
  ticker?: string
  amount?: string
  url: string
}

type Tab = 'recent' | 'senate' | 'house'

function fmtDate(d: string) {
  if (!d) return '—'
  const parsed = new Date(d + 'T12:00:00')
  if (isNaN(parsed.getTime())) return d
  return parsed.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
}

function ChamberBadge({ chamber }: { chamber: 'senate' | 'house' }) {
  const cls =
    chamber === 'senate'
      ? 'bg-blue-500/15 text-blue-400'
      : 'bg-red-500/15 text-red-400'
  return (
    <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-[2px] shrink-0 ${cls}`}>
      {chamber === 'senate' ? 'SEN' : 'HSE'}
    </span>
  )
}

export default function CongressTradesPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('recent')

  const [maintenance, setMaintenance] = useState(false)

  const { data, loading, error, refresh } = usePolling<CongressFiling[]>({
    fetcher: async () => {
      const res = await fetch('/api/market/congress')
      if (res.status === 503) { setMaintenance(true); throw new Error('unavailable') }
      setMaintenance(false)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    interval: 1_800_000,
  })

  const senate = data?.filter((f) => f.chamber === 'senate') ?? []
  const house = data?.filter((f) => f.chamber === 'house') ?? []
  const rows = tab === 'senate' ? senate : tab === 'house' ? house : (data ?? [])
  const visible = expanded ? rows : rows.slice(0, 12)

  return (
    <PanelWrapper title="Congress Trades" loading={loading} error={maintenance ? null : error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'recent')} onClick={() => setTab('recent')}>
          Recent {data && data.length > 0 && <span className="text-[9px] opacity-60 ml-0.5">({data.length})</span>}
        </button>
        <button className={tabCls(tab === 'senate')} onClick={() => setTab('senate')}>
          Senate {senate.length > 0 && <span className="text-[9px] opacity-60 ml-0.5">({senate.length})</span>}
        </button>
        <button className={tabCls(tab === 'house')} onClick={() => setTab('house')}>
          House {house.length > 0 && <span className="text-[9px] opacity-60 ml-0.5">({house.length})</span>}
        </button>
      </div>

      {!loading && maintenance && (
        <div className="py-6 flex flex-col items-center gap-2 text-center">
          <div className="text-[11px] text-muted-foreground">Senate disclosure system under maintenance</div>
          <div className="flex items-center gap-3 text-[10px]">
            <a href="https://efdsearch.senate.gov/search/home/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
              Senate ↗
            </a>
            <a href="https://disclosures-clerk.house.gov" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
              House ↗
            </a>
            <button onClick={refresh} className="text-muted-foreground hover:text-foreground transition-colors">
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !maintenance && visible.length === 0 && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">
          No recent disclosures found
        </div>
      )}

      {visible.length > 0 && (
        <div className="space-y-0">
          {visible.map((f, i) => (
            <div key={i} className="flex items-start gap-1.5 border-t border-border/15 py-1">
              <ChamberBadge chamber={f.chamber} />
              <div className="flex-1 min-w-0">
                <div className={`text-[11px] font-medium text-foreground truncate ${expanded ? '' : 'max-w-[120px]'}`}>
                  {f.name}
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">
                  Filed PTR
                  {f.ticker && (
                    <span className="ml-1 text-amber-400 font-bold">{f.ticker}</span>
                  )}
                  {f.amount && (
                    <span className="ml-1 opacity-70">{f.amount}</span>
                  )}
                </div>
              </div>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tabular-nums text-muted-foreground hover:text-foreground shrink-0 flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <span>{fmtDate(f.filedDate)}</span>
                <span className="text-[9px]">↗</span>
              </a>
            </div>
          ))}
          {!expanded && rows.length > visible.length && (
            <div className="text-[10px] text-muted-foreground pt-1">
              {rows.length - visible.length} more — expand panel
            </div>
          )}
        </div>
      )}
    </PanelWrapper>
  )
}
