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
| Bundler | Vite 8 (Rolldown) | 10-30x faster builds, released today, Rust-based |
| Framework | React 19 | Ecosystem, hiring, component libraries |
| Language | TypeScript (strict) | Non-negotiable |
| UI | shadcn/ui (new-york style) | Clean, composable, finance-appropriate |
| Styling | Tailwind CSS | Utility-first, pairs with shadcn |
| Auth/DB | Supabase | Auth, user prefs, billing, API key management |
| Deployment | Vercel | Static SPA + serverless API routes |
| Charts | Lightweight Charts (TradingView), Recharts | Candlesticks, sparklines, area charts |
| Grid | react-grid-layout | Draggable/resizable panel system |
| Real-time | SSE / polling (free), WebSocket (pro) | Progressive enhancement by tier |

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
| 1 | Live Markets | Finnhub, Yahoo Finance | Major indices (S&P 500, NASDAQ, DJIA, FTSE, Nikkei, etc.), top movers, market status |
| 2 | Market Headlines | RSS (CNBC, MarketWatch, Yahoo Finance, Reuters, Bloomberg via Google News proxy) | Aggregated financial news feed |
| 3 | Forex & Currencies | exchangerate.host, Finnhub | Major pairs, DXY, central bank rate context |
| 4 | Fixed Income | Google News RSS, FRED | Treasury yields, corporate bonds, yield curves |
| 5 | Commodities & Futures | Yahoo Finance, Google News RSS | Oil, gold, metals, agriculture, futures |
| 6 | Crypto & Digital Assets | CoinGecko | Top coins, DeFi, market cap, volume |
| 7 | Central Bank Watch | Federal Reserve RSS, Google News RSS | Rate decisions, monetary policy, meeting calendars |
| 8 | Economic Data | FRED, Google News RSS | CPI, GDP, PMI, jobs data, housing |
| 9 | Sector Heatmap | Finnhub, Yahoo Finance | S&P 500 sectors, color-coded performance grid |
| 10 | Market Radar | Derived from all sources | Macro signal strength indicators, correlation alerts |
| 11 | Correlation Engine | All sources + historical | Links macro events to price movements. The differentiator. |

### Tier 2 -- Extended (available, off by default)

| # | Panel | Data Source | Description |
|---|-------|-------------|-------------|
| 12 | IPOs, Earnings & M&A | Google News RSS | Upcoming IPOs, earnings calendar, deal flow |
| 13 | Derivatives & Options | Google News RSS | VIX, options flow, futures positioning |
| 14 | Fintech & Trading Tech | Google News RSS | Industry news, platform updates |
| 15 | Financial Regulation | SEC RSS, Google News RSS | SEC actions, regulatory changes |
| 16 | Hedge Funds & PE | Google News RSS | Institutional moves, 13F filings |
| 17 | Market Analysis | Google News RSS | Bank research, analyst outlook, risk/volatility |
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

The differentiator. Connects macro events to market movements:

1. **Event detection** -- new macro data point arrives (CPI, rate decision, jobs report)
2. **Historical lookup** -- what happened to correlated assets in similar past events
3. **Real-time tracking** -- monitor actual price movements post-event
4. **Signal generation** -- surface correlations that exceed historical norms

Storage: Supabase for historical correlation data. Built up over time as the system collects data.

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
| Finnhub | Stock prices, company profiles | 60 req/min | Best free stock API |
| Yahoo Finance | Indices, commodities, historical | Unofficial, use carefully | No official API, scrape-adjacent |
| Alpha Vantage | Stock, forex, crypto | 25 req/day (free) | Good for historical data |
| CoinGecko | Crypto prices, market data | 10-30 req/min | Best free crypto API |
| FRED | Macro indicators (CPI, GDP, rates) | 120 req/min | Federal Reserve data, excellent |
| exchangerate.host | Forex rates | 100 req/month (free) | Simple currency data |
| Google News RSS | Financial news (proxied) | No hard limit | Same pattern as World Monitor |
| Federal Reserve RSS | Fed press releases | No limit | Direct RSS feed |
| SEC RSS | Regulatory filings, press releases | No limit | Direct RSS feed |

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

## Non-Goals (MVP)

- No map/globe (that's World Monitor's thing, not ours)
- No geopolitical intelligence layers
- No trade execution
- No mobile app (responsive web is fine)
- No desktop app (web-first)
- No real-time websocket streaming in free tier
