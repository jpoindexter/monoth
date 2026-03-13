import { useState, useCallback } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { tabCls, fmtVol } from '@/lib/panel-utils'

type Tab = 'chain' | 'calls' | 'puts'

interface Contract {
  strike: number
  lastPrice: number
  bid: number
  ask: number
  volume: number
  openInterest: number
  impliedVolatility: number
  inTheMoney: boolean
  expiration: number
  contractSymbol: string
}

interface OptionsData {
  symbol: string
  underlyingPrice: number
  expirationDates: number[]
  expiry: number | undefined
  calls: Contract[]
  puts: Contract[]
}

function fmtDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

function fmtIV(iv: number): string {
  return (iv * 100).toFixed(1) + '%'
}

function fmtPrice(n: number): string {
  return n > 0 ? n.toFixed(2) : '—'
}

function fmtK(n: number): string {
  if (!n) return '—'
  return fmtVol(n)
}


function ChainRow({
  strike,
  call,
  put,
  underlyingPrice,
  expanded,
}: {
  strike: number
  call: Contract | undefined
  put: Contract | undefined
  underlyingPrice: number
  expanded: boolean
}) {
  const isAtMoney = Math.abs(strike - underlyingPrice) / underlyingPrice < 0.005
  const callItm = call?.inTheMoney ?? false
  const putItm = put?.inTheMoney ?? false

  return (
    <tr className={`border-t text-[10px] tabular-nums ${isAtMoney ? 'border-yellow-500/50' : 'border-border/20'}`}>
      {/* Call side */}
      <td className={`py-0.5 pl-0.5 ${callItm ? 'text-emerald-400 bg-emerald-500/8' : 'text-muted-foreground'}`}>
        {call ? fmtPrice(call.bid) : '—'}
      </td>
      <td className={`py-0.5 ${callItm ? 'bg-emerald-500/8' : ''}`}>{call ? fmtPrice(call.ask) : '—'}</td>
      <td className={`py-0.5 ${callItm ? 'bg-emerald-500/8' : ''}`}>{call ? fmtPrice(call.lastPrice) : '—'}</td>
      <td className={`py-0.5 text-muted-foreground ${callItm ? 'bg-emerald-500/8' : ''}`}>{call ? fmtK(call.volume) : '—'}</td>
      <td className={`py-0.5 text-muted-foreground ${callItm ? 'bg-emerald-500/8' : ''}`}>{call ? fmtK(call.openInterest) : '—'}</td>
      {expanded && <td className={`py-0.5 text-muted-foreground ${callItm ? 'bg-emerald-500/8' : ''}`}>{call ? fmtIV(call.impliedVolatility) : '—'}</td>}

      {/* Strike */}
      <td className={`py-0.5 px-1.5 text-center font-semibold ${isAtMoney ? 'text-yellow-400' : 'text-foreground/70'}`}>
        {strike}
      </td>

      {/* Put side */}
      {expanded && <td className={`py-0.5 text-muted-foreground ${putItm ? 'bg-red-500/8' : ''}`}>{put ? fmtIV(put.impliedVolatility) : '—'}</td>}
      <td className={`py-0.5 text-muted-foreground ${putItm ? 'bg-red-500/8' : ''}`}>{put ? fmtK(put.openInterest) : '—'}</td>
      <td className={`py-0.5 text-muted-foreground ${putItm ? 'bg-red-500/8' : ''}`}>{put ? fmtK(put.volume) : '—'}</td>
      <td className={`py-0.5 ${putItm ? 'bg-red-500/8' : ''}`}>{put ? fmtPrice(put.lastPrice) : '—'}</td>
      <td className={`py-0.5 ${putItm ? 'bg-red-500/8' : ''}`}>{put ? fmtPrice(put.ask) : '—'}</td>
      <td className={`py-0.5 pr-0.5 ${putItm ? 'text-red-400 bg-red-500/8' : 'text-muted-foreground'}`}>
        {put ? fmtPrice(put.bid) : '—'}
      </td>
    </tr>
  )
}

export default function OptionsChainPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('chain')
  const [symbolInput, setSymbolInput] = useState('AAPL')
  const [symbol, setSymbol] = useState('AAPL')
  const [selectedExpiry, setSelectedExpiry] = useState<string>('')

  const fetcher = useCallback(async (): Promise<OptionsData> => {
    const params = new URLSearchParams({ symbol })
    if (selectedExpiry) params.set('expiry', selectedExpiry)
    const res = await fetch(`/api/market/options?${params}`)
    if (!res.ok) throw new Error(`Failed to fetch options for ${symbol}`)
    return res.json() as Promise<OptionsData>
  }, [symbol, selectedExpiry])

  const { data, loading, error, refresh } = usePolling<OptionsData>({ fetcher, interval: 60_000 })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const s = symbolInput.trim().toUpperCase()
    if (s) { setSymbol(s); setSelectedExpiry('') }
  }

  const strikes = data
    ? [...new Set([...data.calls.map((c) => c.strike), ...data.puts.map((c) => c.strike)])].sort((a, b) => a - b)
    : []

  const callByStrike = new Map(data?.calls.map((c) => [c.strike, c]) ?? [])
  const putByStrike = new Map(data?.puts.map((c) => [c.strike, c]) ?? [])

  const maxStrikes = expanded ? strikes.length : 20
  const visibleStrikes = strikes.slice(0, maxStrikes)

  const colHdr = 'text-left font-medium pb-1 text-[9px] uppercase tracking-wider text-muted-foreground'
  const colHdrR = 'text-right font-medium pb-1 text-[9px] uppercase tracking-wider text-muted-foreground'

  return (
    <PanelWrapper title="Options Chain" onRetry={refresh}>
      <div className="flex flex-col gap-2 h-full">
        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <form onSubmit={handleSubmit} className="flex gap-1">
            <input
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
              className="w-16 text-[11px] bg-transparent border border-border/40 rounded-sm px-1.5 py-0.5 text-foreground uppercase placeholder:text-muted-foreground focus:outline-none focus:border-border/80"
              placeholder="AAPL"
            />
            <button type="submit" className="text-[10px] px-2 py-0.5 border border-border/40 rounded-sm hover:border-border/80 transition-colors text-foreground">
              Go
            </button>
          </form>
          {data && data.expirationDates.length > 0 && (
            <select
              value={selectedExpiry}
              onChange={(e) => setSelectedExpiry(e.target.value)}
              className="text-[10px] bg-transparent border border-border/40 rounded-sm px-1.5 py-0.5 text-foreground focus:outline-none focus:border-border/80"
            >
              {data.expirationDates.map((d) => (
                <option key={d} value={String(d)}>{fmtDate(d)}</option>
              ))}
            </select>
          )}
          {data && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {data.symbol} <span className="text-foreground font-semibold">${data.underlyingPrice?.toFixed(2)}</span>
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border/20">
          <button className={tabCls(tab === 'chain')} onClick={() => setTab('chain')}>Chain</button>
          <button className={tabCls(tab === 'calls')} onClick={() => setTab('calls')}>Calls</button>
          <button className={tabCls(tab === 'puts')} onClick={() => setTab('puts')}>Puts</button>
        </div>

        {loading && <div className="text-[10px] text-muted-foreground">Loading...</div>}
        {error && <div className="text-[10px] text-red-400">{error}</div>}

        {data && !loading && (
          <div className="overflow-auto flex-1">
            {tab === 'chain' && (
              <table className="w-full min-w-[520px] border-collapse">
                <thead>
                  <tr>
                    {/* Calls header */}
                    <th colSpan={expanded ? 6 : 5} className="text-center text-[9px] font-semibold text-emerald-500/80 pb-1 border-b border-emerald-500/20">
                      CALLS
                    </th>
                    <th className="pb-1" />
                    {/* Puts header */}
                    <th colSpan={expanded ? 6 : 5} className="text-center text-[9px] font-semibold text-red-500/80 pb-1 border-b border-red-500/20">
                      PUTS
                    </th>
                  </tr>
                  <tr>
                    <th className={colHdr}>Bid</th>
                    <th className={colHdr}>Ask</th>
                    <th className={colHdr}>Last</th>
                    <th className={colHdr}>Vol</th>
                    <th className={colHdr}>OI</th>
                    {expanded && <th className={colHdr}>IV%</th>}
                    <th className="text-center font-medium pb-1 text-[9px] uppercase tracking-wider text-foreground/60 px-1">Strike</th>
                    {expanded && <th className={colHdrR}>IV%</th>}
                    <th className={colHdrR}>OI</th>
                    <th className={colHdrR}>Vol</th>
                    <th className={colHdrR}>Last</th>
                    <th className={colHdrR}>Ask</th>
                    <th className={colHdrR}>Bid</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleStrikes.map((strike) => (
                    <ChainRow
                      key={strike}
                      strike={strike}
                      call={callByStrike.get(strike)}
                      put={putByStrike.get(strike)}
                      underlyingPrice={data.underlyingPrice}
                      expanded={expanded}
                    />
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'calls' && (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={colHdr}>Strike</th>
                    <th className={colHdr}>Bid</th>
                    <th className={colHdr}>Ask</th>
                    <th className={colHdr}>Last</th>
                    <th className={colHdr}>Vol</th>
                    <th className={colHdr}>OI</th>
                    {expanded && <th className={colHdr}>IV%</th>}
                  </tr>
                </thead>
                <tbody>
                  {(expanded ? data.calls : data.calls.slice(0, 20)).map((c) => (
                    <tr key={c.contractSymbol} className={`border-t border-border/20 text-[10px] tabular-nums ${c.inTheMoney ? 'bg-emerald-500/8' : ''}`}>
                      <td className={`py-0.5 font-semibold ${c.inTheMoney ? 'text-emerald-400' : 'text-foreground/70'}`}>{c.strike}</td>
                      <td className="py-0.5">{fmtPrice(c.bid)}</td>
                      <td className="py-0.5">{fmtPrice(c.ask)}</td>
                      <td className="py-0.5">{fmtPrice(c.lastPrice)}</td>
                      <td className="py-0.5 text-muted-foreground">{fmtK(c.volume)}</td>
                      <td className="py-0.5 text-muted-foreground">{fmtK(c.openInterest)}</td>
                      {expanded && <td className="py-0.5 text-muted-foreground">{fmtIV(c.impliedVolatility)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'puts' && (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={colHdr}>Strike</th>
                    <th className={colHdr}>Bid</th>
                    <th className={colHdr}>Ask</th>
                    <th className={colHdr}>Last</th>
                    <th className={colHdr}>Vol</th>
                    <th className={colHdr}>OI</th>
                    {expanded && <th className={colHdr}>IV%</th>}
                  </tr>
                </thead>
                <tbody>
                  {(expanded ? data.puts : data.puts.slice(0, 20)).map((c) => (
                    <tr key={c.contractSymbol} className={`border-t border-border/20 text-[10px] tabular-nums ${c.inTheMoney ? 'bg-red-500/8' : ''}`}>
                      <td className={`py-0.5 font-semibold ${c.inTheMoney ? 'text-red-400' : 'text-foreground/70'}`}>{c.strike}</td>
                      <td className="py-0.5">{fmtPrice(c.bid)}</td>
                      <td className="py-0.5">{fmtPrice(c.ask)}</td>
                      <td className="py-0.5">{fmtPrice(c.lastPrice)}</td>
                      <td className="py-0.5 text-muted-foreground">{fmtK(c.volume)}</td>
                      <td className="py-0.5 text-muted-foreground">{fmtK(c.openInterest)}</td>
                      {expanded && <td className="py-0.5 text-muted-foreground">{fmtIV(c.impliedVolatility)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </PanelWrapper>
  )
}
