# Monoth -- Finance Dashboard Design Spec

## What Is Monoth

A free, data-dense finance dashboard that correlates macro signals, news, and market data across all asset classes. Think "World Monitor but actually built for finance" with Koyfin-level UX.

**Core value props:**

1. **Correlation engine** -- connect macro events (CPI prints, rate decisions, geopolitical moves) to market movements in real time
2. **Data democratization** -- free access to market data normally locked behind Bloomberg/Refinitiv paywalls
3. **Export pipeline** -- structured data output for trading bots, analysis tools, and programmatic access

**Target users:** Retail investors, traders, analysts, researchers, bot builders.

**Not a trading platform.** No order execution. Research and monitoring only.

## Approach

Hybrid: study World Monitor's architecture patterns (panel registry, feed system, caching) but write everything fresh. Finance-first UX inspired by Koyfin's customizable widget grid. Clean codebase, no license constraints.

World Monitor repo (`github.com/koala73/worldmonitor`) serves as architectural reference only, not a fork or dependency.

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Bundler | Vite 8 (Rolldown) | 10-30x faster builds, released 2026-03-12, Rust-based |
| Framework | React 19 | Ecosystem, hiring, component libraries |
| Language | TypeScript (strict) | Non-negotiable |
| UI | shadcn/ui (new-york style) | Clean, composable, finance-appropriate |
| Styling | Tailwind CSS | Utility-first, pairs with shadcn |
| Auth/DB | Supabase | Auth, user prefs, API key management |
| Billing | Stripe + Supabase | Stripe for payments, Supabase stores subscription state |
| State | Zustand | Lightweight stores for panels, layout, market data, user prefs |
| Deployment | Vercel | Static SPA + serverless API routes |
| Charts | Lightweight Charts (TradingView), Recharts | Candlesticks, sparklines, area charts |
| Grid | react-grid-layout | Draggable/resizable panel system |
| Real-time | SSE / polling (free), faster polling via Vercel KV (pro) | No WebSocket on Vercel serverless; pro = 30s polling vs 5-15min free |

## Design System

### Theme

- shadcn/ui new-york preset (now the default, old default deprecated)
- Light and dark mode with toggle
- Default to dark (finance convention)
- Clean typography, precise spacing, minimal color noise
- Monospace for financial data (prices, percentages, timestamps)
- Sans-serif for labels and prose

### Color Palette

- Neutral base (zinc/slate scale)
- Green for positive / up movements
- Red for negative / down movements
- Blue for informational / neutral highlights
- Yellow/amber for warnings and alerts
- Muted variants for secondary data

### Components

All built on shadcn primitives:

- **Card** -- panel containers with subtle shadows
- **Table** -- dense data display (watchlists, screeners)
- **Badge** -- status indicators, asset class tags
- **Tabs** -- panel sub-navigation
- **Command** -- search/command palette (Cmd+K)
- **Sheet** -- slide-out detail views
- **Tooltip** -- data point details on hover
- **Skeleton** -- loading states for all panels

### Layout

- Collapsible sidebar for navigation
- Main content area: draggable/resizable grid of panels
- Top bar: search, market status, user menu
- Panels snap to grid, save layout per user
- Responsive: stacked single-column on mobile

## Panels (22 total)

### Tier 1 -- Core (always visible by default)

| # | Panel | Data Source | Description |
|---|-------|-------------|-------------|
| 1 | Live Markets | Finnhub (primary), yfinance fallback | Major indices (S&P 500, NASDAQ, DJIA, FTSE, Nikkei, etc.), top movers, market status |
| 2 | Market Headlines | RSS (CNBC, MarketWatch, Yahoo Finance, Reuters, Bloomberg via Google News proxy) | Aggregated financial news feed |
| 3 | Forex & Currencies | Frankfurter.app, Finnhub | Major pairs, DXY, central bank rate context |
| 4 | Fixed Income | Google News RSS, FRED | Treasury yields, corporate bonds, yield curves |
| 5 | Commodities & Futures | Finnhub, CoinGecko (gold/silver), Google News RSS | Oil, gold, metals, agriculture, futures |
| 6 | Crypto & Digital Assets | CoinGecko | Top coins, DeFi, market cap, volume |
| 7 | Central Bank Watch | Federal Reserve RSS, Google News RSS | Rate decisions, monetary policy, meeting calendars |
| 8 | Economic Data | FRED, Google News RSS | CPI, GDP, PMI, jobs data, housing |
| 9 | Sector Heatmap | Finnhub | S&P 500 sectors, color-coded performance grid |
| 10 | Market Radar | Computed from panels 1-9 | Aggregate signal dashboard: fear/greed gauge (VIX + put/call from Finnhub), sector rotation indicator, rate sensitivity score, commodity pressure index. Each signal = weighted composite of 2-3 panel data points. |
| 11 | Correlation Engine | All sources + historical | Links macro events to price movements. The differentiator. |

### Tier 2 -- Extended (available, off by default)

| # | Panel | Data Source | Description |
|---|-------|-------------|-------------|
| 12 | IPOs, Earnings & M&A | Google News RSS | Upcoming IPOs, earnings calendar, deal flow |
| 13 | Derivatives & Options News | Google News RSS | Options/futures news aggregation (not live data) |
| 14 | Fintech & Trading Tech | Google News RSS | Industry news, platform updates |
| 15 | Financial Regulation | SEC RSS, Google News RSS | SEC actions, regulatory changes |
| 16 | Hedge Funds & PE News | Google News RSS | Institutional moves, 13F filing news |
| 17 | Market Analysis News | Google News RSS | Bank research, analyst outlook, risk/volatility |
| 18 | BTC ETF Tracker | CoinGecko, Google News RSS | Flows, AUM, performance |
| 19 | Stablecoins | CoinGecko | Market cap, peg status, flows |

### Tier 3 -- User/Pro

| # | Panel | Data Source | Description |
|---|-------|-------------|-------------|
| 20 | Watchlist | User-defined + all sources | Custom asset tracking, alerts |
| 21 | AI Market Insights | OpenAI/Anthropic (BYOK free, included Pro) | AI-generated analysis, morning briefs |
| 22 | Export Panel | Internal | Data export controls, API key management, webhook config |

## Data Architecture

### Caching Layer

Serverless API routes on Vercel act as a caching proxy:

```
Client -> Vercel API Route -> Cache Check -> External API -> Cache Write -> Response
```

- Cache in Vercel KV (Redis) or Supabase
- TTL per source: 30s for prices, 5min for news, 1hr for macro data
- Rate limit management per API key
- Fan-out: single upstream request serves multiple clients

### RSS Feed Aggregation

Same pattern as World Monitor: Google News RSS proxies for paywalled sources.

```
RSS Proxy URL -> Parse XML -> Normalize -> Deduplicate -> Serve as JSON
```

### Data Normalization

All data flows through a normalization layer before reaching panels:

```typescript
interface MarketDataPoint {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  timestamp: number;
  source: string;
}

interface NewsItem {
  title: string;
  url: string;
  source: string;
  published: number;
  category: string;
  sentiment?: number;
  relatedSymbols?: string[];
}

interface MacroSignal {
  indicator: string;
  value: number;
  previous: number;
  expected?: number;
  impact: 'high' | 'medium' | 'low';
  timestamp: number;
  correlatedAssets?: string[];
}
```

### Correlation Engine

The differentiator. Connects macro events to market movements.

**Supabase schema:**

```sql
-- Macro events (CPI, rate decisions, jobs reports, etc.)
macro_events (
  id uuid PK,
  indicator text,         -- 'CPI', 'FOMC_RATE', 'NFP', etc.
  value numeric,
  previous numeric,
  expected numeric,
  surprise numeric,       -- value - expected (the signal)
  timestamp timestamptz,
  source text
)

-- Price snapshots taken at event time + intervals after
event_price_snapshots (
  id uuid PK,
  event_id uuid FK -> macro_events,
  symbol text,            -- 'SPY', 'BTC-USD', 'GLD', etc.
  price_at_event numeric,
  price_1h numeric,
  price_4h numeric,
  price_1d numeric,
  price_1w numeric
)

-- Pre-computed correlation coefficients (refreshed daily)
correlation_matrix (
  indicator text,
  symbol text,
  direction text,         -- 'beat' or 'miss' (vs expected)
  avg_move_1h numeric,
  avg_move_1d numeric,
  sample_size int,
  last_updated timestamptz
)
```

**How it works:**

1. **Event detection** -- FRED API polled for new macro data; compare to expected values from economic calendar
2. **Snapshot capture** -- on new event, snapshot prices for ~50 tracked symbols at t=0, then at t+1h, t+4h, t+1d, t+1w via cron
3. **Correlation computation** -- nightly job recomputes correlation_matrix from all historical event_price_snapshots
4. **Signal generation** -- when a new event arrives, look up correlation_matrix for that indicator. If current price movement exceeds historical avg by >1 std dev, surface as an alert

**Cold start:** Seed with 2 years of historical FRED data + historical price data from Finnhub. Run backfill job once on setup to populate event_price_snapshots retroactively. System is useful from day one.

**Tracked indicators (initial set):** CPI, Core CPI, NFP, Unemployment Rate, FOMC Rate Decision, GDP, PCE, PPI, ISM PMI, Consumer Confidence, Retail Sales

**Tracked symbols (initial set):** SPY, QQQ, DIA, IWM, TLT, GLD, SLV, USO, UUP, BTC-USD, ETH-USD, EUR-USD, JPY-USD, VIX

## Monetization Tiers

### Free ($0)

- All 22 panels
- 5-15 min delayed data
- BYOK for AI features
- Basic watchlist (5 assets)
- Default layout only

### Pro (TBD pricing, early access)

- <60s data refresh
- AI analysis included (no BYOK needed)
- Alerts: Slack, Telegram, WhatsApp, Email
- Unlimited watchlist
- Custom saved layouts
- Correlation engine with historical depth
- Morning briefs & flash alerts

### API (separate from Pro)

- REST endpoints across all data domains
- Authenticated per-key, rate-limited
- Webhook support
- Structured JSON with OpenAPI docs
- Starter: 1,000 req/day
- Business: 50,000 req/day + SLA

### Enterprise (contact sales)

- White-label & embeddable panels
- Team workspaces with SSO/RBAC
- Bulk export (CSV, JSON, API)
- Custom data connectors
- Dedicated support

## Data Sources (Free Tier)

| Source | Data | Rate Limit (Free) | Notes |
|--------|------|-------------------|-------|
| Finnhub | Stock prices, indices, company profiles, sector data | 60 req/min | Primary market data source |
| CoinGecko | Crypto prices, market data, precious metals | 10-30 req/min | Primary crypto + metals source |
| FRED | Macro indicators (CPI, GDP, rates, yields) | 120 req/min | Federal Reserve data, excellent |
| Frankfurter.app | Forex rates (ECB data) | No key, no meaningful limit | Replaced exchangerate.host |
| Google News RSS | Financial news (proxied) | No hard limit | Same pattern as World Monitor |
| Federal Reserve RSS | Fed press releases | No limit | Direct RSS feed |
| SEC RSS | Regulatory filings, press releases | No limit | Direct RSS feed |

**Removed from consideration:**
- Alpha Vantage: 25 req/day is unusable for a multi-user app
- exchangerate.host: 100 req/month is unusable
- Yahoo Finance: unofficial scrape, breaks without warning. Use as last-resort fallback only, never as primary source

## File Structure

```
monoth/
  src/
    app/                    # App shell, routing
    components/
      ui/                   # shadcn primitives
      panels/               # Individual panel components
      layout/               # Grid, sidebar, topbar
      charts/               # Chart wrappers
    services/
      api/                  # API client functions
      cache/                # Client-side caching
      correlation/          # Correlation engine logic
      feeds/                # RSS feed parser/aggregator
    hooks/                  # Custom React hooks
    stores/                 # State management (zustand)
    types/                  # TypeScript types
    utils/                  # Helpers
    config/
      panels.ts             # Panel registry
      feeds.ts              # Feed configurations
      theme.ts              # Design tokens
  api/                      # Vercel serverless routes
    market/                 # Market data proxy
    news/                   # RSS aggregation
    macro/                  # FRED/economic data
    crypto/                 # CoinGecko proxy
    forex/                  # Currency data
    correlation/            # Correlation API
  public/
  docs/
```

## Zustand Stores

```
panelStore      -- panel registry, enabled/disabled state, panel-specific settings
layoutStore     -- grid layout positions/sizes per user, sidebar state
marketStore     -- cached market data keyed by symbol, last refresh timestamps
newsStore       -- aggregated news items, category filters
userStore       -- auth state, subscription tier, preferences, watchlist
```

## Error Handling

- Panels show a subtle error state (muted card with "Data unavailable" + retry button) when their source is down
- Never crash the whole dashboard because one API failed
- Fallback chain: primary source -> cache (stale-while-revalidate) -> error state
- API routes return cached data with `X-Cache: STALE` header when upstream is down

## Vercel API Route Notes

- All routes under `/api/*` are Vercel serverless functions (not an Express server)
- CORS: allow `*.monoth.app` + `localhost:*` for dev
- All routes set `Cache-Control` headers for Vercel Edge Cache
- Rate limiting per IP on free tier, per API key on paid tier (Vercel KV)

## Delivery Phases

### Phase 1 -- Foundation (week 1)
Vite 8 + React + shadcn scaffold, panel grid system, sidebar, theme. Deploy empty shell to Vercel.

### Phase 2 -- Core Data (week 1-2)
Vercel API routes for Finnhub, CoinGecko, FRED, Frankfurter, RSS proxy. Caching layer with Vercel KV. Panels 1-6 (Live Markets, Headlines, Forex, Fixed Income, Commodities, Crypto).

### Phase 3 -- Intelligence (week 2)
Panels 7-11 (Central Bank, Economic Data, Sector Heatmap, Market Radar, Correlation Engine). FRED historical backfill. Correlation engine cold start with seeded data.

### Phase 4 -- Extended (week 3)
Tier 2 panels (12-19). Supabase auth. User prefs/saved layouts. Watchlist.

### Phase 5 -- Monetization (week 3-4)
Stripe integration. Pro tier faster polling. AI insights panel (BYOK). Export panel. API tier with key management.

## AI Cost Model (Pro tier)

Pro includes AI analysis. Budget assumption:
- Morning brief = ~2K tokens input + ~500 tokens output per user per day
- At $3/1M input tokens (Claude Haiku): ~1000 users = ~$6/day = ~$180/month
- Price Pro tier accordingly (minimum $19/month covers AI cost + margin)

## Non-Goals (MVP)

- No map/globe (that's World Monitor's thing, not ours)
- No geopolitical intelligence layers
- No trade execution
- No mobile app (responsive web is fine)
- No desktop app (web-first)
- No real-time websocket streaming in free tier
