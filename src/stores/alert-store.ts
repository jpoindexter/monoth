import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  addAlert: (symbol: string, targetPrice: number, direction: 'above' | 'below') => void
  removeAlert: (id: string) => void
  markTriggered: (id: string) => void
  clearTriggered: () => void
}

export const useAlertStore = create<AlertStore>()(
  persist(
    (set) => ({
      alerts: [],

      addAlert: (symbol, targetPrice, direction) => {
        const id = Date.now().toString(36)
        const alert: PriceAlert = { id, symbol, targetPrice, direction, triggered: false, createdAt: Date.now() }
        set((s) => ({ alerts: [...s.alerts, alert] }))
      },

      removeAlert: (id) => {
        set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) }))
      },

      markTriggered: (id) => {
        set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, triggered: true } : a)) }))
      },

      clearTriggered: () => {
        set((s) => ({ alerts: s.alerts.filter((a) => !a.triggered) }))
      },
    }),
    { name: 'monoth-alerts' }
  )
)
