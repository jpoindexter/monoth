import { useState, useCallback } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { tabCls } from '@/lib/panel-utils'

interface Fundamentals {
  symbol: string
  name: string
  sector: string | null
  industry: string | null
  peRatio: number | null
  forwardPE: number | null
  pbRatio: number | null
  evToEbitda: number | null
  evToRevenue: number | null
  pegRatio: number | null
  priceToSales: number | null
  profitMargin: number | null
  operatingMargin: number | null
  roe: number | null
  roa: number | null
  revenueGrowth: number | null
  earningsGrowth: number | null
  marketCap: number | null
  enterpriseValue: number | null
  revenue: number | null
  ebitda: number | null
  dividendYield: number | null
  payoutRatio: number | null
  debtToEquity: number | null
  currentRatio: number | null
  eps: number | null
  bookValue: number | null
  sharesOutstanding: number | null
  shortRatio: number | null
  beta: number | null
  week52High: number | null
  week52Low: number | null
  fiftyDayAvg: number | null
  twoHundredDayAvg: number | null
}

function fmtBig(n: number | null): string {
  if (n == null) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T'
  if (abs >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
  if (abs >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtPct(n: number | null): string {
  if (n == null) return '—'
  return (n * 100).toFixed(2) + '%'
}

function fmtNum(n: number | null, digits = 2): string {
  if (n == null) return '—'
  return n.toFixed(digits)
}

type Tab = 'valuation' | 'profitability' | 'growth' | 'balance'


function Row({ label, value, colored }: { label: string; value: string; colored?: 'pos' | 'neg' | null }) {
  return (
    <tr className="border-t border-border/20">
      <td className="py-0.5 text-[10px] text-muted-foreground">{label}</td>
      <td className={`py-0.5 text-right text-[10px] tabular-nums font-medium ${
        colored === 'pos' ? 'text-emerald-400' : colored === 'neg' ? 'text-red-400' : 'text-foreground'
      }`}>{value}</td>
    </tr>
  )
}

function growthColor(n: number | null): 'pos' | 'neg' | null {
  if (n == null) return null
  return n >= 0 ? 'pos' : 'neg'
}

export default function FundamentalsPanel() {
  const expanded = useIsExpanded()
  const [symbol, setSymbol] = useState('AAPL')
  const [inputVal, setInputVal] = useState('AAPL')
  const [tab, setTab] = useState<Tab>('valuation')

  const fetcher = useCallback(async () => {
    const res = await fetch(`/api/market/fundamentals?symbol=${symbol}`)
    if (!res.ok) throw new Error(`Failed to fetch fundamentals for ${symbol}`)
    return res.json() as Promise<Fundamentals>
  }, [symbol])

  const { data, loading, error, refresh } = usePolling<Fundamentals>({
    fetcher,
    interval: 300_000,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = inputVal.trim().toUpperCase()
    if (val) setSymbol(val)
  }

  return (
    <PanelWrapper title="Fundamentals" loading={loading && !data} error={error} onRetry={refresh}>
      <form onSubmit={handleSubmit} className="flex gap-1 mb-2">
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value.toUpperCase())}
          placeholder="Symbol"
          className="flex-1 h-5 px-1.5 text-[11px] rounded-sm bg-muted border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button type="submit" className="h-5 px-2 text-[9px] uppercase tracking-wider font-medium rounded-sm bg-foreground text-background hover:opacity-80">Go</button>
      </form>

      {data && (
        <div className="mb-2">
          <div className="text-[11px] font-semibold text-foreground truncate">{data.name}</div>
          {data.sector && <div className="text-[9px] text-muted-foreground">{data.sector} · {data.industry}</div>}
        </div>
      )}

      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'valuation')} onClick={() => setTab('valuation')}>Valuation</button>
        <button className={tabCls(tab === 'profitability')} onClick={() => setTab('profitability')}>Margins</button>
        <button className={tabCls(tab === 'growth')} onClick={() => setTab('growth')}>Growth</button>
        <button className={tabCls(tab === 'balance')} onClick={() => setTab('balance')}>Balance</button>
      </div>

      {loading && !data && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">Loading {symbol}...</div>
      )}

      {data && tab === 'valuation' && (
        <table className="w-full">
          <tbody>
            <Row label="P/E (TTM)" value={fmtNum(data.peRatio)} />
            <Row label="Forward P/E" value={fmtNum(data.forwardPE)} />
            <Row label="P/B" value={fmtNum(data.pbRatio)} />
            <Row label="P/S" value={fmtNum(data.priceToSales)} />
            <Row label="EV/EBITDA" value={fmtNum(data.evToEbitda)} />
            <Row label="EV/Revenue" value={fmtNum(data.evToRevenue)} />
            <Row label="PEG" value={fmtNum(data.pegRatio)} />
            <Row label="Market Cap" value={fmtBig(data.marketCap)} />
            <Row label="Enterprise Value" value={fmtBig(data.enterpriseValue)} />
            {expanded && <>
              <Row label="EPS (TTM)" value={data.eps != null ? '$' + fmtNum(data.eps) : '—'} />
              <Row label="Book Value/Share" value={data.bookValue != null ? '$' + fmtNum(data.bookValue) : '—'} />
              <Row label="Beta" value={fmtNum(data.beta)} />
            </>}
          </tbody>
        </table>
      )}

      {data && tab === 'profitability' && (
        <table className="w-full">
          <tbody>
            <Row label="Profit Margin" value={fmtPct(data.profitMargin)} colored={growthColor(data.profitMargin)} />
            <Row label="Operating Margin" value={fmtPct(data.operatingMargin)} colored={growthColor(data.operatingMargin)} />
            <Row label="ROE" value={fmtPct(data.roe)} colored={growthColor(data.roe)} />
            <Row label="ROA" value={fmtPct(data.roa)} colored={growthColor(data.roa)} />
            <Row label="Revenue" value={fmtBig(data.revenue)} />
            <Row label="EBITDA" value={fmtBig(data.ebitda)} />
            {expanded && <>
              <Row label="Dividend Yield" value={fmtPct(data.dividendYield)} />
              <Row label="Payout Ratio" value={fmtPct(data.payoutRatio)} />
            </>}
          </tbody>
        </table>
      )}

      {data && tab === 'growth' && (
        <table className="w-full">
          <tbody>
            <Row label="Revenue Growth (YoY)" value={fmtPct(data.revenueGrowth)} colored={growthColor(data.revenueGrowth)} />
            <Row label="Earnings Growth" value={fmtPct(data.earningsGrowth)} colored={growthColor(data.earningsGrowth)} />
            <Row label="52W High" value={data.week52High != null ? '$' + fmtNum(data.week52High) : '—'} />
            <Row label="52W Low" value={data.week52Low != null ? '$' + fmtNum(data.week52Low) : '—'} />
            <Row label="50-day MA" value={data.fiftyDayAvg != null ? '$' + fmtNum(data.fiftyDayAvg) : '—'} />
            <Row label="200-day MA" value={data.twoHundredDayAvg != null ? '$' + fmtNum(data.twoHundredDayAvg) : '—'} />
          </tbody>
        </table>
      )}

      {data && tab === 'balance' && (
        <table className="w-full">
          <tbody>
            <Row label="Debt/Equity" value={fmtNum(data.debtToEquity)} colored={data.debtToEquity != null ? (data.debtToEquity > 2 ? 'neg' : 'pos') : null} />
            <Row label="Current Ratio" value={fmtNum(data.currentRatio)} colored={data.currentRatio != null ? (data.currentRatio >= 1.5 ? 'pos' : 'neg') : null} />
            <Row label="Short Ratio" value={fmtNum(data.shortRatio)} />
            <Row label="Shares Out." value={data.sharesOutstanding != null ? fmtBig(data.sharesOutstanding).replace('$', '') : '—'} />
          </tbody>
        </table>
      )}
    </PanelWrapper>
  )
}
