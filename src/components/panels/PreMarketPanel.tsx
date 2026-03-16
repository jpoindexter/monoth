import { useState, useCallback } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { tabCls, fmt } from '@/lib/panel-utils'

type Tab = 'pre' | 'post'

interface PreMarketEntry {
  symbol: string
  regularPrice: number
  preMarketPrice: number | null
  preMarketChange: number | null
  preMarketChangePct: number | null
  postMarketPrice: number | null
  postMarketChange: number | null
  postMarketChangePct: number | null
}

function etTime(): string {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York', hour12: false })
}

function PctCell({ val }: { val: number | null }) {
  if (val === null) return <span className="text-muted-foreground">—</span>
  const cls = val >= 0 ? 'text-emerald-400' : 'text-red-400'
  return <span className={`tabular-nums ${cls}`}>{val >= 0 ? '+' : ''}{fmt(val, 2)}%</span>
}

function MarketTable({ rows, mode }: { rows: PreMarketEntry[]; mode: 'pre' | 'post' }) {
  const sorted = [...rows].sort((a, b) => {
    const ap = mode === 'pre' ? Math.abs(a.preMarketChangePct ?? 0) : Math.abs(a.postMarketChangePct ?? 0)
    const bp = mode === 'pre' ? Math.abs(b.preMarketChangePct ?? 0) : Math.abs(b.postMarketChangePct ?? 0)
    return bp - ap
  })

  return (
    <div>
      <div className="grid grid-cols-4 gap-x-2 pb-1 border-b border-border/20">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Symbol</span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground text-right">Last</span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground text-right">
          {mode === 'pre' ? 'Pre $' : 'Post $'}
        </span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground text-right">
          {mode === 'pre' ? 'Pre %' : 'Post %'}
        </span>
      </div>
      <div className="space-y-0">
        {sorted.map((row) => {
          const extPrice = mode === 'pre' ? row.preMarketPrice : row.postMarketPrice
          const extPct = mode === 'pre' ? row.preMarketChangePct : row.postMarketChangePct
          return (
            <div key={row.symbol} className="grid grid-cols-4 gap-x-2 py-0.5 border-b border-border/10 hover:bg-muted/30 rounded-sm">
              <span className="text-[11px] font-bold text-foreground tabular-nums">{row.symbol}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums text-right">{fmt(row.regularPrice)}</span>
              <span className="text-[10px] text-foreground tabular-nums text-right">
                {extPrice !== null ? fmt(extPrice) : <span className="text-muted-foreground">—</span>}
              </span>
              <span className="text-[10px] text-right">
                <PctCell val={extPct} />
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PreMarketPanel() {
  const [tab, setTab] = useState<Tab>('pre')

  const fetcher = useCallback(async (): Promise<PreMarketEntry[]> => {
    const res = await fetch('/api/market/premarket')
    if (!res.ok) throw new Error('premarket API error')
    return res.json()
  }, [])

  const { data, loading, error, refresh } = usePolling<PreMarketEntry[]>({
    fetcher,
    interval: 60_000,
  })

  const rows = data ?? []

  const badge = tab === 'pre'
    ? <span className="text-[8px] font-bold px-1 py-0.5 rounded-sm bg-amber-500/20 text-amber-400">PRE-MARKET</span>
    : <span className="text-[8px] font-bold px-1 py-0.5 rounded-sm bg-violet-500/20 text-violet-400">AFTER-HOURS</span>

  return (
    <PanelWrapper
      title="Pre/Post Market"
      loading={loading}
      error={error}
      onRetry={refresh}
      headerActions={badge}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          <button className={tabCls(tab === 'pre')} onClick={() => setTab('pre')}>Pre-Market</button>
          <button className={tabCls(tab === 'post')} onClick={() => setTab('post')}>After-Hours</button>
        </div>
        <span className="text-[9px] text-muted-foreground/60">As of {etTime()} ET</span>
      </div>
      {rows.length > 0 && <MarketTable rows={rows} mode={tab} />}
    </PanelWrapper>
  )
}
