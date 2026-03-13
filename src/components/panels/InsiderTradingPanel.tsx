import { useState, useMemo } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { tabCls } from '@/lib/panel-utils'

type Tab = 'buys' | 'sells' | 'recent'

interface InsiderTx {
  ticker: string
  name: string
  title: string
  transactionType: 'Buy' | 'Sell'
  shares: number
  price: number
  value: number
  date: string
  dateTs: number
  filingType: 'Form 4'
}

const TICKERS = ['AAPL', 'NVDA', 'SPY', 'TSLA', 'META', 'MSFT', 'AMZN', 'AMD', 'GOOGL', 'NFLX', 'CRM', 'PLTR', 'ARM', 'ORCL', 'INTC']

const BASE_PRICES: Record<string, number> = {
  AAPL: 228, NVDA: 875, SPY: 562, TSLA: 245, META: 585,
  MSFT: 415, AMZN: 225, AMD: 168, GOOGL: 195, NFLX: 935,
  CRM: 295, PLTR: 78, ARM: 148, ORCL: 168, INTC: 22,
}

const FIRST_NAMES = ['James', 'Jennifer', 'Robert', 'Linda', 'Michael', 'Patricia', 'William', 'Barbara', 'David', 'Susan', 'Richard', 'Jessica', 'Joseph', 'Sarah', 'Thomas']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore']
const TITLES = ['CEO', 'CFO', 'COO', 'CTO', 'Director', 'SVP', 'EVP', 'President', 'VP Finance', 'General Counsel']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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

function fmtValue(val: number): string {
  if (val >= 1_000_000) return '$' + (val / 1_000_000).toFixed(2) + 'M'
  if (val >= 1_000) return '$' + (val / 1_000).toFixed(0) + 'K'
  return '$' + val.toLocaleString()
}

function fmtShares(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return n.toLocaleString()
}

function generateTransactions(): InsiderTx[] {
  const seed = new Date().toDateString() + 'insider-trading'
  const rng = seededRng(hashStr(seed))
  const now = new Date()
  const entries: InsiderTx[] = []

  for (let i = 0; i < 20; i++) {
    const ticker = TICKERS[Math.floor(rng() * TICKERS.length)]
    const basePrice = BASE_PRICES[ticker]
    const priceFuzz = 0.92 + rng() * 0.16
    const price = parseFloat((basePrice * priceFuzz).toFixed(2))
    const transactionType: 'Buy' | 'Sell' = rng() < 0.38 ? 'Buy' : 'Sell'
    const sharesLog = Math.floor(rng() * 6)
    const shareBase = [100, 500, 1000, 5000, 50000, 250000][sharesLog]
    const shares = Math.floor(shareBase + rng() * shareBase)
    const value = Math.round(shares * price)
    const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]
    const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]
    const name = firstName + ' ' + lastName
    const title = TITLES[Math.floor(rng() * TITLES.length)]
    const daysAgo = Math.floor(rng() * 30)
    const txDate = new Date(now)
    txDate.setDate(txDate.getDate() - daysAgo)
    const date = MONTHS[txDate.getMonth()] + ' ' + txDate.getDate()
    const dateTs = txDate.getTime()

    entries.push({ ticker, name, title, transactionType, shares, price, value, date, dateTs, filingType: 'Form 4' })
  }

  return entries
}


export default function InsiderTradingPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('buys')
  const txns = useMemo(() => generateTransactions(), [])

  const buys = useMemo(() => txns.filter(t => t.transactionType === 'Buy').sort((a, b) => b.value - a.value), [txns])
  const sells = useMemo(() => txns.filter(t => t.transactionType === 'Sell').sort((a, b) => b.value - a.value), [txns])
  const recent = useMemo(() => [...txns].sort((a, b) => b.dateTs - a.dateTs), [txns])

  const renderRows = (rows: InsiderTx[], type: 'buy' | 'sell' | 'mixed') => {
    const accentColor = type === 'buy' ? 'text-emerald-500' : type === 'sell' ? 'text-red-500' : ''
    return (
      <table className="w-full text-[10px]">
        <thead>
          <tr className="text-muted-foreground">
            {type === 'mixed' && <th className="text-left font-medium pb-1.5 w-8">Type</th>}
            <th className="text-left font-medium pb-1.5">Ticker</th>
            <th className="text-left font-medium pb-1.5">
              {expanded ? 'Name' : 'Exec'}
            </th>
            {expanded && <th className="text-right font-medium pb-1.5">Title</th>}
            <th className="text-right font-medium pb-1.5">Shares</th>
            {expanded && <th className="text-right font-medium pb-1.5">$/sh</th>}
            <th className={`text-right font-medium pb-1.5 ${accentColor || 'text-muted-foreground'}`}>Value</th>
            <th className="text-right font-medium pb-1.5">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => {
            const isBuy = t.transactionType === 'Buy'
            const valueColor = isBuy ? 'text-emerald-500' : 'text-red-500'
            return (
              <tr key={i} className="border-t border-border/20">
                {type === 'mixed' && (
                  <td className="py-0.5">
                    <span className={`px-1 rounded-sm text-[10px] font-semibold ${isBuy ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                      {t.transactionType}
                    </span>
                  </td>
                )}
                <td className="py-0.5 font-medium text-foreground">{t.ticker}</td>
                <td className="py-0.5 text-muted-foreground max-w-[80px] truncate">
                  {expanded ? t.name : t.name.split(' ')[1]}
                </td>
                {expanded && (
                  <td className="py-0.5 text-right text-muted-foreground text-[10px]">{t.title}</td>
                )}
                <td className="py-0.5 text-right tabular-nums">{fmtShares(t.shares)}</td>
                {expanded && (
                  <td className="py-0.5 text-right tabular-nums text-muted-foreground">${t.price.toFixed(2)}</td>
                )}
                <td className={`py-0.5 text-right tabular-nums font-medium ${valueColor}`}>
                  {fmtValue(t.value)}
                </td>
                <td className="py-0.5 text-right text-muted-foreground">{t.date}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  return (
    <PanelWrapper title="Insider Trading">
      <div className="mb-1.5 px-1.5 py-0.5 rounded-sm bg-yellow-500/10 border border-yellow-500/20">
        <span className="text-[9px] text-yellow-500/80 uppercase tracking-wider">Simulated data · not real filings</span>
      </div>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'buys')} onClick={() => setTab('buys')}>Buys</button>
        <button className={tabCls(tab === 'sells')} onClick={() => setTab('sells')}>Sells</button>
        <button className={tabCls(tab === 'recent')} onClick={() => setTab('recent')}>Recent</button>
      </div>

      {tab === 'buys' && (
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Insider Purchases</span>
            <span className="text-[10px] text-emerald-500 font-medium">{buys.length} filings</span>
          </div>
          {renderRows(expanded ? buys : buys.slice(0, 8), 'buy')}
        </div>
      )}

      {tab === 'sells' && (
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Insider Sales</span>
            <span className="text-[10px] text-red-500 font-medium">{sells.length} filings</span>
          </div>
          {renderRows(expanded ? sells : sells.slice(0, 8), 'sell')}
        </div>
      )}

      {tab === 'recent' && (
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">All Filings (Last 30d)</span>
            <span className="text-[10px] text-muted-foreground">{recent.length} total</span>
          </div>
          {renderRows(expanded ? recent : recent.slice(0, 10), 'mixed')}
        </div>
      )}
    </PanelWrapper>
  )
}
