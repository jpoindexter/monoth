import { create } from 'zustand'
import { PANELS } from '@/config/panels'
import type { PanelConfig, PanelId } from '@/types'

const LS_KEY = 'monoth-enabled-panels'
const LS_ORDER_KEY = 'monoth-panel-order'

function loadEnabledIds(): Set<string> | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return new Set(JSON.parse(raw))
  } catch {
    return null
  }
}

function loadOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(LS_ORDER_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveEnabledIds(panels: PanelConfig[]) {
  const ids = panels.filter((p) => p.enabled).map((p) => p.id)
  localStorage.setItem(LS_KEY, JSON.stringify(ids))
}

function saveOrder(panels: PanelConfig[]) {
  localStorage.setItem(LS_ORDER_KEY, JSON.stringify(panels.map((p) => p.id)))
}

function initPanels(): PanelConfig[] {
  const saved = loadEnabledIds()
  const order = loadOrder()
  let panels = saved
    ? PANELS.map((p) => ({ ...p, enabled: saved.has(p.id) }))
    : [...PANELS]

  if (order) {
    const byId = new Map(panels.map((p) => [p.id, p]))
    const ordered: PanelConfig[] = []
    for (const id of order) {
      const p = byId.get(id)
      if (p) {
        ordered.push(p)
        byId.delete(id)
      }
    }
    // Append any new panels not in saved order
    for (const p of byId.values()) ordered.push(p)
    panels = ordered
  }

  return panels
}

interface PanelStore {
  panels: PanelConfig[]
  togglePanel: (id: PanelId) => void
  enabledPanels: () => PanelConfig[]
  reorderPanels: (fromId: string, toId: string) => void
  resetPanels: () => void
}

export const usePanelStore = create<PanelStore>((set, get) => ({
  panels: initPanels(),
  togglePanel: (id) =>
    set((state) => {
      const panels = state.panels.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      )
      saveEnabledIds(panels)
      return { panels }
    }),
  enabledPanels: () => get().panels.filter((p) => p.enabled),
  reorderPanels: (fromId, toId) =>
    set((state) => {
      const panels = [...state.panels]
      const fromIdx = panels.findIndex((p) => p.id === fromId)
      const toIdx = panels.findIndex((p) => p.id === toId)
      if (fromIdx === -1 || toIdx === -1) return state
      const [moved] = panels.splice(fromIdx, 1)
      panels.splice(toIdx, 0, moved)
      saveOrder(panels)
      return { panels }
    }),
  resetPanels: () => {
    localStorage.removeItem(LS_KEY)
    localStorage.removeItem(LS_ORDER_KEY)
    set({ panels: [...PANELS] })
  },
}))
