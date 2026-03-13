import { useState, useCallback, useEffect } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime } from '@/lib/panel-utils'

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
    <span className={`text-[9px] font-bold uppercase px-1 py-px rounded-sm ${cls}`}>
      {dir}
    </span>
  )
}

const CURRENT_FED_RATE = 4.50

const DOT_PLOT_DATA: { rate: number; members: number }[] = [
  { rate: 3.25, members: 1 },
  { rate: 3.50, members: 2 },
  { rate: 3.75, members: 4 },
  { rate: 4.00, members: 5 },
  { rate: 4.25, members: 4 },
  { rate: 4.50, members: 3 },
]

const DOT_PLOT_MEDIAN = (() => {
  const flat: number[] = []
  for (const d of DOT_PLOT_DATA) {
    for (let i = 0; i < d.members; i++) flat.push(d.rate)
  }
  flat.sort((a, b) => a - b)
  const mid = Math.floor(flat.length / 2)
  return flat.length % 2 === 0 ? (flat[mid - 1]! + flat[mid]!) / 2 : flat[mid]!
})() as number

const BALANCE_SHEETS = [
  { name: 'Fed', currency: 'USD', current: 7.4, peak: 8.9, unit: 'T', usdEq: 7.4, qtPace: 'STEADY' as const },
  { name: 'ECB', currency: 'EUR', current: 6.8, peak: 8.8, unit: 'T', usdEq: 7.3, qtPace: 'ACCELERATING' as const },
  { name: 'BoJ', currency: 'JPY', current: 760, peak: 780, unit: 'T', usdEq: 5.1, qtPace: 'SLOWING' as const },
  { name: 'BoE', currency: 'GBP', current: 850, peak: 1030, unit: 'B', usdEq: 1.1, qtPace: 'STEADY' as const },
]

const QT_PACE_COLORS: Record<'ACCELERATING' | 'STEADY' | 'SLOWING', string> = {
  ACCELERATING: 'text-red-500',
  STEADY: 'text-yellow-500',
  SLOWING: 'text-emerald-500',
}

const GLOBAL_LIQUIDITY_USD = BALANCE_SHEETS.reduce((sum, b) => sum + b.usdEq, 0)

export default function CentralBanksPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'signals' | 'news' | 'rates' | 'calendar' | 'dotplot' | 'balancesheet'>('signals')
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
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const maxRate = Math.max(...CENTRAL_BANKS.map((b) => b.rate))

  const sortedByDate = [...CENTRAL_BANKS].sort((a, b) => daysUntil(a.next) - daysUntil(b.next))

  return (
    <PanelWrapper title="Central Bank Watch" loading={newsLoading && sigLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'signals')} onClick={() => setTab('signals')}>Signals</button>
        <button className={tabCls(tab === 'rates')} onClick={() => setTab('rates')}>Rates</button>
        <button className={tabCls(tab === 'calendar')} onClick={() => setTab('calendar')}>Calendar</button>
        <button className={tabCls(tab === 'dotplot')} onClick={() => setTab('dotplot')}>Dot Plot</button>
        <button className={tabCls(tab === 'balancesheet')} onClick={() => setTab('balancesheet')}>Balance Sheet</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'signals' && (
        <div className="space-y-1.5">
          {signals?.map((s) => (
            <div key={s.name} className={`flex items-center justify-between border-b border-border/20 last:border-0 ${expanded ? 'py-1.5' : 'py-0.5'}`}>
              <div>
                <span className={`font-medium ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>{s.name}</span>
                <span className={`text-muted-foreground ml-1.5 ${expanded ? 'text-[11px] block mt-0.5' : 'text-[10px]'}`}>{s.detail}</span>
              </div>
              <span className={`font-medium uppercase tracking-wider ${expanded ? 'text-[12px]' : 'text-[10px]'} ${STATUS_COLORS[s.status]}`}>
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
            const changeBps = Math.round((bank.rate - bank.prev) * 100)
            return (
              <div key={bank.name} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold bg-foreground/10 text-foreground px-1 py-px rounded-sm tabular-nums">
                      {CURRENCY_BADGE[bank.currency]}
                    </span>
                    <span className={`font-medium ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>{bank.name}</span>
                    {expanded && <ActionBadge dir={dir} />}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`tabular-nums font-bold ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>{bank.rate.toFixed(2)}%</span>
                    <Arrow dir={dir} />
                    {expanded ? (
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground tabular-nums">{bank.next} ({days}d)</div>
                        <div className={`text-[10px] tabular-nums font-medium ${dir === 'cut' ? 'text-emerald-500' : dir === 'hike' ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {dir !== 'hold' ? `${changeBps > 0 ? '+' : ''}${changeBps}bps from ${bank.prev.toFixed(2)}%` : `Held at ${bank.prev.toFixed(2)}%`}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground tabular-nums">{bank.next} ({days}d)</span>
                    )}
                  </div>
                </div>
                <div className={`rounded-full bg-foreground/10 w-full overflow-hidden ${expanded ? 'h-3' : 'h-2'}`}>
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
                  <span className="text-[10px] tabular-nums font-medium text-muted-foreground w-12 shrink-0">{bank.next}</span>
                  <span className="text-[11px] font-medium">{bank.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground tabular-nums">{days}d</span>
                  <ActionBadge dir={dir} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'dotplot' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>19 FOMC members — end 2026 projections</span>
            <span
              className={`font-bold uppercase tracking-wider ${
                DOT_PLOT_MEDIAN <= CURRENT_FED_RATE ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {DOT_PLOT_MEDIAN <= CURRENT_FED_RATE ? 'Dovish Lean' : 'Hawkish Lean'}
            </span>
          </div>
          <div className="space-y-1.5">
            {[...DOT_PLOT_DATA].reverse().map(({ rate, members }) => {
              const isMedian = rate === DOT_PLOT_MEDIAN
              return (
                <div key={rate} className="flex items-center gap-2">
                  <span
                    className={`text-[10px] tabular-nums w-10 shrink-0 font-medium ${
                      isMedian ? 'text-amber-500' : 'text-muted-foreground'
                    }`}
                  >
                    {rate.toFixed(2)}%
                  </span>
                  <div className="flex gap-1 items-center flex-wrap">
                    {Array.from({ length: members }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-3 h-3 rounded-full border-2 ${
                          isMedian
                            ? 'bg-amber-400 border-amber-500'
                            : rate === CURRENT_FED_RATE
                            ? 'bg-sky-400/60 border-sky-500'
                            : 'bg-foreground/30 border-foreground/50'
                        }`}
                      />
                    ))}
                  </div>
                  {isMedian && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 ml-1">
                      Median
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-border/20 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>
              Range:{' '}
              <span className="text-foreground font-medium tabular-nums">
                {Math.min(...DOT_PLOT_DATA.map((d) => d.rate)).toFixed(2)}%
                {' — '}
                {Math.max(...DOT_PLOT_DATA.map((d) => d.rate)).toFixed(2)}%
              </span>
            </span>
            <span>
              Current:{' '}
              <span className="text-sky-400 font-medium tabular-nums">{CURRENT_FED_RATE.toFixed(2)}%</span>
            </span>
            <span>
              Median:{' '}
              <span className="text-amber-500 font-medium tabular-nums">{DOT_PLOT_MEDIAN.toFixed(2)}%</span>
            </span>
          </div>
        </div>
      )}

      {tab === 'balancesheet' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1 pb-1.5 border-b border-border/20">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Global Liquidity</span>
              <div className="text-[14px] font-bold tabular-nums">
                ~${GLOBAL_LIQUIDITY_USD.toFixed(1)}T
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">QT Overall</span>
              <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">Steady</span>
            </div>
          </div>
          {BALANCE_SHEETS.map((b) => {
            const pct = Math.round((b.current / b.peak) * 100)
            const reduction = pct < 100
            return (
              <div key={b.name} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold bg-foreground/10 text-foreground px-1 py-px rounded-sm">
                      {b.currency}
                    </span>
                    <span className="text-[11px] font-medium">{b.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="tabular-nums font-bold">
                      {b.currency !== 'USD' ? b.currency + ' ' : '$'}
                      {b.current}{b.unit}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      peak {b.currency !== 'USD' ? b.currency + ' ' : '$'}{b.peak}{b.unit}
                    </span>
                    <span className={`font-bold uppercase text-[9px] tracking-wider ${QT_PACE_COLORS[b.qtPace]}`}>
                      {b.qtPace}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-foreground/10 w-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      reduction ? 'bg-sky-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>QT progress: {100 - pct}% drawn down</span>
                  <span>{pct}% of peak</span>
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
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
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
