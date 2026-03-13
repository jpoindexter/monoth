import { create } from 'zustand'

type Tier = 'free' | 'pro' | 'api' | 'enterprise'

interface UserStore {
  authenticated: boolean
  tier: Tier
  watchlist: string[]
  theme: 'dark' | 'light'
  setAuthenticated: (auth: boolean) => void
  setTier: (tier: Tier) => void
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void
  toggleTheme: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  authenticated: false,
  tier: 'free',
  watchlist: [],
  theme: 'dark',
  setAuthenticated: (authenticated) => set({ authenticated }),
  setTier: (tier) => set({ tier }),
  addToWatchlist: (symbol) =>
    set((s) => ({ watchlist: [...s.watchlist, symbol] })),
  removeFromWatchlist: (symbol) =>
    set((s) => ({ watchlist: s.watchlist.filter((w) => w !== symbol) })),
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
}))
