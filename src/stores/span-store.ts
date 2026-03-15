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
    // Clear spans so new DEFAULT_SPANS take effect
    if (!localStorage.getItem('monoth-spans-reset-v5')) {
      localStorage.removeItem(LS_KEY)
      localStorage.setItem('monoth-spans-reset-v5', '1')
      return {}
    }
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

// All panels default to 1×1. Only override here if a panel truly needs more space.
const DEFAULT_SPANS: Record<string, SpanConfig> = {}

export const useSpanStore = create<SpanStore>((set, get) => ({
  spans: loadSpans(),
  getSpan: (id) => get().spans[id] ?? DEFAULT_SPANS[id] ?? { col: 1, row: 1 },
  cycleSpan: (id) => {
    const current = get().spans[id] ?? DEFAULT_SPANS[id] ?? { col: 1, row: 1 }
    const idx = CYCLE.findIndex((s) => s.col === current.col && s.row === current.row)
    const next = CYCLE[(idx + 1) % CYCLE.length] ?? { col: 1, row: 1 }
    const def = DEFAULT_SPANS[id] ?? { col: 1, row: 1 }
    const { [id]: _removed, ...rest } = get().spans
    const spans: Record<string, SpanConfig> = next.col === def.col && next.row === def.row
      ? rest
      : { ...rest, [id]: next }
    saveSpans(spans)
    set({ spans })
  },
  setSpan: (id, col, row) => {
    const def = DEFAULT_SPANS[id] ?? { col: 1, row: 1 }
    const { [id]: _removed, ...rest } = get().spans
    const spans: Record<string, SpanConfig> = col === def.col && row === def.row
      ? rest
      : { ...rest, [id]: { col, row } }
    saveSpans(spans)
    set({ spans })
  },
}))
