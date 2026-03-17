import { create } from 'zustand'

type Tier = 'free' | 'pro' | 'api' | 'enterprise'

const WL_KEY = 'monoth-watchlist'

const DEFAULT_WATCHLIST = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'BTC-USD']

function loadWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(WL_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_WATCHLIST
  } catch { return DEFAULT_WATCHLIST }
}

function saveWatchlist(list: string[]) {
  localStorage.setItem(WL_KEY, JSON.stringify(list))
}

interface UserStore {
  tier: Tier
  watchlist: string[]
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void
}

export const useUserStore = create<UserStore>(() => ({
  tier: 'free',
  watchlist: loadWatchlist(),
  addToWatchlist: (symbol) =>
    useUserStore.setState((s) => {
      const watchlist = [...s.watchlist, symbol]
      saveWatchlist(watchlist)
      return { watchlist }
    }),
  removeFromWatchlist: (symbol) =>
    useUserStore.setState((s) => {
      const watchlist = s.watchlist.filter((w) => w !== symbol)
      saveWatchlist(watchlist)
      return { watchlist }
    }),
}))
