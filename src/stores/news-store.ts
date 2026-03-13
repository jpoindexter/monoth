import { create } from 'zustand'
import type { NewsItem } from '@/types'

interface NewsStore {
  items: NewsItem[]
  activeCategory: string | null
  setItems: (items: NewsItem[]) => void
  addItems: (items: NewsItem[]) => void
  setCategory: (category: string | null) => void
  filteredItems: () => NewsItem[]
}

export const useNewsStore = create<NewsStore>((set, get) => ({
  items: [],
  activeCategory: null,
  setItems: (items) => set({ items }),
  addItems: (newItems) =>
    set((s) => {
      const existing = new Set(s.items.map((i) => i.id))
      const unique = newItems.filter((i) => !existing.has(i.id))
      return { items: [...unique, ...s.items].sort((a, b) => b.published - a.published) }
    }),
  setCategory: (category) => set({ activeCategory: category }),
  filteredItems: () => {
    const { items, activeCategory } = get()
    return activeCategory ? items.filter((i) => i.category === activeCategory) : items
  },
}))
