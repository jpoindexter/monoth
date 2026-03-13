import { create } from 'zustand'
import { PANELS } from '@/config/panels'
import type { PanelConfig, PanelId } from '@/types'

const LS_KEY = 'monoth-enabled-panels'

function loadEnabledIds(): Set<string> | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return new Set(JSON.parse(raw))
  } catch {
    return null
  }
}

function saveEnabledIds(panels: PanelConfig[]) {
  const ids = panels.filter((p) => p.enabled).map((p) => p.id)
  localStorage.setItem(LS_KEY, JSON.stringify(ids))
}

function initPanels(): PanelConfig[] {
  const saved = loadEnabledIds()
  if (!saved) return PANELS
  return PANELS.map((p) => ({ ...p, enabled: saved.has(p.id) }))
}

interface PanelStore {
  panels: PanelConfig[]
  togglePanel: (id: PanelId) => void
  enabledPanels: () => PanelConfig[]
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
  resetPanels: () => {
    localStorage.removeItem(LS_KEY)
    set({ panels: PANELS })
  },
}))
