import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

function syncAlerts(session: Session | null) {
  if (!session) return
  // Lazy import to avoid circular dependency
  import('@/stores/alert-store').then(({ useAlertStore }) => {
    useAlertStore.getState().syncFromSupabase()
  }).catch(() => {})
}

type Tier = 'free' | 'pro' | 'api' | 'enterprise'

const WL_KEY = 'monoth-watchlist'

function loadWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(WL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveWatchlist(list: string[]) {
  localStorage.setItem(WL_KEY, JSON.stringify(list))
}

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
  watchlist: loadWatchlist(),
  theme: 'dark',
  session: null,
  setAuthenticated: (authenticated) => set({ authenticated }),
  setTier: (tier) => set({ tier }),
  addToWatchlist: (symbol) =>
    set((s) => {
      const watchlist = [...s.watchlist, symbol]
      saveWatchlist(watchlist)
      return { watchlist }
    }),
  removeFromWatchlist: (symbol) =>
    set((s) => {
      const watchlist = s.watchlist.filter((w) => w !== symbol)
      saveWatchlist(watchlist)
      return { watchlist }
    }),
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
      syncAlerts(session)
    }).catch(() => {})

    try {
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          authenticated: !!session,
          email: session?.user?.email ?? null,
        })
        if (_event === 'SIGNED_IN') syncAlerts(session)
      })
    } catch {}
  },
}))
