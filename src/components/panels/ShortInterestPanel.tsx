

import { useState } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'

// Seeded deterministic data — stable per calendar day
function seed(base: number): number {
  const day = Math.floor(Date.now() / 86_400_000)
  const x = Math.sin(base * 9301 + day * 49297 + 233720) * 10000
  return x - Math.floor(x)
}

function rng(base: number, min: number, max: number): number {
  return min + seed(base) * (max - min)
}

interface ShortedStock {
  ticker: string
  name: string
  shortFloat: number
  daysToCover: number
  shortShares: number
}

interface SqueezeStock {
  ticker: string
  shortFloat: number
  daysToCover: number
  priceChg5d: number
  squeezeScore: number
}

interface BorrowStock {
  ticker: string
  name: string
  borrowRate: number
  availability: 'Easy' | 'Medium' | 'Hard' | 'Impossible'
  shortFloat: number
}

const SHORT_BASE: { ticker: string; name: string }[] = [
  { ticker: 'GME', name: 'GameStop Corp' },
  { ticker: 'MSTR', name: 'MicroStrategy Inc' },
  { ticker: 'BYND', name: 'Beyond Meat' },
  { ticker: 'UPST', name: 'Upstart Holdings' },
  { ticker: 'COIN', name: 'Coinbase Global' },
  { ticker: 'RIVN', name: 'Rivian Automotive' },
  { ticker: 'HOOD', name: 'Robinhood Markets' },
  { ticker: 'CVNA', name: 'Carvana Co' },
  { ticker: 'AMC', name: 'AMC Entertainment' },
  { ticker: 'BBBY', name: 'Beyond Inc' },
  { ticker: 'SPCE', name: 'Virgin Galactic' },
  { ticker: 'WISH', name: 'ContextLogic Inc' },
  { ticker: 'NKLA', name: 'Nikola Corp' },
  { ticker: 'SOFI', name: 'SoFi Technologies' },
  { ticker: 'OPEN', name: 'Opendoor Technologies' },
]

const SHORT_STOCKS: ShortedStock[] = SHORT_BASE.map((s, i) => ({
  ticker: s.ticker,
  name: s.name,
  shortFloat: parseFloat((rng(i * 7 + 1, 15, 68)).toFixed(1)),
  daysToCover: parseFloat((rng(i * 7 + 2, 1.2, 12)).toFixed(1)),
  shortShares: parseFloat((rng(i * 7 + 3, 5, 280)).toFixed(1)),
})).sort((a, b) => b.shortFloat - a.shortFloat)

const SQUEEZE_BASE: string[] = ['GME', 'MSTR', 'UPST', 'BYND', 'COIN', 'RIVN', 'HOOD', 'CVNA', 'AMC', 'SPCE']

const SQUEEZE_STOCKS: SqueezeStock[] = SQUEEZE_BASE.map((ticker, i) => {
  const shortFloat = parseFloat((rng(i * 11 + 30, 20, 68)).toFixed(1))
  const daysToCover = parseFloat((rng(i * 11 + 31, 1.5, 12)).toFixed(1))
  const priceChg5d = parseFloat((rng(i * 11 + 32, -8, 22)).toFixed(1))
  const borrowPressure = rng(i * 11 + 33, 0, 30)
  const rawScore = shortFloat * 0.5 + daysToCover * 2 + Math.max(0, priceChg5d) * 1.5 + borrowPressure
  const squeezeScore = Math.min(99, Math.max(5, Math.round(rawScore * 0.6)))
  return { ticker, shortFloat, daysToCover, priceChg5d, squeezeScore }
}).sort((a, b) => b.squeezeScore - a.squeezeScore)

function borrowAvailability(rate: number): 'Easy' | 'Medium' | 'Hard' | 'Impossible' {
  if (rate < 5) return 'Easy'
  if (rate < 20) return 'Medium'
  if (rate < 60) return 'Hard'
  return 'Impossible'
}

const BORROW_STOCKS: BorrowStock[] = SHORT_BASE.map((s, i) => {
  const borrowRate = parseFloat((rng(i * 13 + 50, 0.5, 150)).toFixed(1))
  return {
    ticker: s.ticker,
    name: s.name,
    borrowRate,
    availability: borrowAvailability(borrowRate),
    shortFloat: parseFloat((rng(i * 7 + 1, 15, 68)).toFixed(1)),
  }
}).sort((a, b) => b.borrowRate - a.borrowRate)

function squeezeColor(score: number): string {
  if (score >= 70) return 'text-red-500'
  if (score >= 45) return 'text-orange-400'
  if (score >= 25) return 'text-yellow-500'
  return 'text-muted-foreground'
}

function squeezeBg(score: number): string {
  if (score >= 70) return 'bg-red-500/10'
  if (score >= 45) return 'bg-orange-500/10'
  if (score >= 25) return 'bg-yellow-500/10'
  return ''
}

function shortIntensityBg(pct: number): string {
  if (pct >= 50) return 'bg-red-500/20'
  if (pct >= 30) return 'bg-red-500/10'
  if (pct >= 20) return 'bg-orange-500/10'
  return 'bg-foreground/5'
}

const AVAILABILITY_COLORS: Record<string, string> = {
  Easy: 'text-emerald-500',
  Medium: 'text-yellow-500',
  Hard: 'text-orange-400',
  Impossible: 'text-red-500',
}

function MostShortedTab() {
  const expanded = useIsExpanded()
  const rows = expanded ? SHORT_STOCKS : SHORT_STOCKS.slice(0, 10)

  return (
    <div className="space-y-0.5">
      <div className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr] gap-x-1 px-1 mb-1">
        {['Ticker', 'Name', 'Short%', 'DTC', 'Shrs(M)'].map(h => (
          <div key={h} className="text-[9px] uppercase tracking-wider text-muted-foreground">{h}</div>
        ))}
      </div>
      {rows.map((s) => (
        <div key={s.ticker} className={`grid grid-cols-[2fr_3fr_1fr_1fr_1fr] gap-x-1 px-1 py-0.5 rounded-sm ${shortIntensityBg(s.shortFloat)}`}>
          <div className="text-[10px] font-bold text-foreground">{s.ticker}</div>
          <div className="text-[10px] text-muted-foreground truncate">{s.name}</div>
          <div className="text-[10px] font-bold tabular-nums text-red-400">{s.shortFloat.toFixed(1)}%</div>
          <div className="text-[10px] tabular-nums text-muted-foreground">{s.daysToCover.toFixed(1)}d</div>
          <div className="text-[10px] tabular-nums text-muted-foreground">{s.shortShares.toFixed(0)}M</div>
        </div>
      ))}
    </div>
  )
}

function SqueezeWatchTab() {
  const expanded = useIsExpanded()
  const rows = expanded ? SQUEEZE_STOCKS : SQUEEZE_STOCKS.slice(0, 8)

  return (
    <div className="space-y-0.5">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-x-1 px-1 mb-1">
        {['Ticker', 'Short%', 'DTC', '5D Chg', 'Score'].map(h => (
          <div key={h} className="text-[9px] uppercase tracking-wider text-muted-foreground">{h}</div>
        ))}
      </div>
      {rows.map((s) => (
        <div key={s.ticker} className={`grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-x-1 px-1 py-0.5 rounded-sm ${squeezeBg(s.squeezeScore)}`}>
          <div className="text-[10px] font-bold text-foreground">{s.ticker}</div>
          <div className="text-[10px] tabular-nums text-red-400">{s.shortFloat.toFixed(1)}%</div>
          <div className="text-[10px] tabular-nums text-muted-foreground">{s.daysToCover.toFixed(1)}d</div>
          <div className={`text-[10px] tabular-nums ${s.priceChg5d >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
            {s.priceChg5d >= 0 ? '+' : ''}{s.priceChg5d.toFixed(1)}%
          </div>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1.5 rounded-full bg-border/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${s.squeezeScore}%`,
                  backgroundColor: s.squeezeScore >= 70 ? '#ef4444' : s.squeezeScore >= 45 ? '#f97316' : '#eab308',
                }}
              />
            </div>
            <span className={`text-[10px] font-bold tabular-nums w-5 shrink-0 ${squeezeColor(s.squeezeScore)}`}>{s.squeezeScore}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function BorrowRatesTab() {
  const expanded = useIsExpanded()
  const rows = expanded ? BORROW_STOCKS : BORROW_STOCKS.slice(0, 10)

  return (
    <div className="space-y-0.5">
      <div className="grid grid-cols-[2fr_3fr_1fr_2fr_1fr] gap-x-1 px-1 mb-1">
        {['Ticker', 'Name', 'Rate%', 'Avail.', 'Short%'].map(h => (
          <div key={h} className="text-[9px] uppercase tracking-wider text-muted-foreground">{h}</div>
        ))}
      </div>
      {rows.map((s) => (
        <div key={s.ticker} className="grid grid-cols-[2fr_3fr_1fr_2fr_1fr] gap-x-1 px-1 py-0.5 rounded-sm hover:bg-foreground/5">
          <div className="text-[10px] font-bold text-foreground">{s.ticker}</div>
          <div className="text-[10px] text-muted-foreground truncate">{s.name}</div>
          <div className="text-[10px] font-bold tabular-nums text-orange-400">{s.borrowRate.toFixed(1)}%</div>
          <div className={`text-[10px] font-medium ${AVAILABILITY_COLORS[s.availability]}`}>{s.availability}</div>
          <div className="text-[10px] tabular-nums text-muted-foreground">{s.shortFloat.toFixed(1)}%</div>
        </div>
      ))}
    </div>
  )
}

export default function ShortInterestPanel() {
  const [tab, setTab] = useState<'shorted' | 'squeeze' | 'borrow'>('shorted')

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Short Interest">
      <div className="mb-1.5 px-1.5 py-0.5 rounded-sm bg-yellow-500/10 border border-yellow-500/20">
        <span className="text-[8px] text-yellow-500/80 uppercase tracking-wider">Simulated data · not real short data</span>
      </div>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'shorted')} onClick={() => setTab('shorted')}>Most Shorted</button>
        <button className={tabCls(tab === 'squeeze')} onClick={() => setTab('squeeze')}>Squeeze Watch</button>
        <button className={tabCls(tab === 'borrow')} onClick={() => setTab('borrow')}>Borrow Rates</button>
      </div>

      {tab === 'shorted' && <MostShortedTab />}
      {tab === 'squeeze' && <SqueezeWatchTab />}
      {tab === 'borrow' && <BorrowRatesTab />}
    </PanelWrapper>
  )
}
