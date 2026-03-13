import { create } from 'zustand'

const LS_KEY = 'monoth-panel-spans'

interface SpanConfig {
  col: number // 1, 2, or 3
  row: number // 1, 2, or 3
}

interface SpanStore {
  spans: Record<string, SpanConfig>
  getSpan: (id: string) => SpanConfig
  cycleSpan: (id: string) => void
  setSpan: (id: string, col: number, row: number) => void
}

function loadSpans(): Record<string, SpanConfig> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveSpans(spans: Record<string, SpanConfig>) {
  localStorage.setItem(LS_KEY, JSON.stringify(spans))
}

const CYCLE: SpanConfig[] = [
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 2, row: 2 },
  { col: 3, row: 2 },
]

export const useSpanStore = create<SpanStore>((set, get) => ({
  spans: loadSpans(),
  getSpan: (id) => get().spans[id] ?? { col: 1, row: 1 },
  cycleSpan: (id) => {
    const current = get().spans[id] ?? { col: 1, row: 1 }
    const idx = CYCLE.findIndex((s) => s.col === current.col && s.row === current.row)
    const next = CYCLE[(idx + 1) % CYCLE.length]
    const spans = { ...get().spans, [id]: next }
    if (next.col === 1 && next.row === 1) {
      delete spans[id]
    }
    saveSpans(spans)
    set({ spans })
  },
  setSpan: (id, col, row) => {
    const spans = { ...get().spans, [id]: { col, row } }
    if (col === 1 && row === 1) {
      delete spans[id]
    }
    saveSpans(spans)
    set({ spans })
  },
}))
