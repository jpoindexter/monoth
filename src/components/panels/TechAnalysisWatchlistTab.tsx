import { useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { fmt } from '@/lib/panel-utils'

type Overall = 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell'
const OVERALL_MAP: Record<Overall, { label: string; cls: string }> = {
  strong_buy: { label: 'STRONG BUY', cls: 'text-emerald-400' },
  buy: { label: 'BUY', cls: 'text-emerald-600' },
  neutral: { label: 'NEUTRAL', cls: 'text-amber-400' },
  sell: { label: 'SELL', cls: 'text-red-500' },
  strong_sell: { label: 'STRONG SELL', cls: 'text-red-400' },
}

const LS_KEY = 'ta-watchlist'
const MAX = 10

function loadWatchlist(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}

function saveWatchlist(list: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

function WatchlistItem({ symbol, onRemove }: { symbol: string; onRemove: () => void }) {
  const { data } = usePolling({
    fetcher: async () => {
      const r = await fetch(`/api/market/tech-analysis?symbol=${symbol}`)
      if (!r.ok) throw new Error('Failed')
      return r.json()
    },
    interval: 300_000,
  })

  return (
    <div className="group relative flex items-center justify-between py-1 border-t border-border/20">
      <span className="text-[11px] font-medium">{symbol}</span>
      <div className="flex items-center gap-2">
        {data ? (
          <>
            <span className="text-[10px] text-muted-foreground tabular-nums">${fmt(data.price, 2)}</span>
            <span className={`text-[10px] font-semibold ${OVERALL_MAP[data.overall as Overall].cls}`}>
              {OVERALL_MAP[data.overall as Overall].label}
            </span>
          </>
        ) : (
          <span className="text-[10px] text-muted-foreground">Loading...</span>
        )}
        <button
          onClick={onRemove}
          className="text-[9px] text-muted-foreground/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
        >✕</button>
      </div>
    </div>
  )
}

export function TechAnalysisWatchlistTab() {
  const [watchlist, setWatchlist] = useState<string[]>(loadWatchlist)
  const [input, setInput] = useState('')

  function add(sym: string) {
    const s = sym.toUpperCase().trim()
    if (!s || watchlist.includes(s) || watchlist.length >= MAX) return
    const next = [...watchlist, s]
    setWatchlist(next)
    saveWatchlist(next)
  }

  function remove(sym: string) {
    const next = watchlist.filter(s => s !== sym)
    setWatchlist(next)
    saveWatchlist(next)
  }

  return (
    <div className="space-y-2">
      <form onSubmit={(e) => { e.preventDefault(); add(input); setInput('') }} className="flex gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="Add symbol..."
          className="flex-1 bg-muted/20 border border-border/30 rounded-sm text-[10px] px-1.5 py-1 outline-none focus:border-border/60"
          maxLength={10}
        />
        <button type="submit" className="text-[10px] px-2 py-1 rounded-sm bg-muted/30 hover:bg-muted/50 transition-colors">Add</button>
      </form>
      {watchlist.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">No symbols added. Max 10.</p>}
      {watchlist.map(sym => <WatchlistItem key={sym} symbol={sym} onRemove={() => remove(sym)} />)}
      {watchlist.length >= MAX && <p className="text-[9px] text-muted-foreground/60 text-center">Max 10 reached</p>}
    </div>
  )
}
