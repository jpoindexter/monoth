import { useState, useCallback, useEffect } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'

interface MacroSignal {
  name: string
  value: number
  label: string
  status: 'bullish' | 'bearish' | 'neutral'
  detail: string
}

const STATUS_COLORS: Record<string, string> = {
  bullish: 'text-emerald-600',
  bearish: 'text-red-500',
  neutral: 'text-muted-foreground',
}

const CENTRAL_BANKS = [
  { name: 'Fed (US)', rate: 4.50, prev: 4.75, currency: 'USD', next: 'Jun 18' },
  { name: 'ECB (EU)', rate: 2.65, prev: 2.90, currency: 'EUR', next: 'Jun 5' },
  { name: 'BoE (UK)', rate: 4.50, prev: 4.75, currency: 'GBP', next: 'Jun 19' },
  { name: 'BoJ (Japan)', rate: 0.50, prev: 0.25, currency: 'JPY', next: 'Jun 13' },
  { name: 'PBoC (China)', rate: 3.10, prev: 3.10, currency: 'CNY', next: 'Jun 20' },
  { name: 'RBA (Australia)', rate: 4.10, prev: 4.35, currency: 'AUD', next: 'Jun 24' },
  { name: 'BoC (Canada)', rate: 2.75, prev: 3.00, currency: 'CAD', next: 'Jun 4' },
  { name: 'SNB (Swiss)', rate: 0.25, prev: 0.50, currency: 'CHF', next: 'Jun 19' },
]

const CURRENCY_BADGE: Record<string, string> = {
  USD: 'US', EUR: 'EU', GBP: 'UK', JPY: 'JP', CNY: 'CN', AUD: 'AU', CAD: 'CA', CHF: 'CH',
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  const year = now.getFullYear()
  const target = new Date(`${dateStr} ${year}`)
  if (target < now) target.setFullYear(year + 1)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

function direction(rate: number, prev: number): 'cut' | 'hold' | 'hike' {
  if (rate < prev) return 'cut'
  if (rate > prev) return 'hike'
  return 'hold'
}

function Arrow({ dir }: { dir: 'cut' | 'hold' | 'hike' }) {
  if (dir === 'cut') return <span className="text-emerald-500">↓</span>
  if (dir === 'hike') return <span className="text-red-500">↑</span>
  return <span className="text-muted-foreground">→</span>
}

function ActionBadge({ dir }: { dir: 'cut' | 'hold' | 'hike' }) {
  const cls =
    dir === 'cut'
      ? 'bg-emerald-500/20 text-emerald-600'
      : dir === 'hike'
      ? 'bg-red-500/20 text-red-500'
      : 'bg-muted text-muted-foreground'
  return (
    <span className={`text-[8px] font-bold uppercase px-1 py-px rounded-sm ${cls}`}>
      {dir}
    </span>
  )
}

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function CentralBanksPanel() {
  const [tab, setTab] = useState<'signals' | 'news' | 'rates' | 'calendar'>('signals')
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

  useEffect(() => {
    if (!sigLoading && signals != null && !signals.length && tab === 'signals') {
      setTab('news')
    }
  }, [sigLoading, signals, tab])

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const maxRate = Math.max(...CENTRAL_BANKS.map((b) => b.rate))

  const sortedByDate = [...CENTRAL_BANKS].sort((a, b) => daysUntil(a.next) - daysUntil(b.next))

  return (
    <PanelWrapper title="Central Bank Watch" loading={newsLoading && sigLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'signals')} onClick={() => setTab('signals')}>Signals</button>
        <button className={tabCls(tab === 'rates')} onClick={() => setTab('rates')}>Rates</button>
        <button className={tabCls(tab === 'calendar')} onClick={() => setTab('calendar')}>Calendar</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'signals' && (
        <div className="space-y-1.5">
          {signals?.map((s) => (
            <div key={s.name} className="flex items-center justify-between py-0.5 border-b border-border/20 last:border-0">
              <div>
                <span className="text-[11px] font-medium">{s.name}</span>
                <span className="text-[10px] text-muted-foreground ml-1.5">{s.detail}</span>
              </div>
              <span className={`text-[10px] font-medium uppercase tracking-wider ${STATUS_COLORS[s.status]}`}>
                {s.label}
              </span>
            </div>
          ))}
          {!signals?.length && !sigLoading && (
            <div className="py-4 text-center text-[10px] text-muted-foreground">
              No data available. Refreshes automatically.
            </div>
          )}
        </div>
      )}

      {tab === 'rates' && (
        <div className="space-y-2">
          {CENTRAL_BANKS.map((bank) => {
            const dir = direction(bank.rate, bank.prev)
            const barPct = (bank.rate / maxRate) * 100
            const days = daysUntil(bank.next)
            return (
              <div key={bank.name} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-bold bg-foreground/10 text-foreground px-1 py-px rounded-sm tabular-nums">
                      {CURRENCY_BADGE[bank.currency]}
                    </span>
                    <span className="text-[11px] font-medium">{bank.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] tabular-nums font-bold">{bank.rate.toFixed(2)}%</span>
                    <Arrow dir={dir} />
                    <span className="text-[9px] text-muted-foreground tabular-nums">{bank.next} ({days}d)</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-foreground/10 w-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dir === 'cut' ? 'bg-emerald-500' : dir === 'hike' ? 'bg-red-500' : 'bg-foreground/40'
                    }`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'calendar' && (
        <div className="space-y-0">
          {sortedByDate.map((bank) => {
            const dir = direction(bank.rate, bank.prev)
            const days = daysUntil(bank.next)
            return (
              <div
                key={bank.name}
                className="flex items-center justify-between py-1 border-b border-border/20 last:border-0"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] tabular-nums font-medium text-muted-foreground w-12 shrink-0">{bank.next}</span>
                  <span className="text-[11px] font-medium">{bank.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-muted-foreground tabular-nums">{days}d</span>
                  <ActionBadge dir={dir} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'news' && (
        <div className="space-y-0">
          {newsData?.map((item) => {
            const cls = classifyHeadline(item.title)
            return (
              <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-1 px-1 rounded-sm transition-colors">
                <div className="flex-1 min-w-0">
                  {cls && (
                    <span className="inline-block text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                      style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}>
                      {CATEGORY_LABELS[cls.category]}
                    </span>
                  )}
                  <span className="text-[11px] font-medium leading-snug text-foreground line-clamp-2">{item.title}</span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">{relTime(item.published)}</span>
              </a>
            )
          })}
        </div>
      )}
    </PanelWrapper>
  )
}
