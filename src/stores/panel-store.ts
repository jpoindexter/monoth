import { create } from 'zustand'
import { PANELS } from '@/config/panels'
import type { PanelConfig, PanelId } from '@/types'

interface PanelStore {
  panels: PanelConfig[]
  togglePanel: (id: PanelId) => void
  enabledPanels: () => PanelConfig[]
}

export const usePanelStore = create<PanelStore>((set, get) => ({
  panels: PANELS,
  togglePanel: (id) =>
    set((state) => ({
      panels: state.panels.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      ),
    })),
  enabledPanels: () => get().panels.filter((p) => p.enabled),
}))
