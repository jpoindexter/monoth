import { create } from 'zustand'
import { LAYOUTS, type LayoutConfig } from '@/config/layouts'
import { usePanelStore } from '@/stores/panel-store'
import { useSpanStore } from '@/stores/span-store'

interface Layout {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

interface LayoutStore {
  // Legacy grid layout state
  layouts: Layout[]
  sidebarOpen: boolean
  layoutLocked: boolean
  setLayouts: (layouts: Layout[]) => void
  toggleSidebar: () => void
  toggleLock: () => void
  // Layout presets
  activeLayoutId: string | null
  applyLayout: (layoutId: string) => void
  clearLayout: () => void
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  layouts: [],
  sidebarOpen: true,
  layoutLocked: false,
  setLayouts: (layouts) => set({ layouts }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleLock: () => set((s) => ({ layoutLocked: !s.layoutLocked })),

  activeLayoutId: localStorage.getItem('monoth-active-layout'),

  applyLayout: (layoutId) => {
    const layout = LAYOUTS.find((l) => l.id === layoutId)
    if (!layout) return
    applyLayoutToStores(layout)
    localStorage.setItem('monoth-active-layout', layoutId)
    set({ activeLayoutId: layoutId })
  },

  clearLayout: () => {
    localStorage.removeItem('monoth-active-layout')
    set({ activeLayoutId: null })
  },
}))

function applyLayoutToStores(layout: LayoutConfig) {
  const layoutIds = new Set(layout.panels.map((p) => p.id))
  const allPanels = usePanelStore.getState().panels

  // Enable only panels in the layout, disable others
  const updatedPanels = allPanels.map((p) => ({ ...p, enabled: layoutIds.has(p.id) }))

  // Reorder to match layout order, append disabled panels at end
  const ordered = [
    ...layout.panels.map((lp) => updatedPanels.find((p) => p.id === lp.id)).filter(Boolean),
    ...updatedPanels.filter((p) => !layoutIds.has(p.id)),
  ] as typeof allPanels

  usePanelStore.setState({ panels: ordered })
  localStorage.setItem('monoth-enabled-panels', JSON.stringify(layout.panels.map((p) => p.id)))
  localStorage.setItem('monoth-panel-order', JSON.stringify(ordered.map((p) => p.id)))

  // Apply spans
  const newSpans: Record<string, { col: number; row: number }> = {}
  for (const lp of layout.panels) {
    newSpans[lp.id] = { col: lp.col, row: lp.row }
  }
  useSpanStore.setState({ spans: newSpans })
  localStorage.setItem('monoth-panel-spans', JSON.stringify(newSpans))
}
