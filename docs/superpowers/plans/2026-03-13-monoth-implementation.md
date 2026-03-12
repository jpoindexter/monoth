# Monoth Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a free, data-dense finance dashboard with 22 panels, a correlation engine, and freemium monetization.

**Architecture:** Vite 8 SPA with React 19, shadcn/ui panel grid, Vercel serverless API routes as caching proxies to free financial APIs, Supabase for auth/state, Zustand for client state.

**Tech Stack:** Vite 8, React 19, TypeScript (strict), shadcn/ui (new-york), Tailwind CSS, Zustand, react-grid-layout, Lightweight Charts, Recharts, Supabase, Stripe, Vercel

**Spec:** `docs/superpowers/specs/2026-03-12-monoth-design.md`

**Testing:** No tests in MVP. Ship first.

---

## Chunk 1: Foundation (Phase 1)

### Task 1: Scaffold Vite 8 + React + TypeScript project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`, `src/App.tsx`
- Create: `src/vite-env.d.ts`
- Create: `.gitignore`, `.env.example`

- [ ] **Step 1: Create Vite project with React + TypeScript template**

```bash
cd /Users/jasonpoindexter/Documents/GitHub/monoth
npm create vite@latest . -- --template react-ts
```

If the directory isn't empty, move docs out, scaffold, move docs back.

- [ ] **Step 2: Install core dependencies**

```bash
npm install react-router-dom zustand @tanstack/react-query
npm install -D @types/node
```

- [ ] **Step 3: Configure TypeScript strict mode**

In `tsconfig.app.json`, ensure:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

- [ ] **Step 4: Configure Vite path aliases and dev proxy**

In `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
```

**Important:** For local development with API routes, run `npx vercel dev` (port 3000) alongside `npm run dev` (Vite on port 5173). The proxy forwards `/api/*` calls from Vite to the Vercel dev server.

- [ ] **Step 5: Create `.env.example`**

```
# Client-side (Vite requires VITE_ prefix)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SENTRY_DSN=

# Server-side (Vercel API routes only -- never exposed to client)
FINNHUB_API_KEY=
FRED_API_KEY=
KV_REST_API_URL=
KV_REST_API_TOKEN=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

- [ ] **Step 6: Update `.gitignore`**

Ensure it includes: `node_modules`, `dist`, `.env`, `.env.local`, `.vercel`

- [ ] **Step 7: Verify dev server runs**

```bash
npm run dev
```

Expected: Vite dev server starts on localhost, shows default React page.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: scaffold Vite 8 + React 19 + TypeScript project"
```

---

### Task 2: Install and configure shadcn/ui

**Files:**
- Modify: `package.json` (new deps)
- Create: `src/lib/utils.ts`
- Create: `components.json`
- Create: `src/styles/globals.css`
- Create: `src/components/ui/` (shadcn primitives)

- [ ] **Step 1: Install Tailwind CSS v4**

```bash
npm install tailwindcss @tailwindcss/vite
```

Add Tailwind plugin to `vite.config.ts`:
```typescript
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ...
})
```

- [ ] **Step 2: Create globals.css with Tailwind import and shadcn CSS variables**

Create `src/styles/globals.css` with:
```css
@import "tailwindcss";
```

Import it in `src/main.tsx`:
```typescript
import './styles/globals.css'
```

- [ ] **Step 3: Initialize shadcn/ui with preset**

First, go to https://ui.shadcn.com/themes and create a preset:
- Style: new-york
- Base color: zinc
- Radius: 0.5rem
- Icon library: lucide
- Copy the preset code

Then init with the preset:
```bash
npx shadcn@latest init -t vite --preset [YOUR_PRESET_CODE]
```

If you don't have a preset code, fall back to interactive init:
```bash
npx shadcn@latest init -t vite
```
Select: new-york style, zinc base color, CSS variables enabled.

This creates `components.json` and `src/lib/utils.ts`.

- [ ] **Step 4: Install core shadcn components**

```bash
npx shadcn@latest add card button badge tabs command sheet tooltip skeleton table separator scroll-area dropdown-menu dialog input label switch avatar popover chart
```

Note: `chart` adds Recharts integration + chart CSS variables for themed chart colors.

- [ ] **Step 5: Create ThemeProvider component**

`src/components/theme-provider.tsx`:
```typescript
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system",
  setTheme: () => null,
})

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "monoth-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches ? "dark" : "light"
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext {...props} value={value}>
      {children}
    </ThemeProviderContext>
  )
}

export const useTheme = () => useContext(ThemeProviderContext)
```

- [ ] **Step 6: Add finance-specific chart CSS variables**

Append to `src/styles/globals.css`:
```css
@layer base {
  :root {
    --chart-1: oklch(0.646 0.222 41.116);
    --chart-2: oklch(0.6 0.118 184.704);
    --chart-3: oklch(0.398 0.07 227.392);
    --chart-4: oklch(0.828 0.189 84.429);
    --chart-5: oklch(0.769 0.188 70.08);
    --positive: oklch(0.723 0.219 149.579);
    --negative: oklch(0.577 0.245 27.325);
  }

  .dark {
    --chart-1: oklch(0.488 0.243 264.376);
    --chart-2: oklch(0.696 0.17 162.48);
    --chart-3: oklch(0.769 0.188 70.08);
    --chart-4: oklch(0.627 0.265 303.9);
    --chart-5: oklch(0.645 0.246 16.439);
    --positive: oklch(0.723 0.219 149.579);
    --negative: oklch(0.577 0.245 27.325);
  }
}
```

- [ ] **Step 7: Create ModeToggle component**

`src/components/mode-toggle.tsx`:
```typescript
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
  const { setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 8: Wire ThemeProvider into App**

Wrap the app root with `<ThemeProvider defaultTheme="dark">`.

- [ ] **Step 9: Verify shadcn renders**

Update `src/App.tsx` to render a `<Card>` and `<Button>`. Check it renders correctly in dark mode. Toggle to light mode with ModeToggle.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat: configure shadcn/ui with preset, theme provider, chart colors, mode toggle"
```

---

### Task 3: Types and config foundation

**Files:**
- Create: `src/types/market.ts`
- Create: `src/types/news.ts`
- Create: `src/types/panels.ts`
- Create: `src/types/index.ts`
- Create: `src/config/panels.ts`
- Create: `src/config/feeds.ts`

- [ ] **Step 1: Create market data types**

`src/types/market.ts`:
```typescript
export interface MarketDataPoint {
  symbol: string
  name?: string
  price: number
  change: number
  changePercent: number
  volume?: number
  timestamp: number
  source: string
}

export interface ForexRate {
  pair: string
  rate: number
  change: number
  changePercent: number
  timestamp: number
}

export interface CryptoAsset {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
  marketCap: number
  volume24h: number
  rank: number
}

export interface MacroSignal {
  indicator: string
  value: number
  previous: number
  expected?: number
  surprise?: number
  impact: 'high' | 'medium' | 'low'
  timestamp: number
  correlatedAssets?: string[]
}

export interface YieldData {
  maturity: string
  yield: number
  change: number
  timestamp: number
}
```

- [ ] **Step 2: Create news types**

`src/types/news.ts`:
```typescript
export interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  published: number
  category: string
  sentiment?: number
  relatedSymbols?: string[]
}

export interface FeedConfig {
  name: string
  url: string
  category: string
}
```

- [ ] **Step 3: Create panel types**

`src/types/panels.ts`:
```typescript
export type PanelId =
  | 'live-markets' | 'headlines' | 'forex' | 'fixed-income'
  | 'commodities' | 'crypto' | 'central-banks' | 'economic-data'
  | 'sector-heatmap' | 'market-radar' | 'correlation-engine'
  | 'ipos-earnings' | 'derivatives-news' | 'fintech-news'
  | 'regulation' | 'hedge-funds-news' | 'market-analysis-news'
  | 'btc-etf' | 'stablecoins'
  | 'watchlist' | 'ai-insights' | 'export'

export type PanelTier = 1 | 2 | 3

export interface PanelConfig {
  id: PanelId
  name: string
  tier: PanelTier
  enabled: boolean
  defaultWidth: number   // grid units (1-12)
  defaultHeight: number  // grid units
  minWidth?: number
  minHeight?: number
}
```

- [ ] **Step 4: Create barrel export**

`src/types/index.ts`:
```typescript
export * from './market'
export * from './news'
export * from './panels'
```

- [ ] **Step 5: Create panel registry config**

`src/config/panels.ts`: Define all 22 panels with their PanelConfig. Tier 1 panels enabled by default, Tier 2-3 disabled.

```typescript
import type { PanelConfig } from '@/types'

export const PANELS: PanelConfig[] = [
  // Tier 1
  { id: 'live-markets', name: 'Live Markets', tier: 1, enabled: true, defaultWidth: 6, defaultHeight: 4 },
  { id: 'headlines', name: 'Market Headlines', tier: 1, enabled: true, defaultWidth: 6, defaultHeight: 4 },
  { id: 'forex', name: 'Forex & Currencies', tier: 1, enabled: true, defaultWidth: 4, defaultHeight: 3 },
  { id: 'fixed-income', name: 'Fixed Income', tier: 1, enabled: true, defaultWidth: 4, defaultHeight: 3 },
  { id: 'commodities', name: 'Commodities & Futures', tier: 1, enabled: true, defaultWidth: 4, defaultHeight: 3 },
  { id: 'crypto', name: 'Crypto & Digital Assets', tier: 1, enabled: true, defaultWidth: 6, defaultHeight: 4 },
  { id: 'central-banks', name: 'Central Bank Watch', tier: 1, enabled: true, defaultWidth: 4, defaultHeight: 3 },
  { id: 'economic-data', name: 'Economic Data', tier: 1, enabled: true, defaultWidth: 6, defaultHeight: 4 },
  { id: 'sector-heatmap', name: 'Sector Heatmap', tier: 1, enabled: true, defaultWidth: 6, defaultHeight: 4 },
  { id: 'market-radar', name: 'Market Radar', tier: 1, enabled: true, defaultWidth: 4, defaultHeight: 3 },
  { id: 'correlation-engine', name: 'Correlation Engine', tier: 1, enabled: true, defaultWidth: 6, defaultHeight: 4 },
  // Tier 2
  { id: 'ipos-earnings', name: 'IPOs, Earnings & M&A', tier: 2, enabled: false, defaultWidth: 4, defaultHeight: 3 },
  { id: 'derivatives-news', name: 'Derivatives & Options News', tier: 2, enabled: false, defaultWidth: 4, defaultHeight: 3 },
  { id: 'fintech-news', name: 'Fintech & Trading Tech', tier: 2, enabled: false, defaultWidth: 4, defaultHeight: 3 },
  { id: 'regulation', name: 'Financial Regulation', tier: 2, enabled: false, defaultWidth: 4, defaultHeight: 3 },
  { id: 'hedge-funds-news', name: 'Hedge Funds & PE News', tier: 2, enabled: false, defaultWidth: 4, defaultHeight: 3 },
  { id: 'market-analysis-news', name: 'Market Analysis News', tier: 2, enabled: false, defaultWidth: 4, defaultHeight: 3 },
  { id: 'btc-etf', name: 'BTC ETF Tracker', tier: 2, enabled: false, defaultWidth: 4, defaultHeight: 3 },
  { id: 'stablecoins', name: 'Stablecoins', tier: 2, enabled: false, defaultWidth: 4, defaultHeight: 3 },
  // Tier 3
  { id: 'watchlist', name: 'Watchlist', tier: 3, enabled: false, defaultWidth: 4, defaultHeight: 4 },
  { id: 'ai-insights', name: 'AI Market Insights', tier: 3, enabled: false, defaultWidth: 6, defaultHeight: 4 },
  { id: 'export', name: 'Export', tier: 3, enabled: false, defaultWidth: 4, defaultHeight: 3 },
]
```

- [ ] **Step 6: Create feed config**

`src/config/feeds.ts`: Define RSS feed URLs per category, using the same Google News RSS proxy pattern from the spec.

```typescript
import type { FeedConfig } from '@/types'

const gn = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`

export const FEEDS: Record<string, FeedConfig[]> = {
  markets: [
    { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'markets' },
    { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/rss/topstories', category: 'markets' },
    { name: 'Seeking Alpha', url: 'https://seekingalpha.com/market_currents.xml', category: 'markets' },
    { name: 'Reuters Markets', url: gn('site:reuters.com markets stocks when:1d'), category: 'markets' },
    { name: 'Bloomberg Markets', url: gn('site:bloomberg.com markets when:1d'), category: 'markets' },
  ],
  crypto: [
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'crypto' },
    { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss', category: 'crypto' },
    { name: 'Crypto News', url: gn('bitcoin OR ethereum OR crypto when:1d'), category: 'crypto' },
  ],
  forex: [
    { name: 'Forex News', url: gn('"forex" OR "currency" OR "FX market" trading when:1d'), category: 'forex' },
    { name: 'Central Bank Rates', url: gn('"central bank" OR "interest rate" OR "rate decision" when:2d'), category: 'forex' },
  ],
  bonds: [
    { name: 'Bond Market', url: gn('"bond market" OR "treasury yields" OR "fixed income" when:2d'), category: 'bonds' },
  ],
  commodities: [
    { name: 'Oil & Gas', url: gn('oil price OR OPEC OR "crude oil" OR WTI OR Brent when:1d'), category: 'commodities' },
    { name: 'Gold & Metals', url: gn('gold price OR silver price OR copper OR "precious metals" when:2d'), category: 'commodities' },
  ],
  centralbanks: [
    { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml', category: 'centralbanks' },
    { name: 'ECB Watch', url: gn('"European Central Bank" OR ECB monetary policy when:3d'), category: 'centralbanks' },
    { name: 'Global Central Banks', url: gn('"rate hike" OR "rate cut" OR "interest rate decision" central bank when:3d'), category: 'centralbanks' },
  ],
  economic: [
    { name: 'Economic Data', url: gn('CPI OR inflation OR GDP OR "jobs report" OR PMI when:2d'), category: 'economic' },
    { name: 'Trade & Tariffs', url: gn('tariff OR "trade war" OR sanctions when:2d'), category: 'economic' },
  ],
  ipo: [
    { name: 'IPO News', url: gn('IPO OR "initial public offering" OR SPAC when:3d'), category: 'ipo' },
    { name: 'Earnings Reports', url: gn('"earnings report" OR "quarterly earnings" when:2d'), category: 'ipo' },
    { name: 'M&A News', url: gn('"merger" OR "acquisition" OR "takeover bid" billion when:3d'), category: 'ipo' },
  ],
  derivatives: [
    { name: 'Options Market', url: gn('"options market" OR "options trading" OR VIX when:2d'), category: 'derivatives' },
  ],
  fintech: [
    { name: 'Fintech News', url: gn('fintech OR "digital banking" OR neobank when:3d'), category: 'fintech' },
  ],
  regulation: [
    { name: 'SEC', url: 'https://www.sec.gov/news/pressreleases.rss', category: 'regulation' },
    { name: 'Financial Regulation', url: gn('SEC OR CFTC OR FINRA regulation OR enforcement when:3d'), category: 'regulation' },
  ],
  hedgefunds: [
    { name: 'Hedge Fund News', url: gn('"hedge fund" OR Bridgewater OR Citadel when:7d'), category: 'hedgefunds' },
    { name: 'Private Equity', url: gn('"private equity" OR Blackstone OR KKR when:3d'), category: 'hedgefunds' },
  ],
  analysis: [
    { name: 'Market Outlook', url: gn('"market outlook" OR "stock market forecast" when:3d'), category: 'analysis' },
    { name: 'Bank Research', url: gn('"Goldman Sachs" OR "JPMorgan" OR "Morgan Stanley" forecast when:3d'), category: 'analysis' },
  ],
}
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add types, panel registry, and feed configs"
```

---

### Task 4: Zustand stores

**Files:**
- Create: `src/stores/panel-store.ts`
- Create: `src/stores/layout-store.ts`
- Create: `src/stores/market-store.ts`
- Create: `src/stores/news-store.ts`
- Create: `src/stores/user-store.ts`
- Create: `src/stores/index.ts`

- [ ] **Step 1: Create panel store**

`src/stores/panel-store.ts`:
```typescript
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
```

- [ ] **Step 2: Create layout store**

`src/stores/layout-store.ts`:
```typescript
import { create } from 'zustand'
import type { Layout } from 'react-grid-layout'

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
```

- [ ] **Step 3: Create market store**

`src/stores/market-store.ts`:
```typescript
import { create } from 'zustand'
import type { MarketDataPoint, ForexRate, CryptoAsset, MacroSignal, YieldData } from '@/types'

interface MarketStore {
  indices: MarketDataPoint[]
  forex: ForexRate[]
  crypto: CryptoAsset[]
  commodities: MarketDataPoint[]
  yields: YieldData[]
  macroSignals: MacroSignal[]
  lastRefresh: Record<string, number>

  setIndices: (data: MarketDataPoint[]) => void
  setForex: (data: ForexRate[]) => void
  setCrypto: (data: CryptoAsset[]) => void
  setCommodities: (data: MarketDataPoint[]) => void
  setYields: (data: YieldData[]) => void
  setMacroSignals: (data: MacroSignal[]) => void
  markRefresh: (key: string) => void
}

export const useMarketStore = create<MarketStore>((set) => ({
  indices: [],
  forex: [],
  crypto: [],
  commodities: [],
  yields: [],
  macroSignals: [],
  lastRefresh: {},

  setIndices: (data) => set({ indices: data }),
  setForex: (data) => set({ forex: data }),
  setCrypto: (data) => set({ crypto: data }),
  setCommodities: (data) => set({ commodities: data }),
  setYields: (data) => set({ yields: data }),
  setMacroSignals: (data) => set({ macroSignals: data }),
  markRefresh: (key) =>
    set((s) => ({ lastRefresh: { ...s.lastRefresh, [key]: Date.now() } })),
}))
```

- [ ] **Step 4: Create news store**

`src/stores/news-store.ts`:
```typescript
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
```

- [ ] **Step 5: Create user store**

`src/stores/user-store.ts`:
```typescript
import { create } from 'zustand'

type Tier = 'free' | 'pro' | 'api' | 'enterprise'

interface UserStore {
  authenticated: boolean
  tier: Tier
  watchlist: string[]
  theme: 'dark' | 'light'
  setAuthenticated: (auth: boolean) => void
  setTier: (tier: Tier) => void
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void
  toggleTheme: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  authenticated: false,
  tier: 'free',
  watchlist: [],
  theme: 'dark',
  setAuthenticated: (authenticated) => set({ authenticated }),
  setTier: (tier) => set({ tier }),
  addToWatchlist: (symbol) =>
    set((s) => ({ watchlist: [...s.watchlist, symbol] })),
  removeFromWatchlist: (symbol) =>
    set((s) => ({ watchlist: s.watchlist.filter((s2) => s2 !== symbol) })),
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
}))
```

- [ ] **Step 6: Create barrel export**

`src/stores/index.ts`:
```typescript
export { usePanelStore } from './panel-store'
export { useLayoutStore } from './layout-store'
export { useMarketStore } from './market-store'
export { useNewsStore } from './news-store'
export { useUserStore } from './user-store'
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add Zustand stores for panels, layout, market, news, user"
```

---

### Task 5: App shell and layout system

**Files:**
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/TopBar.tsx`
- Create: `src/components/layout/PanelGrid.tsx`
- Create: `src/components/layout/PanelWrapper.tsx`
- Create: `src/components/layout/DashboardLayout.tsx`
- Create: `src/pages/Dashboard.tsx`
- Create: `src/pages/Landing.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Install react-grid-layout**

```bash
npm install react-grid-layout
npm install -D @types/react-grid-layout
```

- [ ] **Step 2: Create PanelWrapper component**

`src/components/layout/PanelWrapper.tsx`: A Card-based wrapper for every panel. Shows panel name in header, loading skeleton when data isn't ready, error state with retry button.

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface PanelWrapperProps {
  title: string
  children: React.ReactNode
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export function PanelWrapper({ title, children, loading, error, onRetry }: PanelWrapperProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="py-2 px-3 flex-none">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-3 pt-0">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <p className="text-sm">Data unavailable</p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            )}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create Sidebar**

`src/components/layout/Sidebar.tsx`: Collapsible sidebar listing all panels grouped by tier. Toggle to enable/disable panels. Uses shadcn ScrollArea + Switch.

- [ ] **Step 4: Create TopBar**

`src/components/layout/TopBar.tsx`: Top bar with app name, Cmd+K search trigger, market status indicator (open/closed), theme toggle, user menu.

- [ ] **Step 5: Create PanelGrid**

`src/components/layout/PanelGrid.tsx`: Uses `react-grid-layout` `<ResponsiveGridLayout>`. Reads enabled panels from `usePanelStore`, generates layout from panel configs, renders each panel inside `<PanelWrapper>`. Saves layout changes to `useLayoutStore`. Respects `layoutLocked`.

```typescript
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import { usePanelStore, useLayoutStore } from '@/stores'
import { PanelWrapper } from './PanelWrapper'
import { PanelRenderer } from '@/components/panels'

const ResponsiveGridLayout = WidthProvider(Responsive)

export function PanelGrid() {
  const panels = usePanelStore((s) => s.panels.filter((p) => p.enabled))
  const { layouts, setLayouts, layoutLocked } = useLayoutStore()

  const defaultLayouts = panels.map((p, i) => ({
    i: p.id,
    x: (i * p.defaultWidth) % 12,
    y: Math.floor((i * p.defaultWidth) / 12) * p.defaultHeight,
    w: p.defaultWidth,
    h: p.defaultHeight,
    minW: p.minWidth ?? 2,
    minH: p.minHeight ?? 2,
  }))

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layouts.length ? layouts : defaultLayouts }}
      breakpoints={{ lg: 1200, md: 996, sm: 768 }}
      cols={{ lg: 12, md: 8, sm: 4 }}
      rowHeight={80}
      isDraggable={!layoutLocked}
      isResizable={!layoutLocked}
      onLayoutChange={(layout) => setLayouts(layout)}
    >
      {panels.map((panel) => (
        <div key={panel.id}>
          <PanelRenderer panelId={panel.id} panelName={panel.name} />
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}
```

- [ ] **Step 6: Create DashboardLayout**

`src/components/layout/DashboardLayout.tsx`: Assembles TopBar + Sidebar + PanelGrid. Sidebar collapses on mobile.

- [ ] **Step 7: Create placeholder pages**

`src/pages/Landing.tsx`: Simple landing page placeholder (will be built out in Phase 5).

`src/pages/Dashboard.tsx`: Renders `<DashboardLayout />`.

- [ ] **Step 8: Create panel renderer stub**

`src/components/panels/index.tsx`: A `PanelRenderer` component that takes a `panelId` and renders the matching panel component. For now, all panels render a placeholder with their name.

```typescript
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import type { PanelId } from '@/types'

interface PanelRendererProps {
  panelId: PanelId
  panelName: string
}

export function PanelRenderer({ panelId, panelName }: PanelRendererProps) {
  // Each panel will be lazy-loaded here as we build them
  return (
    <PanelWrapper title={panelName}>
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        {panelName} — coming soon
      </div>
    </PanelWrapper>
  )
}
```

- [ ] **Step 9: Wire up routing in App.tsx**

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Landing } from '@/pages/Landing'
import { Dashboard } from '@/pages/Dashboard'

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
```

The `/symbol/:ticker` detail sheet and `/dashboard?layout=<id>` saved layout URL are deferred to Phase 4 (Task 23) when Supabase auth and preferences are wired up.

- [ ] **Step 10: Verify dashboard renders with panel grid**

```bash
npm run dev
```

Navigate to `/dashboard`. Should see: sidebar with panel list, top bar, grid of placeholder cards.

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "feat: add dashboard layout with sidebar, topbar, and panel grid system"
```

---

### Task 6: Deploy empty shell to Vercel

**Files:**
- Create: `vercel.json`
- Create: `api/health.ts`

- [ ] **Step 1: Create vercel.json**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 2: Create health endpoint**

`api/health.ts`:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      finnhub: 'unchecked',
      coingecko: 'unchecked',
      fred: 'unchecked',
      frankfurter: 'unchecked',
    },
  })
}
```

- [ ] **Step 3: Install Vercel Node types**

```bash
npm install -D @vercel/node
```

- [ ] **Step 4: Deploy to Vercel**

```bash
npx vercel --prod
```

Link to project, confirm settings.

- [ ] **Step 5: Verify deployment**

Check the deployed URL loads the dashboard shell. Check `/api/health` returns JSON.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add Vercel config and health endpoint, deploy shell"
```

---

## Chunk 2: Core Data Layer (Phase 2)

### Task 7: Caching utilities for Vercel API routes

**Files:**
- Create: `api/_cache.ts`
- Create: `api/_cors.ts`

- [ ] **Step 1: Create CORS helper**

`api/_cors.ts`:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'

const ALLOWED_ORIGINS = [
  /^https?:\/\/.*\.monoth\.app$/,
  /^https?:\/\/monoth\.app$/,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/.*\.vercel\.app$/,
]

export function cors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin ?? ''
  const allowed = ALLOWED_ORIGINS.some((re) => re.test(origin))

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}
```

- [ ] **Step 2: Create cache helper**

`api/_cache.ts`: A simple in-memory cache with TTL for serverless functions. Falls back to fetching from upstream when cache misses.

```typescript
interface CacheEntry<T> {
  data: T
  expiry: number
}

const cache = new Map<string, CacheEntry<unknown>>()

export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<{ data: T; stale: boolean }> {
  const entry = cache.get(key) as CacheEntry<T> | undefined

  if (entry && entry.expiry > Date.now()) {
    return { data: entry.data, stale: false }
  }

  try {
    const data = await fetcher()
    cache.set(key, { data, expiry: Date.now() + ttlMs })
    return { data, stale: false }
  } catch (err) {
    // Stale-while-revalidate: return stale data if upstream fails
    if (entry) {
      return { data: entry.data, stale: true }
    }
    throw err
  }
}
```

Note: In-memory cache works per serverless instance. For cross-instance caching, upgrade to Vercel KV later.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add CORS and caching utilities for API routes"
```

---

### Task 8: Finnhub API route (indices, stocks, sectors)

**Files:**
- Create: `api/market/indices.ts`
- Create: `api/market/quote.ts`

- [ ] **Step 1: Create indices endpoint**

`api/market/indices.ts`: Fetches major index quotes from Finnhub. Caches 30s.

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors'
import { cached } from '../_cache'

const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^FTSE', name: 'FTSE 100' },
  { symbol: '^N225', name: 'Nikkei 225' },
  { symbol: '^GDAXI', name: 'DAX' },
  { symbol: '^HSI', name: 'Hang Seng' },
]

async function fetchQuote(symbol: string) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${process.env.FINNHUB_API_KEY}`
  )
  if (!res.ok) throw new Error(`Finnhub error: ${res.status}`)
  return res.json()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    const { data, stale } = await cached('indices', 30_000, async () => {
      const quotes = await Promise.all(
        INDICES.map(async ({ symbol, name }) => {
          const q = await fetchQuote(symbol)
          return {
            symbol,
            name,
            price: q.c,
            change: q.d,
            changePercent: q.dp,
            high: q.h,
            low: q.l,
            open: q.o,
            previousClose: q.pc,
            timestamp: q.t * 1000,
            source: 'finnhub',
          }
        })
      )
      return quotes
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch indices' })
  }
}
```

- [ ] **Step 2: Create quote endpoint**

`api/market/quote.ts`: Takes `?symbols=AAPL,MSFT,GOOG` query param. Fetches quotes from Finnhub. Caches per symbol 30s.

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors'
import { cached } from '../_cache'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const symbols = (req.query.symbols as string)?.split(',').filter(Boolean) ?? []
  if (!symbols.length) return res.status(400).json({ error: 'symbols param required' })

  try {
    const quotes = await Promise.all(
      symbols.map((symbol) =>
        cached(`quote:${symbol}`, 30_000, async () => {
          const r = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${process.env.FINNHUB_API_KEY}`
          )
          if (!r.ok) throw new Error(`Finnhub error: ${r.status}`)
          const q = await r.json()
          return {
            symbol,
            price: q.c,
            change: q.d,
            changePercent: q.dp,
            volume: 0,
            timestamp: q.t * 1000,
            source: 'finnhub',
          }
        })
      )
    )
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    res.json(quotes.map((q) => q.data))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quotes' })
  }
}
```

- [ ] **Step 3: Create sector performance endpoint**

`api/market/sectors.ts`: Fetches S&P 500 sector performance from Finnhub. Caches 60s.

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors'
import { cached } from '../_cache'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    const { data, stale } = await cached('sectors', 60_000, async () => {
      // Finnhub doesn't have a direct sector endpoint on free tier.
      // Use sector ETFs as proxies: XLK (Tech), XLF (Financials), XLV (Health Care),
      // XLE (Energy), XLI (Industrials), XLY (Consumer Disc.), XLP (Consumer Staples),
      // XLU (Utilities), XLB (Materials), XLRE (Real Estate), XLC (Communication)
      const sectorETFs = [
        { symbol: 'XLK', name: 'Technology' },
        { symbol: 'XLF', name: 'Financials' },
        { symbol: 'XLV', name: 'Health Care' },
        { symbol: 'XLE', name: 'Energy' },
        { symbol: 'XLI', name: 'Industrials' },
        { symbol: 'XLY', name: 'Consumer Discretionary' },
        { symbol: 'XLP', name: 'Consumer Staples' },
        { symbol: 'XLU', name: 'Utilities' },
        { symbol: 'XLB', name: 'Materials' },
        { symbol: 'XLRE', name: 'Real Estate' },
        { symbol: 'XLC', name: 'Communication Services' },
      ]

      const quotes = await Promise.all(
        sectorETFs.map(async ({ symbol, name }) => {
          const r = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
          )
          const q = await r.json()
          return { symbol, name, price: q.c, change: q.d, changePercent: q.dp }
        })
      )
      return quotes
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sector data' })
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add Finnhub market data API routes (indices, quotes, sectors)"
```

---

### Task 9: CoinGecko API route (crypto)

**Files:**
- Create: `api/crypto/prices.ts`

- [ ] **Step 1: Create crypto prices endpoint**

`api/crypto/prices.ts`: Fetches top 50 coins by market cap from CoinGecko. Caches 60s.

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors'
import { cached } from '../_cache'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    const { data, stale } = await cached('crypto-top50', 60_000, async () => {
      const r = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h'
      )
      if (!r.ok) throw new Error(`CoinGecko error: ${r.status}`)
      const coins = await r.json()
      return coins.map((c: any) => ({
        id: c.id,
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        price: c.current_price,
        change24h: c.price_change_24h,
        changePercent24h: c.price_change_percentage_24h,
        marketCap: c.market_cap,
        volume24h: c.total_volume,
        rank: c.market_cap_rank,
      }))
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crypto prices' })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add CoinGecko crypto prices API route"
```

---

### Task 10: FRED API route (macro data, yields)

**Files:**
- Create: `api/macro/fred.ts`

- [ ] **Step 1: Create FRED endpoint**

`api/macro/fred.ts`: Fetches key macro series from FRED (CPI, GDP, unemployment, Fed funds rate, 10Y yield, 2Y yield). Takes `?series=CPIAUCSL,GDP` query param. Caches 1 hour.

Key FRED series IDs:
- `CPIAUCSL` (CPI)
- `GDP` (GDP)
- `UNRATE` (Unemployment)
- `FEDFUNDS` (Fed Funds Rate)
- `DGS10` (10Y Treasury)
- `DGS2` (2Y Treasury)
- `DGS30` (30Y Treasury)
- `DTWEXBGS` (Trade Weighted Dollar Index)

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add FRED macro data API route"
```

---

### Task 11: Frankfurter API route (forex)

**Files:**
- Create: `api/forex/rates.ts`

- [ ] **Step 1: Create forex endpoint**

`api/forex/rates.ts`: Fetches latest rates from Frankfurter.app. No API key needed. Caches 5 min.

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors'
import { cached } from '../_cache'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  try {
    const { data, stale } = await cached('forex-rates', 300_000, async () => {
      const [latest, yesterday] = await Promise.all([
        fetch('https://api.frankfurter.app/latest?from=USD').then((r) => r.json()),
        fetch(`https://api.frankfurter.app/${getYesterday()}?from=USD`).then((r) => r.json()),
      ])

      return Object.entries(latest.rates).map(([currency, rate]) => {
        const prevRate = (yesterday.rates as Record<string, number>)[currency] ?? rate
        const change = (rate as number) - prevRate
        return {
          pair: `USD/${currency}`,
          rate: rate as number,
          change,
          changePercent: prevRate ? (change / prevRate) * 100 : 0,
          timestamp: Date.now(),
        }
      })
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch forex rates' })
  }
}

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  // Skip weekends
  if (d.getDay() === 0) d.setDate(d.getDate() - 2)
  if (d.getDay() === 6) d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add Frankfurter forex rates API route"
```

---

### Task 12: RSS proxy API route (news)

**Files:**
- Create: `api/news/rss.ts`

- [ ] **Step 1: Install XML parser**

```bash
npm install fast-xml-parser
```

- [ ] **Step 2: Create RSS proxy endpoint**

`api/news/rss.ts`: Takes `?category=markets` query param. Fetches all feeds for that category, parses XML, normalizes, deduplicates, sorts. Caches 5 min.

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { XMLParser } from 'fast-xml-parser'
import { cors } from '../_cors'
import { cached } from '../_cache'

// Import feed config -- note: this is duplicated from src/config/feeds.ts
// because Vercel API routes can't import from src/. Keep in sync manually
// or move shared config to a shared/ directory.
import { FEED_URLS } from './_feed-urls'

const parser = new XMLParser({ ignoreAttributes: false })

interface RawRSSItem {
  title?: string
  link?: string
  pubDate?: string
  published?: string
  guid?: string | { '#text': string }
  description?: string
}

function parseRSSItems(xml: string, sourceName: string, category: string) {
  const parsed = parser.parse(xml)

  // Handle both RSS 2.0 (<rss><channel><item>) and Atom (<feed><entry>)
  const items: RawRSSItem[] =
    parsed?.rss?.channel?.item ??
    parsed?.feed?.entry ??
    []

  const itemArray = Array.isArray(items) ? items : [items]

  return itemArray.map((item) => {
    const url = typeof item.link === 'string'
      ? item.link
      : item.link?.['@_href'] ?? ''
    const guidStr = typeof item.guid === 'string'
      ? item.guid
      : item.guid?.['#text'] ?? url

    return {
      id: Buffer.from(guidStr || url).toString('base64').slice(0, 32),
      title: item.title ?? '',
      url,
      source: sourceName,
      published: new Date(item.pubDate ?? item.published ?? 0).getTime(),
      category,
    }
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const category = req.query.category as string
  if (!category || !FEED_URLS[category]) {
    return res.status(400).json({ error: 'Invalid category' })
  }

  try {
    const { data, stale } = await cached(`news:${category}`, 300_000, async () => {
      const feeds = FEED_URLS[category]
      const results = await Promise.allSettled(
        feeds.map(async ({ name, url }) => {
          const r = await fetch(url, { headers: { 'User-Agent': 'Monoth/1.0' } })
          if (!r.ok) return []
          const xml = await r.text()
          return parseRSSItems(xml, name, category)
        })
      )

      const allItems = results
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => (r as PromiseFulfilledResult<any[]>).value)

      // Deduplicate by URL
      const seen = new Set<string>()
      return allItems
        .filter((item) => {
          if (seen.has(item.url)) return false
          seen.add(item.url)
          return true
        })
        .sort((a, b) => b.published - a.published)
        .slice(0, 50) // cap at 50 items per category
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch news' })
  }
}
```

- [ ] **Step 3: Create feed URLs config for API routes**

`api/news/_feed-urls.ts`: Duplicate of the feed URL data from `src/config/feeds.ts` (Vercel API routes can't import from `src/`). Contains just the URL mappings.

```typescript
const gn = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`

export const FEED_URLS: Record<string, { name: string; url: string }[]> = {
  markets: [
    { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
    { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/rss/topstories' },
    { name: 'Reuters Markets', url: gn('site:reuters.com markets stocks when:1d') },
    { name: 'Bloomberg Markets', url: gn('site:bloomberg.com markets when:1d') },
  ],
  crypto: [
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
    { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
    { name: 'Crypto News', url: gn('bitcoin OR ethereum OR crypto when:1d') },
  ],
  forex: [
    { name: 'Forex News', url: gn('"forex" OR "currency" OR "FX market" when:1d') },
  ],
  bonds: [
    { name: 'Bond Market', url: gn('"bond market" OR "treasury yields" OR "fixed income" when:2d') },
  ],
  commodities: [
    { name: 'Oil & Gas', url: gn('oil price OR OPEC OR "crude oil" when:1d') },
    { name: 'Gold & Metals', url: gn('gold price OR silver price OR "precious metals" when:2d') },
  ],
  centralbanks: [
    { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml' },
    { name: 'Global Central Banks', url: gn('"rate hike" OR "rate cut" OR "interest rate decision" when:3d') },
  ],
  economic: [
    { name: 'Economic Data', url: gn('CPI OR inflation OR GDP OR "jobs report" OR PMI when:2d') },
  ],
  ipo: [
    { name: 'IPO News', url: gn('IPO OR "initial public offering" OR SPAC when:3d') },
    { name: 'Earnings', url: gn('"earnings report" OR "quarterly earnings" when:2d') },
    { name: 'M&A', url: gn('"merger" OR "acquisition" OR "takeover" billion when:3d') },
  ],
  derivatives: [
    { name: 'Options Market', url: gn('"options market" OR "options trading" OR VIX when:2d') },
  ],
  fintech: [
    { name: 'Fintech News', url: gn('fintech OR "digital banking" OR neobank when:3d') },
  ],
  regulation: [
    { name: 'SEC', url: 'https://www.sec.gov/news/pressreleases.rss' },
    { name: 'Financial Regulation', url: gn('SEC OR CFTC OR FINRA regulation when:3d') },
  ],
  hedgefunds: [
    { name: 'Hedge Fund News', url: gn('"hedge fund" OR Bridgewater OR Citadel when:7d') },
  ],
  analysis: [
    { name: 'Market Outlook', url: gn('"market outlook" OR "stock market forecast" when:3d') },
  ],
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add RSS news proxy API route"
```

---

### Task 13: Client-side API service layer

**Files:**
- Create: `src/services/api/market.ts`
- Create: `src/services/api/crypto.ts`
- Create: `src/services/api/forex.ts`
- Create: `src/services/api/macro.ts`
- Create: `src/services/api/news.ts`
- Create: `src/services/api/index.ts`

- [ ] **Step 1: Create API client functions**

Each file exports a function that calls the corresponding Vercel API route and returns typed data. All calls use relative URLs (Vite proxy handles dev routing -- see Task 1 Step 4). Example for market:

```typescript
import type { MarketDataPoint } from '@/types'

export async function fetchIndices(): Promise<MarketDataPoint[]> {
  const res = await fetch('/api/market/indices')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchQuotes(symbols: string[]): Promise<MarketDataPoint[]> {
  const res = await fetch(`/api/market/quote?symbols=${symbols.join(',')}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
```

- [ ] **Step 2: Create barrel export**

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add client-side API service layer"
```

---

### Task 14: Data fetching hooks with polling

**Files:**
- Create: `src/hooks/use-polling.ts`
- Create: `src/hooks/use-market-data.ts`
- Create: `src/hooks/use-crypto-data.ts`
- Create: `src/hooks/use-forex-data.ts`
- Create: `src/hooks/use-macro-data.ts`
- Create: `src/hooks/use-news-data.ts`

- [ ] **Step 1: Create polling hook**

`src/hooks/use-polling.ts`: Generic hook that calls a fetcher at an interval, stores result in a ref, returns `{ data, loading, error, refresh }`.

```typescript
import { useState, useEffect, useCallback, useRef } from 'react'

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>
  interval: number // ms
  enabled?: boolean
}

export function usePolling<T>({ fetcher, interval, enabled = true }: UsePollingOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    if (!enabled) return
    refresh()
    timerRef.current = setInterval(refresh, interval)
    return () => clearInterval(timerRef.current)
  }, [refresh, interval, enabled])

  return { data, loading, error, refresh }
}
```

- [ ] **Step 2: Create data hooks for each domain**

Each hook wraps `usePolling` with the appropriate API service function and interval (5 min default for free tier). Updates the corresponding Zustand store on new data.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add polling hooks for market, crypto, forex, macro, news data"
```

---

### Task 15: Build Tier 1 panels (1-6)

**Files:**
- Create: `src/components/panels/LiveMarketsPanel.tsx`
- Create: `src/components/panels/HeadlinesPanel.tsx`
- Create: `src/components/panels/ForexPanel.tsx`
- Create: `src/components/panels/FixedIncomePanel.tsx`
- Create: `src/components/panels/CommoditiesPanel.tsx`
- Create: `src/components/panels/CryptoPanel.tsx`
- Modify: `src/components/panels/index.tsx` (wire up PanelRenderer)

- [ ] **Step 1: Build LiveMarketsPanel**

Shows major indices in a table: Name, Price, Change, Change%. Green/red coloring for positive/negative. Uses `useMarketData` hook.

- [ ] **Step 2: Build HeadlinesPanel**

Scrollable news feed. Each item: source badge, title (links to article), relative timestamp. Uses `useNewsData` hook with `category='markets'`.

- [ ] **Step 3: Build ForexPanel**

Table of major currency pairs: Pair, Rate, Change, Change%. Uses `useForexData` hook.

- [ ] **Step 4: Build FixedIncomePanel**

Treasury yields table (2Y, 5Y, 10Y, 30Y). Yield curve sparkline using Recharts. Uses `useMacroData` hook for FRED yield series.

- [ ] **Step 5: Build CommoditiesPanel**

Table: Commodity, Price, Change, Change%. Oil, Gold, Silver, Copper, Natural Gas. Combines Finnhub quotes + CoinGecko for metals.

- [ ] **Step 6: Build CryptoPanel**

Top coins table: Rank, Name, Price, 24h Change, Market Cap, Volume. Uses `useCryptoData` hook.

- [ ] **Step 7: Wire up PanelRenderer**

Update `src/components/panels/index.tsx` to lazy-import and render the correct panel component based on `panelId`.

```typescript
import { lazy, Suspense } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import type { PanelId } from '@/types'

const panels: Record<string, React.LazyExoticComponent<any>> = {
  'live-markets': lazy(() => import('./LiveMarketsPanel')),
  'headlines': lazy(() => import('./HeadlinesPanel')),
  'forex': lazy(() => import('./ForexPanel')),
  'fixed-income': lazy(() => import('./FixedIncomePanel')),
  'commodities': lazy(() => import('./CommoditiesPanel')),
  'crypto': lazy(() => import('./CryptoPanel')),
}

export function PanelRenderer({ panelId, panelName }: { panelId: PanelId; panelName: string }) {
  const Panel = panels[panelId]

  if (!Panel) {
    return (
      <PanelWrapper title={panelName}>
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          {panelName}
        </div>
      </PanelWrapper>
    )
  }

  return (
    <Suspense fallback={<PanelWrapper title={panelName} loading />}>
      <Panel />
    </Suspense>
  )
}
```

- [ ] **Step 8: Verify all 6 panels render with real data**

```bash
npm run dev
```

Navigate to `/dashboard`. Each panel should show real market data from the API routes.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: build core panels -- Live Markets, Headlines, Forex, Fixed Income, Commodities, Crypto"
```

- [ ] **Step 10: Deploy**

```bash
npx vercel --prod
```

---

## Chunk 3: Intelligence Layer (Phase 3)

### Task 16: Build Tier 1 panels (7-9)

**Files:**
- Create: `src/components/panels/CentralBanksPanel.tsx`
- Create: `src/components/panels/EconomicDataPanel.tsx`
- Create: `src/components/panels/SectorHeatmapPanel.tsx`
- Modify: `src/components/panels/index.tsx`

- [ ] **Step 1: Build CentralBanksPanel**

News feed filtered to central bank category. Fed press releases from RSS + Google News central bank feeds. Each item shows source, headline, timestamp.

- [ ] **Step 2: Build EconomicDataPanel**

Table of latest macro indicators from FRED: CPI, GDP, Unemployment, Fed Funds, PCE, PPI. Each row: Indicator, Latest Value, Previous, Change. Color-coded by impact.

- [ ] **Step 3: Build SectorHeatmapPanel**

Treemap-style heatmap of S&P 500 sectors. Each sector is a rectangle sized by weight, colored green/red by performance. Uses Recharts `<Treemap>` or a custom div-based grid.

Sector data from Finnhub sector performance endpoint.

- [ ] **Step 4: Wire into PanelRenderer, verify**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: build Central Banks, Economic Data, and Sector Heatmap panels"
```

---

### Task 17: Finnhub economic calendar API route

**Files:**
- Create: `api/macro/calendar.ts`

- [ ] **Step 1: Create economic calendar endpoint**

`api/macro/calendar.ts`: Fetches upcoming and recent economic events from Finnhub economic calendar. Returns events with actual/expected/previous values. Caches 5 min.

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors'
import { cached } from '../_cache'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const now = new Date()
  const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  try {
    const { data, stale } = await cached('econ-calendar', 300_000, async () => {
      const r = await fetch(
        `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${process.env.FINNHUB_API_KEY}`
      )
      if (!r.ok) throw new Error(`Finnhub calendar error: ${r.status}`)
      const json = await r.json()
      return json.economicCalendar ?? []
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch economic calendar' })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add Finnhub economic calendar API route"
```

---

### Task 18: Build Market Radar panel

**Files:**
- Create: `src/components/panels/MarketRadarPanel.tsx`
- Create: `src/components/charts/GaugeChart.tsx`

- [ ] **Step 1: Create GaugeChart component**

Simple semicircle gauge using SVG. Takes value (0-100), label, color thresholds.

- [ ] **Step 2: Build MarketRadarPanel**

Composite signal dashboard with 4 gauges:
1. **Fear/Greed** -- derived from VIX level (Finnhub quote for `^VIX`)
2. **Sector Rotation** -- spread between top and bottom sector from heatmap data
3. **Rate Sensitivity** -- based on 2Y-10Y yield spread from FRED
4. **Commodity Pressure** -- oil + gold combined momentum

Each gauge reads from `useMarketStore`. Panel computes derived signals from existing store data (no new API calls).

- [ ] **Step 3: Wire into PanelRenderer, verify**

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: build Market Radar panel with composite signal gauges"
```

---

### Task 19: Correlation Engine -- API route and panel

**Files:**
- Create: `api/correlation/events.ts`
- Create: `api/correlation/matrix.ts`
- Create: `src/components/panels/CorrelationPanel.tsx`
- Create: `src/hooks/use-correlation-data.ts`

- [ ] **Step 1: Create correlation events endpoint**

`api/correlation/events.ts`: Returns recent macro events with their surprise values and correlated asset movements. For MVP, this pulls from Finnhub economic calendar + live quotes to show "CPI came in hot, here's how SPY/GLD/TLT moved."

No Supabase needed yet for MVP. Compute correlations on-the-fly from Finnhub data. The Supabase schema is for Phase 5 when historical depth matters.

- [ ] **Step 2: Create correlation matrix endpoint**

`api/correlation/matrix.ts`: For MVP, return a hardcoded correlation matrix based on well-known macro-market relationships (CPI beat -> stocks down, gold up, etc.). This gets replaced by computed data later when historical backfill is done.

- [ ] **Step 3: Build CorrelationPanel**

Two sections:
1. **Recent Events** -- table of latest macro events with surprise direction (beat/miss), affected assets, and actual price movements
2. **Correlation Matrix** -- heatmap grid showing historical correlation between indicators and assets. Color intensity = correlation strength.

Uses Recharts for the heatmap or a custom table with cell coloring.

- [ ] **Step 4: Create useCorrelationData hook**

- [ ] **Step 5: Wire into PanelRenderer, verify**

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: build Correlation Engine panel with events and matrix views"
```

- [ ] **Step 7: Deploy**

```bash
npx vercel --prod
```

---

## Chunk 4: Extended Panels + Auth (Phase 4)

### Task 20: Build Tier 2 news panels (12-17)

**Files:**
- Create: `src/components/panels/NewsFeedPanel.tsx` (generic reusable news panel)
- Modify: `src/components/panels/index.tsx`

- [ ] **Step 1: Create generic NewsFeedPanel**

Since panels 12-17 are all RSS news aggregators, create one reusable `NewsFeedPanel` that takes a `category` prop and renders news items for that category.

```typescript
interface NewsFeedPanelProps {
  category: string
  title: string
}

export function NewsFeedPanel({ category, title }: NewsFeedPanelProps) {
  const { data, loading, error, refresh } = usePolling({
    fetcher: () => fetchNews(category),
    interval: 300_000, // 5 min
  })

  return (
    <PanelWrapper title={title} loading={loading} error={error} onRetry={refresh}>
      <div className="space-y-2">
        {data?.map((item) => (
          <NewsItemRow key={item.id} item={item} />
        ))}
      </div>
    </PanelWrapper>
  )
}
```

- [ ] **Step 2: Register all Tier 2 news panels in PanelRenderer**

Each one just renders `<NewsFeedPanel category="ipo" title="IPOs, Earnings & M&A" />` etc.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: build Tier 2 news panels (IPOs, derivatives, fintech, regulation, hedge funds, analysis)"
```

---

### Task 21: Build BTC ETF and Stablecoins panels

**Files:**
- Create: `src/components/panels/BtcEtfPanel.tsx`
- Create: `src/components/panels/StablecoinsPanel.tsx`
- Create: `api/crypto/stablecoins.ts`

- [ ] **Step 1: Build BtcEtfPanel**

Crypto news feed filtered to BTC ETF keywords + BTC price chart sparkline from CoinGecko market chart endpoint.

- [ ] **Step 2: Create stablecoins endpoint**

`api/crypto/stablecoins.ts`: Fetches stablecoin data from CoinGecko (USDT, USDC, DAI, etc.). Market cap, peg deviation from $1.

- [ ] **Step 3: Build StablecoinsPanel**

Table: Name, Price, Peg Deviation, Market Cap, 24h Volume. Color-code peg deviation (green if < 0.1%, yellow if 0.1-0.5%, red if > 0.5%).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: build BTC ETF Tracker and Stablecoins panels"
```

---

### Task 22: Supabase auth setup

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/components/auth/AuthModal.tsx`
- Modify: `src/stores/user-store.ts`
- Modify: `src/components/layout/TopBar.tsx`

- [ ] **Step 1: Install Supabase client**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: Create Supabase client**

`src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

- [ ] **Step 3: Create Supabase tables**

Run this SQL in the Supabase SQL editor (or via migration):

```sql
-- User preferences (panel state, layout, watchlist)
create table user_preferences (
  user_id uuid references auth.users primary key,
  panel_state jsonb default '{}',
  layout jsonb default '[]',
  watchlist text[] default '{}',
  theme text default 'dark',
  updated_at timestamptz default now()
);

alter table user_preferences enable row level security;

create policy "Users can read own prefs"
  on user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can upsert own prefs"
  on user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own prefs"
  on user_preferences for update
  using (auth.uid() = user_id);

-- Auto-create prefs row on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 4: Create AuthModal**

shadcn Dialog with email/password sign-in/sign-up. Google OAuth button. Uses `supabase.auth.signInWithPassword()` and `supabase.auth.signUp()`.

- [ ] **Step 4: Update user store to sync with Supabase auth**

On app mount, check `supabase.auth.getSession()`. Listen to `supabase.auth.onAuthStateChange()`. Update `userStore.authenticated` accordingly.

- [ ] **Step 5: Add auth button to TopBar**

Show "Sign In" button when not authenticated, avatar dropdown when authenticated.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add Supabase auth with email/password and Google OAuth"
```

---

### Task 23: User preferences persistence

**Files:**
- Create: `src/services/preferences.ts`
- Modify: `src/stores/panel-store.ts`
- Modify: `src/stores/layout-store.ts`

- [ ] **Step 1: Create preferences service**

Save/load panel enabled state and layout to Supabase `user_preferences` table. For unauthenticated users, fall back to localStorage.

- [ ] **Step 2: Update panel store to persist**

On panel toggle, save to preferences. On app mount, load saved preferences.

- [ ] **Step 3: Update layout store to persist**

On layout change, debounce-save to preferences. On app mount, load saved layout.

- [ ] **Step 4: Add saved layout URL support**

Read `?layout=<id>` query param in Dashboard page. If present and user is Pro, load that saved layout from Supabase. Add route `/dashboard?layout=<id>` to App.tsx routing.

- [ ] **Step 5: Add symbol detail sheet route**

Create `src/components/SymbolDetailSheet.tsx`: A shadcn `<Sheet>` that slides in from the right showing symbol details (price, chart, news). Add `/symbol/:ticker` route that renders the Dashboard with the sheet open.

```typescript
// In App.tsx, add:
<Route path="/symbol/:ticker" element={<Dashboard />} />
```

The Dashboard component checks for `useParams().ticker` and opens the SymbolDetailSheet if present.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: persist preferences, add saved layout URLs, add symbol detail sheet"
```

---

### Task 24: Watchlist panel

**Files:**
- Create: `src/components/panels/WatchlistPanel.tsx`
- Modify: `src/stores/user-store.ts`

- [ ] **Step 1: Build WatchlistPanel**

Shows user's watched symbols with live prices. "Add symbol" input with autocomplete (from Finnhub symbol search). Remove button per item. Free tier limited to 5 symbols (check `userStore.tier`).

Uses existing market/crypto/forex hooks to pull prices for watched symbols.

- [ ] **Step 2: Persist watchlist to Supabase for authenticated users**

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: build Watchlist panel with symbol search and tier limits"
```

---

### Task 25: Command palette

**Files:**
- Create: `src/components/CommandPalette.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Build CommandPalette**

shadcn `<Command>` in a `<Dialog>`. Opens on Cmd+K. Search groups:

1. **Symbols** -- type ticker, show matches from a cached symbol list
2. **Panels** -- list all panels, toggle enable/disable
3. **Actions** -- Toggle theme, lock layout, refresh all

- [ ] **Step 2: Add keyboard shortcuts**

Register global keyboard listener for `/`, `Cmd+K`, `D`, `L`, `R`, `Esc` shortcuts as specified in spec.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add command palette with symbol search, panel toggle, keyboard shortcuts"
```

- [ ] **Step 4: Deploy**

```bash
npx vercel --prod
```

---

## Chunk 5: Monetization + Polish (Phase 5)

### Task 26: Stripe billing integration

**Files:**
- Create: `api/billing/checkout.ts`
- Create: `api/billing/webhook.ts`
- Create: `api/billing/portal.ts`
- Create: `src/components/billing/PricingModal.tsx`

- [ ] **Step 1: Install Stripe**

```bash
npm install stripe
```

- [ ] **Step 2: Create checkout endpoint**

`api/billing/checkout.ts`: Creates a Stripe Checkout session for Pro tier. Redirects to Stripe.

- [ ] **Step 3: Create webhook endpoint**

`api/billing/webhook.ts`: Handles Stripe webhooks (checkout.session.completed, customer.subscription.updated, customer.subscription.deleted). Updates user tier in Supabase.

**Critical:** Vercel parses JSON bodies by default, but Stripe signature verification requires raw body bytes. Must disable body parsing:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { buffer } from 'micro'

// Disable Vercel's default body parsing
export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await buffer(req)
  const sig = req.headers['stripe-signature']!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return res.status(400).json({ error: 'Invalid signature' })
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // Update user tier to 'pro' in Supabase
      break
    case 'customer.subscription.deleted':
      // Downgrade user tier to 'free' in Supabase
      break
  }

  res.json({ received: true })
}
```

Install `micro` for raw body parsing:
```bash
npm install micro
npm install -D @types/micro
```

- [ ] **Step 4: Create portal endpoint**

`api/billing/portal.ts`: Creates a Stripe Customer Portal session for managing subscription.

- [ ] **Step 5: Build PricingModal**

Dialog showing Free vs Pro comparison table. "Upgrade to Pro" button triggers checkout. "Manage Subscription" button for existing Pro users.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add Stripe billing with checkout, webhooks, and customer portal"
```

---

### Task 27: Pro tier -- faster polling

**Files:**
- Modify: `src/hooks/use-polling.ts`
- Modify: all data hooks

- [ ] **Step 1: Make polling interval tier-aware**

Update `usePolling` and all data hooks to check `userStore.tier`. Free = 5 min interval, Pro = 30s interval.

```typescript
const interval = useUserStore((s) => s.tier === 'free' ? 300_000 : 30_000)
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: pro tier gets 30s polling vs 5min free"
```

---

### Task 28: AI Insights panel (BYOK)

**Files:**
- Create: `src/components/panels/AiInsightsPanel.tsx`
- Create: `api/ai/brief.ts`
- Modify: `src/stores/user-store.ts`

- [ ] **Step 1: Add API key storage to user store**

Add `aiApiKey` field to user store. Store in localStorage only (never send to our backend).

- [ ] **Step 2: Build AiInsightsPanel**

For BYOK (free tier): user enters their OpenAI/Anthropic API key. Panel sends market summary data to the AI API directly from the client, gets back analysis.

For Pro tier: calls our `api/ai/brief.ts` endpoint which uses our API key.

Panel shows: morning brief summary, key market drivers, risk alerts.

- [ ] **Step 3: Create AI brief endpoint**

`api/ai/brief.ts`: Pro-only endpoint. Aggregates latest market data from cache, sends to Claude Haiku for analysis, returns structured brief. Rate limited to 1 req per user per hour.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: build AI Insights panel with BYOK and Pro mode"
```

---

### Task 29: Export panel

**Files:**
- Create: `src/components/panels/ExportPanel.tsx`
- Create: `src/services/export.ts`

- [ ] **Step 1: Create export service**

Functions to export current dashboard data as:
- CSV (per panel or all)
- JSON (structured, all panels)

```typescript
export function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map((row) => Object.values(row).join(','))
  const csv = [headers, ...rows].join('\n')
  downloadFile(csv, `${filename}.csv`, 'text/csv')
}

export function exportToJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2)
  downloadFile(json, `${filename}.json`, 'application/json')
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: Build ExportPanel**

Dropdown to select panel data to export. Format selector (CSV/JSON). Export button. Pro badge for API key management section (Phase 5+).

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: build Export panel with CSV and JSON download"
```

---

### Task 30: Landing page

**Files:**
- Modify: `src/pages/Landing.tsx`

- [ ] **Step 1: Build landing page**

Sections (following World Monitor's structure adapted for finance):

1. **Hero** -- "Free market intelligence for everyone" + CTA to `/dashboard`
2. **Stats** -- data source count, panel count, asset classes covered
3. **Feature grid** -- correlation engine, real-time data, export, all asset classes
4. **Pricing table** -- Free vs Pro vs API vs Enterprise comparison
5. **Data sources** -- logo strip of Finnhub, FRED, CoinGecko, etc.
6. **CTA** -- "Try the free dashboard" button

All built with shadcn components. Dark theme. Clean typography.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: build landing page with hero, features, pricing, data sources"
```

---

### Task 31: Analytics and error tracking

**Files:**
- Modify: `src/main.tsx`
- Modify: `api/health.ts`

- [ ] **Step 1: Install Sentry**

```bash
npm install @sentry/react
```

- [ ] **Step 2: Initialize Sentry in main.tsx**

```typescript
import * as Sentry from '@sentry/react'

if (import.meta.env.PROD) {
  Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN })
}
```

- [ ] **Step 3: Install Vercel Analytics**

```bash
npm install @vercel/analytics
```

Add `<Analytics />` component to App.

- [ ] **Step 4: Update health endpoint to check upstream services**

Update `api/health.ts` to actually ping Finnhub, CoinGecko, FRED, Frankfurter and report status per service.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add Sentry error tracking, Vercel Analytics, health checks"
```

---

### Task 32: Final deploy and verify

- [ ] **Step 1: Build and check for TypeScript errors**

```bash
npx tsc --noEmit
```

Fix any type errors.

- [ ] **Step 2: Production build**

```bash
npm run build
```

Verify no build errors.

- [ ] **Step 3: Deploy**

```bash
npx vercel --prod
```

- [ ] **Step 4: Smoke test production**

- Landing page loads at `/`
- Dashboard loads at `/dashboard`
- All Tier 1 panels show real data
- Command palette opens with Cmd+K
- Auth flow works (sign up, sign in)
- Theme toggle works
- Panel enable/disable works
- Layout drag/resize works
- `/api/health` returns all services green

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "chore: production deploy verification"
git push
```

---

## Summary

| Phase | Tasks | What ships |
|-------|-------|------------|
| 1: Foundation | 1-6 | Vite + React + shadcn scaffold, panel grid, Vercel deploy |
| 2: Core Data | 7-15 | 4 API routes (Finnhub, CoinGecko, FRED, Frankfurter, RSS), 6 panels with real data |
| 3: Intelligence | 16-19 | Central Banks, Economic Data, Heatmap, Market Radar, Correlation Engine |
| 4: Extended + Auth | 20-25 | Tier 2 panels, Supabase auth, preferences, watchlist, command palette |
| 5: Monetization | 26-32 | Stripe billing, Pro polling, AI Insights, Export, landing page, analytics |
