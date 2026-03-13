import { useState } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'

type Action = 'Upgrade' | 'Downgrade' | 'Initiate' | 'Reiterate'

interface RatingEntry {
  ticker: string
  firm: string
  firmShort: string
  fromRating: string
  toRating: string
  priceTarget: number
  prevTarget: number
  action: Action
  date: string // YYYY-MM-DD
}

type Tab = 'upgrades' | 'downgrades' | 'targets'

// Seeded deterministic daily data
function seedRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

const TICKERS = ['AAPL','MSFT','NVDA','META','GOOGL','AMZN','TSLA','JPM','V','BAC','XOM','JNJ','WMT','UNH','AMD','NFLX','DIS','PYPL','SHOP','SQ']

const FIRMS: { name: string; short: string }[] = [
  { name: 'Goldman Sachs', short: 'GS' },
  { name: 'Morgan Stanley', short: 'MS' },
  { name: 'JPMorgan', short: 'JPM' },
  { name: 'Bank of America', short: 'BofA' },
  { name: 'Citigroup', short: 'Citi' },
  { name: 'UBS', short: 'UBS' },
  { name: 'Barclays', short: 'Barc' },
  { name: 'Wells Fargo', short: 'WF' },
  { name: 'Deutsche Bank', short: 'DB' },
  { name: 'Piper Sandler', short: 'Piper' },
  { name: 'Jefferies', short: 'Jeff' },
  { name: 'Raymond James', short: 'RJ' },
]

const RATINGS = ['Strong Buy', 'Buy', 'Outperform', 'Hold', 'Neutral', 'Underperform', 'Sell']
const RATING_RANK: Record<string, number> = {
  'Strong Buy': 6, 'Buy': 5, 'Outperform': 4, 'Hold': 3, 'Neutral': 3, 'Underperform': 2, 'Sell': 1,
}

function buildMockData(): RatingEntry[] {
  // Re-seed daily so data changes each day but stays stable within a day
  const today = new Date()
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const rng = seedRand(daySeed)

  const basePrices: Record<string, number> = {
    AAPL: 185, MSFT: 415, NVDA: 875, META: 520, GOOGL: 175, AMZN: 195, TSLA: 215,
    JPM: 198, V: 275, BAC: 38, XOM: 110, JNJ: 155, WMT: 175, UNH: 520,
    AMD: 165, NFLX: 625, DIS: 112, PYPL: 65, SHOP: 78, SQ: 72,
  }

  const entries: RatingEntry[] = []

  for (let i = 0; i < TICKERS.length; i++) {
    const ticker = TICKERS[i]
    const firm = FIRMS[Math.floor(rng() * FIRMS.length)]
    const base = basePrices[ticker] ?? 100
    const prevTarget = +(base * (0.85 + rng() * 0.3)).toFixed(0)
    const ptMove = (rng() - 0.45) * 0.25
    const priceTarget = +(prevTarget * (1 + ptMove)).toFixed(0)

    // Pick from/to ratings
    const fromIdx = Math.floor(rng() * RATINGS.length)
    let toIdx = Math.floor(rng() * RATINGS.length)
    while (toIdx === fromIdx) toIdx = Math.floor(rng() * RATINGS.length)
    const fromRating = RATINGS[fromIdx]
    const toRating = RATINGS[toIdx]

    const fromRank = RATING_RANK[fromRating] ?? 3
    const toRank = RATING_RANK[toRating] ?? 3

    let action: Action
    if (fromRank < toRank) action = 'Upgrade'
    else if (fromRank > toRank) action = 'Downgrade'
    else if (rng() > 0.5) action = 'Initiate'
    else action = 'Reiterate'

    // Date: within last 5 trading days
    const d = new Date(today)
    d.setDate(d.getDate() - Math.floor(rng() * 5))
    // Skip weekends
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1)
    const dateStr = d.toISOString().slice(0, 10)

    entries.push({ ticker, firm: firm.name, firmShort: firm.short, fromRating, toRating, priceTarget, prevTarget, action, date: dateStr })
  }

  return entries
}

const MOCK_DATA = buildMockData()

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
}

function ratingColor(rating: string) {
  const rank = RATING_RANK[rating] ?? 3
  if (rank >= 5) return 'text-emerald-500'
  if (rank === 4) return 'text-emerald-400'
  if (rank === 3) return 'text-muted-foreground'
  if (rank === 2) return 'text-amber-400'
  return 'text-red-500'
}

function ptChangePct(pt: number, prev: number) {
  if (prev === 0) return 0
  return ((pt - prev) / prev) * 100
}

function UpgradesTab({ entries, expanded }: { entries: RatingEntry[]; expanded: boolean }) {
  const rows = entries.filter((e) => e.action === 'Upgrade' || e.action === 'Initiate')
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 pb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[44px]">Ticker</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex-1">Firm</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-right w-[80px]">Change</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums text-right w-[34px]">PT</span>
      </div>
      {rows.map((e, i) => {
        const tag = e.action === 'Initiate' ? 'INIT' : 'UP'
        return (
          <div key={i} className="flex items-center gap-1.5 border-t border-border/15 pt-1">
            <span className="text-[11px] font-bold text-foreground w-[44px] shrink-0 tabular-nums">{e.ticker}</span>
            <span className={`text-[10px] flex-1 truncate ${expanded ? '' : 'max-w-[90px]'}`}>
              {expanded ? e.firm : e.firmShort}
            </span>
            <span className="text-[10px] text-right w-[80px] shrink-0 tabular-nums">
              <span className={ratingColor(e.fromRating)}>{e.fromRating.replace('Outperform','Outperf')}</span>
              <span className="text-muted-foreground/50"> → </span>
              <span className="text-emerald-500 font-medium">{e.toRating.replace('Outperform','Outperf')}</span>
            </span>
            <span className="text-[10px] tabular-nums text-foreground text-right w-[34px] shrink-0">${e.priceTarget}</span>
          </div>
        )
      })}
    </div>
  )
}

function DowngradesTab({ entries, expanded }: { entries: RatingEntry[]; expanded: boolean }) {
  const rows = entries.filter((e) => e.action === 'Downgrade')
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 pb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[44px]">Ticker</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex-1">Firm</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-right w-[80px]">Change</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums text-right w-[34px]">PT</span>
      </div>
      {rows.length === 0 && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">No downgrades today.</div>
      )}
      {rows.map((e, i) => (
        <div key={i} className="flex items-center gap-1.5 border-t border-border/15 pt-1">
          <span className="text-[11px] font-bold text-foreground w-[44px] shrink-0 tabular-nums">{e.ticker}</span>
          <span className={`text-[10px] flex-1 truncate ${expanded ? '' : 'max-w-[90px]'}`}>
            {expanded ? e.firm : e.firmShort}
          </span>
          <span className="text-[10px] text-right w-[80px] shrink-0 tabular-nums">
            <span className={ratingColor(e.fromRating)}>{e.fromRating.replace('Outperform','Outperf')}</span>
            <span className="text-muted-foreground/50"> → </span>
            <span className="text-red-500 font-medium">{e.toRating.replace('Outperform','Outperf')}</span>
          </span>
          <span className="text-[10px] tabular-nums text-foreground text-right w-[34px] shrink-0">${e.priceTarget}</span>
        </div>
      ))}
    </div>
  )
}

function TargetsTab({ entries, expanded }: { entries: RatingEntry[]; expanded: boolean }) {
  const rows = [...entries]
    .filter((e) => e.priceTarget !== e.prevTarget)
    .sort((a, b) => Math.abs(ptChangePct(b.priceTarget, b.prevTarget)) - Math.abs(ptChangePct(a.priceTarget, a.prevTarget)))

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 pb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[44px]">Ticker</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex-1">Firm</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-right w-[80px]">Old → New</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-right w-[36px]">Chg</span>
      </div>
      {rows.map((e, i) => {
        const chg = ptChangePct(e.priceTarget, e.prevTarget)
        const chgCls = chg >= 0 ? 'text-emerald-500' : 'text-red-500'
        const arrow = chg >= 0 ? '↑' : '↓'
        return (
          <div key={i} className="flex items-center gap-1.5 border-t border-border/15 pt-1">
            <span className="text-[11px] font-bold text-foreground w-[44px] shrink-0 tabular-nums">{e.ticker}</span>
            <span className={`text-[10px] flex-1 truncate ${expanded ? '' : 'max-w-[80px]'}`}>
              {expanded ? e.firm : e.firmShort}
            </span>
            <span className="text-[10px] text-right w-[80px] shrink-0 tabular-nums text-muted-foreground">
              ${e.prevTarget}
              <span className="text-muted-foreground/50"> → </span>
              <span className="text-foreground">${e.priceTarget}</span>
            </span>
            <span className={`text-[10px] font-bold text-right w-[36px] shrink-0 tabular-nums ${chgCls}`}>
              {arrow}{Math.abs(chg).toFixed(1)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function AnalystRatingsPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('upgrades')

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Analyst Ratings">
      <div className="mb-1.5 px-1.5 py-0.5 rounded-sm bg-yellow-500/10 border border-yellow-500/20">
        <span className="text-[9px] text-yellow-500/80 uppercase tracking-wider">Simulated data · not real ratings</span>
      </div>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'upgrades')} onClick={() => setTab('upgrades')}>Upgrades</button>
        <button className={tabCls(tab === 'downgrades')} onClick={() => setTab('downgrades')}>Downgrades</button>
        <button className={tabCls(tab === 'targets')} onClick={() => setTab('targets')}>Targets</button>
      </div>

      {tab === 'upgrades' && <UpgradesTab entries={MOCK_DATA} expanded={expanded} />}
      {tab === 'downgrades' && <DowngradesTab entries={MOCK_DATA} expanded={expanded} />}
      {tab === 'targets' && <TargetsTab entries={MOCK_DATA} expanded={expanded} />}
    </PanelWrapper>
  )
}
