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
    if (!localStorage.getItem('monoth-spans-reset-v4')) {
      localStorage.removeItem(LS_KEY)
      localStorage.setItem('monoth-spans-reset-v4', '1')
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
  // 3×2 — multi-column tables that need full width
  'stock-screener':        { col: 3, row: 2 },
  'options-chain':         { col: 3, row: 2 },
  // 2×2 — everything else
  'market-video':          { col: 2, row: 2 },
  'live-markets':          { col: 2, row: 2 },
  'headlines':             { col: 2, row: 2 },
  'forex':                 { col: 2, row: 2 },
  'fixed-income':          { col: 2, row: 2 },
  'commodities':           { col: 2, row: 2 },
  'crypto':                { col: 2, row: 2 },
  'central-banks':         { col: 2, row: 2 },
  'economic-data':         { col: 2, row: 2 },
  'sector-heatmap':        { col: 2, row: 2 },
  'market-radar':          { col: 2, row: 2 },
  'correlation-engine':    { col: 2, row: 2 },
  'macro-signals':         { col: 2, row: 2 },
  'world-clock':           { col: 2, row: 2 },
  'ipos-earnings':         { col: 2, row: 2 },
  'derivatives-news':      { col: 2, row: 2 },
  'fintech-news':          { col: 2, row: 2 },
  'regulation':            { col: 2, row: 2 },
  'hedge-funds-news':      { col: 2, row: 2 },
  'market-analysis-news':  { col: 2, row: 2 },
  'btc-etf':               { col: 2, row: 2 },
  'stablecoins':           { col: 2, row: 2 },
  'geopolitics':           { col: 2, row: 2 },
  'real-estate':           { col: 2, row: 2 },
  'energy':                { col: 2, row: 2 },
  'volatility':            { col: 2, row: 2 },
  'bond-news':             { col: 2, row: 2 },
  'predictions':           { col: 2, row: 2 },
  'daily-brief':           { col: 2, row: 2 },
  'supply-chain':          { col: 2, row: 2 },
  'watchlist':             { col: 2, row: 2 },
  'ai-insights':           { col: 2, row: 2 },
  'export':                { col: 2, row: 2 },
  'earnings-calendar':     { col: 2, row: 2 },
  'analyst-ratings':       { col: 2, row: 2 },
  'insider-trading':       { col: 2, row: 2 },
  'economic-calendar':     { col: 2, row: 2 },
  'stock-analysis':        { col: 2, row: 2 },
  'trade-policy':          { col: 2, row: 2 },
  'fundamentals':          { col: 2, row: 2 },
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
