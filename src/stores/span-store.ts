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
    if (!localStorage.getItem('monoth-spans-reset-v3')) {
      localStorage.removeItem(LS_KEY)
      localStorage.setItem('monoth-spans-reset-v3', '1')
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

const DEFAULT_SPANS: Record<string, SpanConfig> = {
  // 3×2 — full-width tables + panels with 8+ tabs
  'stock-screener':      { col: 3, row: 2 },
  'options-chain':       { col: 3, row: 2 },
  'central-banks':       { col: 3, row: 2 },
  // 2×2 — charts, matrices, rich multi-tab panels
  'market-video':        { col: 2, row: 2 },
  'live-markets':        { col: 2, row: 2 },
  'headlines':           { col: 2, row: 2 },
  'sector-heatmap':      { col: 2, row: 2 },
  'market-radar':        { col: 2, row: 2 },
  'correlation-engine':  { col: 2, row: 2 },
  'crypto':              { col: 2, row: 2 },
  'economic-data':       { col: 2, row: 2 },
  'btc-etf':             { col: 2, row: 2 },
  'ai-insights':         { col: 2, row: 2 },
  'fundamentals':        { col: 2, row: 2 },
  'forex':               { col: 2, row: 2 },
  'stablecoins':         { col: 2, row: 2 },
  'fintech-news':        { col: 2, row: 2 },
  // 2×1 — wide but compact data tables
  'fixed-income':        { col: 2, row: 1 },
  'commodities':         { col: 2, row: 1 },
  'earnings-calendar':   { col: 2, row: 1 },
  'analyst-ratings':     { col: 2, row: 1 },
  'insider-trading':     { col: 2, row: 1 },
  'economic-calendar':   { col: 2, row: 1 },
  'daily-brief':         { col: 2, row: 1 },
  'watchlist':           { col: 2, row: 1 },
  'macro-signals':       { col: 2, row: 1 },
  'real-estate':         { col: 2, row: 1 },
  'supply-chain':        { col: 2, row: 1 },
  'ipos-earnings':       { col: 2, row: 1 },
  'derivatives-news':    { col: 2, row: 1 },
  // everything else: 1×1 (default, not listed here)
}

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
