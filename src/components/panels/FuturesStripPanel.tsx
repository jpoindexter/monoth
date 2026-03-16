'use client'
import { useCallback, useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { tabCls, fmt, changeColor } from '@/lib/panel-utils'

type Tab = 'strip' | 'basis'

interface FuturesItem {
  label: string
  symbol: string
  price: number
  change: number
  changePct: number
}

interface QuoteItem {
  symbol: string
  price: number
}

const BASIS_PAIRS = [
  { cashSymbol: 'SPY', futSymbol: 'ES=F', cashLabel: 'SPY', futLabel: 'ES=F', name: 'S&P 500' },
  { cashSymbol: 'USO', futSymbol: 'CL=F', cashLabel: 'USO', futLabel: 'CL=F', name: 'Crude Oil' },
  { cashSymbol: 'GLD', futSymbol: 'GC=F', cashLabel: 'GLD', futLabel: 'GC=F', name: 'Gold' },
]

function isLiveHours(): boolean {
  const now = new Date()
  const day = now.getUTCDay()
  const h = now.getUTCHours()
  const m = now.getUTCMinutes()
  const mins = h * 60 + m
  if (day === 0) return false
  if (day === 6) return false
  return mins >= 1300 && mins <= 2059
}

function fmtPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n >= 10) return fmt(n, 2)
  return fmt(n, 4)
}

export default function FuturesStripPanel() {
  const [tab, setTab] = useState<Tab>('strip')

  const stripFetcher = useCallback(async () => {
    const r = await fetch('/api/market/futures-strip')
    if (!r.ok) throw new Error('Failed to fetch futures strip')
    return r.json() as Promise<FuturesItem[]>
  }, [])

  const basisFetcher = useCallback(async () => {
    const symbols = ['SPY', 'USO', 'GLD', 'ES=F', 'CL=F', 'GC=F']
    const results = await Promise.allSettled(
      symbols.map(async (sym) => {
        const r = await fetch(`/api/market/quote?symbol=${encodeURIComponent(sym)}`)
        if (!r.ok) throw new Error(`quote ${sym}`)
        const d = await r.json()
        return { symbol: sym, price: d.price ?? d.regularMarketPrice ?? 0 } as QuoteItem
      })
    )
    return results
      .filter((r): r is PromiseFulfilledResult<QuoteItem> => r.status === 'fulfilled')
      .map(r => r.value)
  }, [])

  const { data: strip, loading: stripLoading, error: stripError, refresh: refreshStrip } = usePolling<FuturesItem[]>({
    fetcher: stripFetcher,
    interval: 60_000,
    enabled: tab === 'strip',
  })

  const { data: quotes, loading: quotesLoading, error: quotesError, refresh: refreshQuotes } = usePolling<QuoteItem[]>({
    fetcher: basisFetcher,
    interval: 60_000,
    enabled: tab === 'basis',
  })

  const loading = tab === 'strip' ? stripLoading : quotesLoading
  const error = tab === 'strip' ? stripError : quotesError
  const refresh = tab === 'strip' ? refreshStrip : refreshQuotes
  const live = isLiveHours()

  return (
    <PanelWrapper title="Futures Strip" loading={loading} error={error} onRetry={refresh}
      headerActions={
        <span className={`text-[9px] font-semibold px-1 py-0.5 rounded-sm uppercase tracking-wide ${live ? 'text-emerald-400 bg-emerald-500/10' : 'text-muted-foreground bg-muted/30'}`}>
          {live ? 'LIVE' : 'CLOSED'}
        </span>
      }
    >
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'strip')} onClick={() => setTab('strip')}>Strip</button>
        <button className={tabCls(tab === 'basis')} onClick={() => setTab('basis')}>Basis</button>
      </div>

      {tab === 'strip' && (
        <div>
          <div className="flex items-center pb-1 gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex-1">Contract</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[72px] text-right">Price</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[52px] text-right">Chg%</span>
          </div>
          {(strip ?? []).map((item) => (
            <div key={item.symbol} className="flex items-center gap-1 border-t border-border/15 py-0.5">
              <span className="text-[11px] font-medium text-foreground flex-1">{item.label}</span>
              <span className="text-[11px] tabular-nums font-medium w-[72px] text-right">{fmtPrice(item.price)}</span>
              <span className={`text-[11px] tabular-nums font-medium w-[52px] text-right ${changeColor(item.changePct)}`}>
                {item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'basis' && (
        <div className="flex flex-col gap-3">
          <div className="text-[9px] text-muted-foreground leading-snug">
            Spread between cash ETF and front-month futures contract.
          </div>
          {BASIS_PAIRS.map(({ cashSymbol, futSymbol, cashLabel, futLabel, name }) => {
            const cash = quotes?.find(q => q.symbol === cashSymbol)
            const fut = quotes?.find(q => q.symbol === futSymbol)
            const basis = cash && fut ? fut.price - cash.price : null
            return (
              <div key={name} className="border border-border/20 rounded-sm p-2">
                <div className="text-[10px] font-semibold text-foreground mb-1">{name}</div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>{cashLabel} <span className="text-foreground tabular-nums">{cash ? `$${fmtPrice(cash.price)}` : '—'}</span></span>
                  <span>{futLabel} <span className="text-foreground tabular-nums">{fut ? `$${fmtPrice(fut.price)}` : '—'}</span></span>
                </div>
                {basis !== null && (
                  <div className="text-[10px]">
                    <span className="text-muted-foreground">Basis: </span>
                    <span className={`tabular-nums font-medium ${changeColor(basis)}`}>
                      {basis >= 0 ? '+' : ''}{fmt(basis, 2)} pts
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </PanelWrapper>
  )
}
