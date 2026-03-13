import { useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'

interface InsiderFiling {
  ticker: string
  issuer: string
  filerName: string
  role: string
  transactionType: string
  shares: number
  value: number | null
  filedDate: string
  url: string
}

type Tab = 'buys' | 'sells' | 'recent'

function fmtVal(n: number | null) {
  if (n == null || n === 0) return '—'
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K'
  return '$' + n
}

function fmtShares(n: number) {
  if (n === 0) return '—'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return String(n)
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
}

export default function InsiderTradingPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('recent')

  const { data, loading, error, refresh } = usePolling<InsiderFiling[]>({
    fetcher: async () => {
      const res = await fetch('/api/market/insider')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    interval: 300_000,
  })

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const buys = data?.filter((f) => f.transactionType === 'P') ?? []
  const sells = data?.filter((f) => f.transactionType === 'S') ?? []
  const rows = tab === 'buys' ? buys : tab === 'sells' ? sells : (data ?? [])
  const visible = expanded ? rows : rows.slice(0, 12)

  return (
    <PanelWrapper title="Insider Trading" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'recent')} onClick={() => setTab('recent')}>Recent</button>
        <button className={tabCls(tab === 'buys')} onClick={() => setTab('buys')}>
          Buys {buys.length > 0 && <span className="text-[9px] opacity-60 ml-0.5">({buys.length})</span>}
        </button>
        <button className={tabCls(tab === 'sells')} onClick={() => setTab('sells')}>
          Sells {sells.length > 0 && <span className="text-[9px] opacity-60 ml-0.5">({sells.length})</span>}
        </button>
      </div>

      {!loading && visible.length === 0 && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">
          {data ? 'No recent filings.' : 'Loading...'}
        </div>
      )}

      {visible.length > 0 && (
        <div className="space-y-0">
          <div className="flex items-center gap-1.5 pb-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[44px]">Ticker</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex-1">Issuer</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-right w-[40px]">Type</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-right w-[28px]">Date</span>
          </div>
          {visible.map((f, i) => {
            const isBuy = f.transactionType === 'P'
            const isSell = f.transactionType === 'S'
            const typeColor = isBuy ? 'text-emerald-500' : isSell ? 'text-red-500' : 'text-muted-foreground'
            const typeLabel = isBuy ? 'BUY' : isSell ? 'SELL' : f.transactionType
            return (
              <div key={i} className="flex items-center gap-1.5 border-t border-border/15 pt-1">
                <span className="text-[11px] font-bold text-foreground w-[44px] shrink-0 tabular-nums">
                  {f.ticker || f.issuer.slice(0, 5)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] truncate ${expanded ? '' : 'max-w-[80px]'}`}>
                    {f.filerName || f.issuer}
                  </div>
                  {expanded && f.role && <div className="text-[9px] text-muted-foreground">{f.role}</div>}
                  {expanded && f.shares > 0 && (
                    <div className="text-[9px] text-muted-foreground tabular-nums">
                      {fmtShares(f.shares)} shs{f.value ? ' · ' + fmtVal(f.value) : ''}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-bold tabular-nums text-right w-[40px] shrink-0 ${typeColor}`}>
                  {typeLabel}
                </span>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] tabular-nums text-muted-foreground text-right w-[28px] shrink-0 hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  {fmtDate(f.filedDate)}
                </a>
              </div>
            )
          })}
          {!expanded && rows.length > visible.length && (
            <div className="text-[10px] text-muted-foreground pt-1">{rows.length - visible.length} more — expand panel</div>
          )}
        </div>
      )}
    </PanelWrapper>
  )
}
