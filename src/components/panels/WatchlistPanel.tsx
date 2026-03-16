import { useState, useCallback, useEffect, useRef } from 'react'
import { useUserStore } from '@/stores'
import { supabase } from '@/lib/supabase'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { useAlertStore } from '@/stores/alert-store'
import { tabCls } from '@/lib/panel-utils'
import { WatchlistQuotes } from '@/components/panels/WatchlistQuotes'
import { WatchlistPortfolio } from '@/components/panels/WatchlistPortfolio'

const SHARES_KEY = 'monoth-portfolio-shares'

function loadShares(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SHARES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveShares(shares: Record<string, number>) {
  localStorage.setItem(SHARES_KEY, JSON.stringify(shares))
}

export default function WatchlistPanel() {
  const isPanelExpanded = useIsExpanded()
  const watchlist = useUserStore((s) => s.watchlist)
  const addToWatchlist = useUserStore((s) => s.addToWatchlist)
  const removeFromWatchlist = useUserStore((s) => s.removeFromWatchlist)
  const authenticated = useUserStore((s) => s.authenticated)
  const [input, setInput] = useState('')
  const [tab, setTab] = useState<'quotes' | 'portfolio'>('quotes')
  const [shares, setShares] = useState<Record<string, number>>(loadShares)
  const [expanded, setExpanded] = useState<string | null>(null)
  const syncedRef = useRef(false)

  useEffect(() => {
    if (!authenticated || syncedRef.current) return
    syncedRef.current = true
    supabase.auth.getUser().then(async ({ data }) => {
      const userId = data.user?.id
      if (!userId) return
      const { data: rows } = await supabase
        .from('monoth_portfolio')
        .select('symbol, shares')
        .eq('user_id', userId)
      if (!rows || rows.length === 0) return
      const remote: Record<string, number> = {}
      for (const r of rows) { if (r.symbol && r.shares > 0) remote[r.symbol] = r.shares }
      if (Object.keys(remote).length > 0) {
        setShares(remote)
        saveShares(remote)
      }
    }).catch(() => {})
  }, [authenticated])

  const [alertOpen, setAlertOpen] = useState<string | null>(null)
  const [alertPrice, setAlertPrice] = useState('')
  const alerts = useAlertStore((s) => s.alerts)
  const addAlert = useAlertStore((s) => s.addAlert)
  const removeAlert = useAlertStore((s) => s.removeAlert)

  const fetcher = useCallback(() => fetchQuotes(watchlist), [watchlist])
  const { data, loading, error, refresh } = usePolling({
    fetcher,
    interval: 60_000,
    enabled: watchlist.length > 0,
  })

  function handleAdd(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const sym = input.trim().toUpperCase()
    if (!sym || watchlist.includes(sym)) return
    addToWatchlist(sym)
    setInput('')
  }

  function updateShares(sym: string, val: string) {
    const n = parseFloat(val)
    const next = { ...shares }
    if (isNaN(n) || n <= 0) { delete next[sym] } else { next[sym] = n }
    setShares(next)
    saveShares(next)
    if (authenticated) {
      supabase.auth.getUser().then(async ({ data }) => {
        const userId = data.user?.id
        if (!userId) return
        if (isNaN(n) || n <= 0) {
          await supabase.from('monoth_portfolio').delete().eq('user_id', userId).eq('symbol', sym)
        } else {
          await supabase.from('monoth_portfolio').upsert(
            { user_id: userId, symbol: sym, shares: n, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,symbol' }
          )
        }
      }).catch(() => {})
    }
  }

  function openAlertForm(sym: string, price: number | undefined) {
    setAlertOpen((prev) => (prev === sym ? null : sym))
    setAlertPrice(price ? price.toFixed(2) : '')
  }

  function createAlert(sym: string, direction: 'above' | 'below') {
    const p = parseFloat(alertPrice)
    if (isNaN(p) || p <= 0) return
    addAlert(sym, p, direction)
    setAlertOpen(null)
    setAlertPrice('')
  }

  const totalValue = watchlist.reduce((sum, sym) => {
    const point = data?.find((d) => d.symbol === sym)
    const qty = shares[sym] ?? 0
    return sum + (point ? point.price * qty : 0)
  }, 0)

  const totalPnL = watchlist.reduce((sum, sym) => {
    const point = data?.find((d) => d.symbol === sym)
    const qty = shares[sym] ?? 0
    return sum + (point ? point.change * qty : 0)
  }, 0)

  return (
    <PanelWrapper title="Watchlist" loading={loading && watchlist.length > 0} error={error} onRetry={refresh}>
      <div className="mb-2 flex gap-1 items-center">
        <input
          placeholder="Add symbol..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleAdd}
          className="flex-1 bg-transparent border border-border/30 rounded-sm px-1.5 py-0.5 text-[11px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
        />
        <button className={tabCls(tab === 'quotes')} onClick={() => setTab('quotes')}>Quotes</button>
        <button className={tabCls(tab === 'portfolio')} onClick={() => setTab('portfolio')}>P&L</button>
      </div>

      {watchlist.length === 0 ? (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Type a ticker and press Enter</div>
      ) : tab === 'quotes' ? (
        <WatchlistQuotes
          watchlist={watchlist}
          data={data}
          isPanelExpanded={isPanelExpanded}
          expanded={expanded}
          alerts={alerts}
          alertOpen={alertOpen}
          alertPrice={alertPrice}
          onToggleExpanded={(sym) => setExpanded((prev) => (prev === sym ? null : sym))}
          onOpenAlertForm={openAlertForm}
          onCreateAlert={createAlert}
          onCloseAlert={() => setAlertOpen(null)}
          onSetAlertPrice={setAlertPrice}
          onRemove={removeFromWatchlist}
          onRemoveAlert={removeAlert}
        />
      ) : (
        <WatchlistPortfolio
          watchlist={watchlist}
          data={data}
          shares={shares}
          isPanelExpanded={isPanelExpanded}
          totalValue={totalValue}
          totalPnL={totalPnL}
          authenticated={authenticated}
          onUpdateShares={updateShares}
        />
      )}
    </PanelWrapper>
  )
}
