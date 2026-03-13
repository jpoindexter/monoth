import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type Tier = 'free' | 'pro' | 'api' | 'enterprise'

interface UserStore {
  authenticated: boolean
  email: string | null
  tier: Tier
  watchlist: string[]
  theme: 'dark' | 'light'
  session: Session | null
  setAuthenticated: (auth: boolean) => void
  setTier: (tier: Tier) => void
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void
  toggleTheme: () => void
  setSession: (session: Session | null) => void
  initAuth: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  authenticated: false,
  email: null,
  tier: 'free',
  watchlist: [],
  theme: 'dark',
  session: null,
  setAuthenticated: (authenticated) => set({ authenticated }),
  setTier: (tier) => set({ tier }),
  addToWatchlist: (symbol) =>
    set((s) => ({ watchlist: [...s.watchlist, symbol] })),
  removeFromWatchlist: (symbol) =>
    set((s) => ({ watchlist: s.watchlist.filter((w) => w !== symbol) })),
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setSession: (session) =>
    set({
      session,
      authenticated: !!session,
      email: session?.user?.email ?? null,
    }),
  initAuth: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        authenticated: !!session,
        email: session?.user?.email ?? null,
      })
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        authenticated: !!session,
        email: session?.user?.email ?? null,
      })
    })
  },
}))
