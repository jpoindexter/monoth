import { useState, useCallback } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime } from '@/lib/panel-utils'

interface Earning {
  date: string
  epsActual: number | null
  epsEstimate: number | null
  hour: string
  quarter: number
  revenueActual: number | null
  revenueEstimate: number | null
  symbol: string
  year: number
}

const STATIC_IPOS = [
  { company: 'CoreWeave', ticker: 'CRWV', date: '2026-03-28', sector: 'Cloud/AI', valuation: '$35B', status: 'priced' },
  { company: 'Databricks', ticker: 'DBR', date: '2026-Q2', sector: 'Data/AI', valuation: '$62B', status: 'expected' },
  { company: 'Stripe', ticker: 'STRP', date: '2026-Q3', sector: 'Fintech', valuation: '$91B', status: 'rumored' },
  { company: 'Discord', ticker: 'DSCD', date: '2026-H2', sector: 'Social', valuation: '$15B', status: 'rumored' },
  { company: 'Plaid', ticker: 'PLAD', date: '2026-Q4', sector: 'Fintech', valuation: '$13B', status: 'expected' },
  { company: 'Canva', ticker: 'CNVA', date: '2027', sector: 'Design/SaaS', valuation: '$26B', status: 'rumored' },
]

const STATIC_EARNINGS = [
  { company: 'Apple', ticker: 'AAPL', date: 'May 1', expected: '$1.62', time: 'AMC' },
  { company: 'Amazon', ticker: 'AMZN', date: 'May 1', expected: '$1.37', time: 'AMC' },
  { company: 'Meta', ticker: 'META', date: 'Apr 30', expected: '$5.28', time: 'AMC' },
  { company: 'Microsoft', ticker: 'MSFT', date: 'Apr 29', expected: '$3.22', time: 'AMC' },
  { company: 'Alphabet', ticker: 'GOOGL', date: 'Apr 29', expected: '$2.02', time: 'AMC' },
  { company: 'NVIDIA', ticker: 'NVDA', date: 'May 28', expected: '$0.89', time: 'AMC' },
]

function fmtRev(n: number | null): string {
  if (n == null) return '-'
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(0) + 'M'
  return '$' + n.toFixed(0)
}

function epsSurprise(actual: number | null, estimate: number | null): string | null {
  if (actual == null || estimate == null || estimate === 0) return null
  const pct = ((actual - estimate) / Math.abs(estimate)) * 100
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%'
}

const STATUS_CLS: Record<string, string> = {
  priced: 'bg-emerald-500/20 text-emerald-600',
  expected: 'bg-amber-500/20 text-amber-600',
  rumored: 'bg-zinc-500/20 text-muted-foreground',
}

const SEASON_DATA = {
  reported: 312,
  total: 500,
  beatEps: 78,
  beatRev: 62,
  avgSurprise: '+5.2%',
  bestSector: { name: 'Technology', surprise: '+8.1%' },
  worstSector: { name: 'Healthcare', surprise: '-2.3%' },
}

const CALENDAR_DATA = [
  {
    day: 'Mon Mar 10',
    today: false,
    entries: [
      { company: 'Oracle', ticker: 'ORCL', eps: '$1.61', time: 'AMC' },
      { company: 'Casey\'s General', ticker: 'CASY', eps: '$3.12', time: 'AMC' },
    ],
  },
  {
    day: 'Tue Mar 11',
    today: false,
    entries: [
      { company: 'Dick\'s Sporting', ticker: 'DKS', eps: '$3.74', time: 'BMO' },
      { company: 'Stitch Fix', ticker: 'SFIX', eps: '-$0.12', time: 'AMC' },
      { company: 'GitLab', ticker: 'GTLB', eps: '$0.22', time: 'AMC' },
    ],
  },
  {
    day: 'Wed Mar 12',
    today: false,
    entries: [
      { company: 'Dollar Tree', ticker: 'DLTR', eps: '$2.19', time: 'BMO' },
      { company: 'Adobe', ticker: 'ADBE', eps: '$4.97', time: 'AMC' },
    ],
  },
  {
    day: 'Thu Mar 13',
    today: true,
    entries: [
      { company: 'Lennar', ticker: 'LEN', eps: '$2.63', time: 'BMO' },
      { company: 'Ulta Beauty', ticker: 'ULTA', eps: '$6.56', time: 'AMC' },
      { company: 'DocuSign', ticker: 'DOCU', eps: '$0.86', time: 'AMC' },
    ],
  },
  {
    day: 'Fri Mar 14',
    today: false,
    entries: [
      { company: 'FedEx', ticker: 'FDX', eps: '$4.71', time: 'AMC' },
      { company: 'Nike', ticker: 'NKE', eps: '$0.29', time: 'AMC' },
    ],
  },
]

function seasonGrade(beatEps: number): string {
  if (beatEps > 80) return 'A+'
  if (beatEps > 75) return 'A'
  if (beatEps > 65) return 'B'
  return 'C'
}

function gradeCls(grade: string): string {
  if (grade === 'A+') return 'bg-emerald-500/20 text-emerald-600'
  if (grade === 'A') return 'bg-emerald-500/15 text-emerald-500'
  if (grade === 'B') return 'bg-amber-500/20 text-amber-600'
  return 'bg-red-500/20 text-red-500'
}

export default function IpoEarningsPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'earnings' | 'pipeline' | 'news' | 'season' | 'calendar'>('news')
  const { data: newsData, loading: newsLoading, error: newsError, refresh } = useNewsData('ipo')

  const { data: earningsData, loading: earningsLoading } = usePolling<Earning[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/market/earnings')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 600_000,
    enabled: tab === 'earnings',
  })

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const hasEarnings = earningsData && earningsData.length > 0

  return (
    <PanelWrapper title="IPOs & Earnings" loading={newsLoading && earningsLoading} error={newsError} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'earnings')} onClick={() => setTab('earnings')}>Earnings</button>
        <button className={tabCls(tab === 'pipeline')} onClick={() => setTab('pipeline')}>Pipeline</button>
        <button className={tabCls(tab === 'season')} onClick={() => setTab('season')}>Season</button>
        <button className={tabCls(tab === 'calendar')} onClick={() => setTab('calendar')}>Calendar</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'earnings' && earningsLoading && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
      )}

      {tab === 'earnings' && !earningsLoading && hasEarnings && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Symbol</th>
              <th className="text-left font-medium pb-1.5">Date</th>
              <th className="text-right font-medium pb-1.5">EPS</th>
              <th className="text-right font-medium pb-1.5">Surprise</th>
              <th className="text-right font-medium pb-1.5">Rev</th>
            </tr>
          </thead>
          <tbody>
            {earningsData!.map((e, i) => {
              const beat = e.epsActual != null && e.epsEstimate != null && e.epsActual > e.epsEstimate
              const miss = e.epsActual != null && e.epsEstimate != null && e.epsActual < e.epsEstimate
              const surprise = epsSurprise(e.epsActual, e.epsEstimate)
              return (
                <tr key={`${e.symbol}-${i}`} className="border-t border-border/20">
                  <td className="py-0.5">
                    <span className="font-medium">{e.symbol}</span>
                    <span className="text-[9px] text-muted-foreground ml-1">Q{e.quarter}</span>
                  </td>
                  <td className="py-0.5 text-muted-foreground text-[10px]">
                    {e.date}
                    {e.hour === 'bmo' && <span className="ml-0.5 text-[9px] bg-zinc-500/15 px-1 py-px rounded-sm">BMO</span>}
                    {e.hour === 'amc' && <span className="ml-0.5 text-[9px] bg-zinc-500/15 px-1 py-px rounded-sm">AMC</span>}
                  </td>
                  <td className={`text-right tabular-nums font-medium ${beat ? 'text-emerald-600' : miss ? 'text-red-500' : ''}`}>
                    {e.epsActual != null ? e.epsActual.toFixed(2) : e.epsEstimate != null ? `(${e.epsEstimate.toFixed(2)})` : '-'}
                  </td>
                  <td className={`text-right tabular-nums text-[10px] ${beat ? 'text-emerald-600' : miss ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {surprise ?? '-'}
                  </td>
                  <td className="text-right tabular-nums text-muted-foreground">
                    {fmtRev(e.revenueActual ?? e.revenueEstimate)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'earnings' && !earningsLoading && !hasEarnings && (
        <div className="space-y-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Upcoming</p>
          {STATIC_EARNINGS.map((e) => (
            <div key={e.ticker} className={`flex items-center gap-2 border-b border-border/20 last:border-0 ${expanded ? 'py-1.5' : 'py-1'}`}>
              <div className="flex-1 min-w-0">
                <span className={`font-medium ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>{e.company}</span>
                <span className={`text-muted-foreground ml-1 ${expanded ? 'text-[11px]' : 'text-[10px]'}`}>{e.ticker}</span>
              </div>
              <span className={`text-muted-foreground ${expanded ? 'text-[11px]' : 'text-[10px]'}`}>{e.date}</span>
              {expanded && <span className="text-[10px] text-muted-foreground">EPS est.</span>}
              <span className={`tabular-nums text-muted-foreground ${expanded ? 'text-[12px] font-medium' : 'text-[10px]'}`}>{e.expected}</span>
              <span className={`font-bold uppercase bg-zinc-500/15 text-muted-foreground px-1 py-px rounded-sm ${expanded ? 'text-[10px]' : 'text-[9px]'}`}>{e.time}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'pipeline' && (
        <div className="space-y-0">
          {STATIC_IPOS.map((ipo) => (
            <div key={ipo.ticker} className={`border-b border-border/20 last:border-0 ${expanded ? 'py-2' : 'py-1.5'}`}>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <span className={`font-medium ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>{ipo.company}</span>
                  <span className={`text-muted-foreground ml-1 ${expanded ? 'text-[11px]' : 'text-[10px]'}`}>{ipo.ticker}</span>
                </div>
                <span className={`bg-zinc-500/15 text-muted-foreground px-1 py-px rounded-sm ${expanded ? 'text-[10px]' : 'text-[10px]'}`}>{ipo.sector}</span>
                <span className={`tabular-nums font-medium ${expanded ? 'text-[12px]' : 'text-[10px] text-muted-foreground'}`}>{ipo.valuation}</span>
                <span className={`text-muted-foreground ${expanded ? 'text-[11px]' : 'text-[10px]'}`}>{ipo.date}</span>
                <span className={`font-bold uppercase px-1 py-px rounded-sm ${expanded ? 'text-[10px]' : 'text-[9px]'} ${STATUS_CLS[ipo.status]}`}>{ipo.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'season' && (() => {
        const grade = seasonGrade(SEASON_DATA.beatEps)
        const progressPct = Math.round((SEASON_DATA.reported / SEASON_DATA.total) * 100)
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Season Grade</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-sm ${gradeCls(grade)}`}>{grade}</span>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Season Progress</span>
                <span className="tabular-nums">{SEASON_DATA.reported} / {SEASON_DATA.total}</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div className="h-full bg-foreground rounded-full" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>EPS Beat Rate</span>
                <span className="tabular-nums">{SEASON_DATA.beatEps}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-red-400/40 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${SEASON_DATA.beatEps}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Revenue Beat Rate</span>
                <span className="tabular-nums">{SEASON_DATA.beatRev}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-red-400/40 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${SEASON_DATA.beatRev}%` }} />
              </div>
            </div>

            <div className="border-t border-border/20 pt-2 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Avg EPS Surprise</span>
                <span className="tabular-nums font-medium text-emerald-600">{SEASON_DATA.avgSurprise}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Best Sector</span>
                <span className="text-right">
                  <span className="font-medium">{SEASON_DATA.bestSector.name}</span>
                  <span className="tabular-nums text-emerald-600 ml-1">{SEASON_DATA.bestSector.surprise}</span>
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Worst Sector</span>
                <span className="text-right">
                  <span className="font-medium">{SEASON_DATA.worstSector.name}</span>
                  <span className="tabular-nums text-red-500 ml-1">{SEASON_DATA.worstSector.surprise}</span>
                </span>
              </div>
            </div>
          </div>
        )
      })()}

      {tab === 'calendar' && (
        <div className="space-y-0">
          {CALENDAR_DATA.map((day) => (
            <div key={day.day}>
              <div className={`uppercase tracking-wider py-1 mt-1 font-medium ${day.today ? 'text-foreground' : 'text-muted-foreground'} ${expanded ? 'text-[11px]' : 'text-[10px]'}`}>
                {day.day}{day.today && <span className="ml-1 bg-foreground text-background text-[9px] px-1 py-px rounded-sm">Today</span>}
              </div>
              {day.entries.map((e) => (
                <div
                  key={e.ticker}
                  className={`flex items-center gap-2 border-b border-border/20 last:border-0 ${day.today ? 'bg-zinc-100/60 dark:bg-zinc-800/40 -mx-1 px-1 rounded-sm' : ''} ${expanded ? 'py-1.5' : 'py-1'}`}
                >
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>{e.company}</span>
                    <span className={`text-muted-foreground ml-1 ${expanded ? 'text-[11px]' : 'text-[10px]'}`}>{e.ticker}</span>
                  </div>
                  {expanded && <span className="text-[10px] text-muted-foreground">EPS</span>}
                  <span className={`tabular-nums text-muted-foreground ${expanded ? 'text-[12px] font-medium' : 'text-[10px]'}`}>{e.eps}</span>
                  <span className={`font-bold uppercase px-1 py-px rounded-sm ${expanded ? 'text-[10px]' : 'text-[9px]'} ${e.time === 'BMO' ? 'bg-amber-500/20 text-amber-600' : 'bg-zinc-500/15 text-muted-foreground'}`}>{e.time}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'news' && (
        <div className="space-y-0">
          {newsData?.map((item) => {
            const cls = classifyHeadline(item.title)
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-1 px-1 rounded-sm transition-colors"
              >
                <div className="flex-1 min-w-0">
                  {cls && (
                    <span
                      className="inline-block text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                      style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}
                    >
                      {CATEGORY_LABELS[cls.category]}
                    </span>
                  )}
                  <span className="text-[11px] font-medium leading-snug text-foreground line-clamp-2">
                    {item.title}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                  {relTime(item.published)}
                </span>
              </a>
            )
          })}
        </div>
      )}
    </PanelWrapper>
  )
}
