import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

export interface PriceAlert {
  id: string
  symbol: string
  targetPrice: number
  direction: 'above' | 'below'
  triggered: boolean
  createdAt: number
}

interface AlertStore {
  alerts: PriceAlert[]
  addAlert: (symbol: string, targetPrice: number, direction: 'above' | 'below') => Promise<void>
  removeAlert: (id: string) => Promise<void>
  markTriggered: (id: string) => Promise<void>
  clearTriggered: () => Promise<void>
  syncFromSupabase: () => Promise<void>
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export const useAlertStore = create<AlertStore>()(
  persist(
    (set, get) => ({
      alerts: [],

      addAlert: async (symbol, targetPrice, direction) => {
        const id = Date.now().toString(36)
        const alert: PriceAlert = { id, symbol, targetPrice, direction, triggered: false, createdAt: Date.now() }
        set((s) => ({ alerts: [...s.alerts, alert] }))
        const userId = await getUserId()
        if (userId) {
          try {
            await supabase.from('monoth_alerts').insert({
              id,
              user_id: userId,
              symbol,
              target_price: targetPrice,
              direction,
              triggered: false,
              created_at: alert.createdAt,
            })
          } catch {}
        }
      },

      removeAlert: async (id) => {
        set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) }))
        const userId = await getUserId()
        if (userId) {
          try { await supabase.from('monoth_alerts').delete().eq('id', id).eq('user_id', userId) } catch {}
        }
      },

      markTriggered: async (id) => {
        set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, triggered: true } : a)) }))
        const userId = await getUserId()
        if (userId) {
          try { await supabase.from('monoth_alerts').update({ triggered: true }).eq('id', id).eq('user_id', userId) } catch {}
        }
      },

      clearTriggered: async () => {
        const triggered = get().alerts.filter((a) => a.triggered).map((a) => a.id)
        set((s) => ({ alerts: s.alerts.filter((a) => !a.triggered) }))
        const userId = await getUserId()
        if (userId && triggered.length > 0) {
          try { await supabase.from('monoth_alerts').delete().in('id', triggered).eq('user_id', userId) } catch {}
        }
      },

      syncFromSupabase: async () => {
        const userId = await getUserId()
        if (!userId) return
        const { data } = await supabase
          .from('monoth_alerts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
        if (!data) return
        const alerts: PriceAlert[] = data.map((r) => ({
          id: r.id,
          symbol: r.symbol,
          targetPrice: r.target_price,
          direction: r.direction,
          triggered: r.triggered,
          createdAt: r.created_at,
        }))
        set({ alerts })
      },
    }),
    { name: 'monoth-alerts' }
  )
)
