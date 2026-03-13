import { create } from 'zustand'

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
  layouts: Layout[]
  sidebarOpen: boolean
  layoutLocked: boolean
  setLayouts: (layouts: Layout[]) => void
  toggleSidebar: () => void
  toggleLock: () => void
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  layouts: [],
  sidebarOpen: true,
  layoutLocked: false,
  setLayouts: (layouts) => set({ layouts }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleLock: () => set((s) => ({ layoutLocked: !s.layoutLocked })),
}))
