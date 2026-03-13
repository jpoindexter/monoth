import { useState, useMemo } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'

type Tab = 'unusual' | 'putscalls' | 'expiry'

interface FlowEntry {
  ticker: string
  type: 'CALL' | 'PUT'
  strike: number
  expiry: string
  expiryDate: Date
  premium: number
  sentiment: 'Bullish' | 'Bearish' | 'Neutral'
  size: 'Sweep' | 'Block' | 'Split'
  time: string
}

const TICKERS = ['AAPL', 'NVDA', 'SPY', 'QQQ', 'TSLA', 'META', 'MSFT', 'AMZN', 'AMD', 'GOOGL', 'NFLX', 'CRM', 'PLTR', 'ARM', 'SMCI']

const BASE_PRICES: Record<string, number> = {
  AAPL: 228, NVDA: 875, SPY: 562, QQQ: 490, TSLA: 245,
  META: 585, MSFT: 415, AMZN: 225, AMD: 168, GOOGL: 195,
  NFLX: 935, CRM: 295, PLTR: 78, ARM: 148, SMCI: 42,
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SIZES: FlowEntry['size'][] = ['Sweep', 'Block', 'Split']
const TIMES = ['9:32 AM', '9:47 AM', '10:12 AM', '10:31 AM', '10:58 AM', '11:14 AM', '11:43 AM', '12:02 PM', '12:38 PM', '1:05 PM', '1:29 PM', '2:11 PM', '2:44 PM', '3:07 PM', '3:31 PM', '3:48 PM', '3:58 PM']

function seededRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function hashStr(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return Math.abs(h)
}

function fmtPremium(val: number): string {
  if (val >= 1_000_000) return '$' + (val / 1_000_000).toFixed(2) + 'M'
  return '$' + (val / 1_000).toFixed(0) + 'K'
}

function generateFlows(): FlowEntry[] {
  const seed = new Date().toDateString() + 'options-flow'
  const rng = seededRng(hashStr(seed))
  const now = new Date()
  const entries: FlowEntry[] = []

  for (let i = 0; i < 20; i++) {
    const ticker = TICKERS[Math.floor(rng() * TICKERS.length)]
    const base = BASE_PRICES[ticker]
    const type: 'CALL' | 'PUT' = rng() < 0.55 ? 'CALL' : 'PUT'
    const strikePct = 0.85 + rng() * 0.30
    const strikeRaw = base * strikePct
    const strikeStep = base > 200 ? 5 : base > 50 ? 2.5 : 1
    const strike = Math.round(strikeRaw / strikeStep) * strikeStep
    const daysOut = Math.floor(rng() * 90) + 1
    const expiryDate = new Date(now)
    expiryDate.setDate(expiryDate.getDate() + daysOut)
    const expiry = MONTHS[expiryDate.getMonth()] + ' ' + expiryDate.getDate()
    const premium = Math.floor(50_000 + rng() * 4_950_000)
    const sizeRoll = rng()
    const size: FlowEntry['size'] = sizeRoll < 0.4 ? 'Sweep' : sizeRoll < 0.75 ? 'Block' : 'Split'
    const sentRoll = rng()
    let sentiment: FlowEntry['sentiment']
    if (type === 'CALL') sentiment = sentRoll < 0.65 ? 'Bullish' : sentRoll < 0.85 ? 'Neutral' : 'Bearish'
    else sentiment = sentRoll < 0.65 ? 'Bearish' : sentRoll < 0.85 ? 'Neutral' : 'Bullish'
    const time = TIMES[Math.floor(rng() * TIMES.length)]

    entries.push({ ticker, type, strike, expiry, expiryDate, premium, sentiment, size, time })
  }

  return entries.sort((a, b) => b.premium - a.premium)
}

function groupByExpiry(flows: FlowEntry[]) {
  const now = new Date()
  const endOfWeek = new Date(now); endOfWeek.setDate(now.getDate() + (5 - now.getDay()))
  const endOfNextWeek = new Date(endOfWeek); endOfNextWeek.setDate(endOfWeek.getDate() + 7)

  const groups: Record<string, { label: string; flows: FlowEntry[]; total: number }> = {
    thisWeek: { label: 'This Week', flows: [], total: 0 },
    nextWeek: { label: 'Next Week', flows: [], total: 0 },
    monthly: { label: 'Monthly', flows: [], total: 0 },
  }

  for (const f of flows) {
    const key = f.expiryDate <= endOfWeek ? 'thisWeek' : f.expiryDate <= endOfNextWeek ? 'nextWeek' : 'monthly'
    groups[key].flows.push(f)
    groups[key].total += f.premium
  }

  return Object.values(groups)
}

const tabCls = (active: boolean) =>
  `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

const sentimentColor = (s: FlowEntry['sentiment']) =>
  s === 'Bullish' ? 'text-emerald-500' : s === 'Bearish' ? 'text-red-500' : 'text-yellow-500'

const typeBadge = (t: 'CALL' | 'PUT') =>
  t === 'CALL'
    ? 'bg-emerald-500/20 text-emerald-500'
    : 'bg-red-500/20 text-red-500'

const sizeBadge = (s: FlowEntry['size']) =>
  s === 'Sweep' ? 'bg-purple-500/20 text-purple-400' : s === 'Block' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-500/20 text-zinc-400'

export default function OptionsFlowPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('unusual')
  const flows = useMemo(() => generateFlows(), [])

  const topCalls = useMemo(() => flows.filter(f => f.type === 'CALL').slice(0, 5), [flows])
  const topPuts = useMemo(() => flows.filter(f => f.type === 'PUT').slice(0, 5), [flows])
  const callTotal = useMemo(() => flows.filter(f => f.type === 'CALL').reduce((s, f) => s + f.premium, 0), [flows])
  const putTotal = useMemo(() => flows.filter(f => f.type === 'PUT').reduce((s, f) => s + f.premium, 0), [flows])
  const pcRatio = putTotal / (callTotal || 1)
  const expiryGroups = useMemo(() => groupByExpiry(flows), [flows])

  const visible = expanded ? flows : flows.slice(0, 12)

  return (
    <PanelWrapper title="Options Flow">
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'unusual')} onClick={() => setTab('unusual')}>Unusual</button>
        <button className={tabCls(tab === 'putscalls')} onClick={() => setTab('putscalls')}>Puts/Calls</button>
        <button className={tabCls(tab === 'expiry')} onClick={() => setTab('expiry')}>Expiry</button>
      </div>

      {tab === 'unusual' && (
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Ticker</th>
              <th className="text-left font-medium pb-1.5">Type</th>
              <th className="text-right font-medium pb-1.5">Strike</th>
              <th className="text-right font-medium pb-1.5">Exp</th>
              <th className="text-right font-medium pb-1.5">Premium</th>
              <th className="text-right font-medium pb-1.5">Size</th>
              <th className="text-right font-medium pb-1.5">Sent</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((f, i) => (
              <tr key={i} className="border-t border-border/20">
                <td className="py-0.5 font-medium text-foreground">{f.ticker}</td>
                <td className="py-0.5">
                  <span className={`px-1 rounded-sm text-[9px] font-semibold ${typeBadge(f.type)}`}>{f.type}</span>
                </td>
                <td className="py-0.5 text-right tabular-nums">${f.strike}</td>
                <td className="py-0.5 text-right text-muted-foreground">{f.expiry}</td>
                <td className="py-0.5 text-right tabular-nums font-medium">{fmtPremium(f.premium)}</td>
                <td className="py-0.5 text-right">
                  <span className={`px-1 rounded-sm text-[9px] ${sizeBadge(f.size)}`}>{f.size}</span>
                </td>
                <td className={`py-0.5 text-right font-medium ${sentimentColor(f.sentiment)}`}>
                  {f.sentiment === 'Bullish' ? 'Bull' : f.sentiment === 'Bearish' ? 'Bear' : 'Neut'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'putscalls' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] text-muted-foreground uppercase tracking-wider">
              <span>Put/Call Ratio</span>
              <span className={`font-bold ${pcRatio > 1 ? 'text-red-500' : 'text-emerald-500'}`}>
                {pcRatio.toFixed(2)} {pcRatio > 1 ? 'Bearish' : 'Bullish'}
              </span>
            </div>
            <div className="flex h-2 w-full rounded-sm overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${(callTotal / (callTotal + putTotal)) * 100}%` }} />
              <div className="bg-red-500 h-full flex-1" />
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span className="text-emerald-500">Calls {fmtPremium(callTotal)}</span>
              <span className="text-red-500">Puts {fmtPremium(putTotal)}</span>
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Top Calls</div>
            {topCalls.map((f, i) => (
              <div key={i} className="flex justify-between items-center border-t border-border/20 py-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground text-[10px]">{f.ticker}</span>
                  <span className="text-muted-foreground text-[9px]">${f.strike} {f.expiry}</span>
                </div>
                <span className="tabular-nums text-[10px] text-emerald-500">{fmtPremium(f.premium)}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Top Puts</div>
            {topPuts.map((f, i) => (
              <div key={i} className="flex justify-between items-center border-t border-border/20 py-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground text-[10px]">{f.ticker}</span>
                  <span className="text-muted-foreground text-[9px]">${f.strike} {f.expiry}</span>
                </div>
                <span className="tabular-nums text-[10px] text-red-500">{fmtPremium(f.premium)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'expiry' && (
        <div className="space-y-3">
          {expiryGroups.map((g) => (
            <div key={g.label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{g.label}</span>
                <span className="text-[10px] font-semibold tabular-nums">{fmtPremium(g.total)}</span>
              </div>
              {g.flows.length === 0 ? (
                <div className="text-[9px] text-muted-foreground">No flow</div>
              ) : (
                g.flows.slice(0, expanded ? undefined : 4).map((f, i) => (
                  <div key={i} className="flex justify-between items-center border-t border-border/20 py-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1 rounded-sm text-[9px] font-semibold ${typeBadge(f.type)}`}>{f.type}</span>
                      <span className="font-medium text-foreground text-[10px]">{f.ticker}</span>
                      <span className="text-muted-foreground text-[9px]">${f.strike}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[9px]">{f.expiry}</span>
                      <span className="tabular-nums text-[10px]">{fmtPremium(f.premium)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </PanelWrapper>
  )
}
