# Monoth

A real-time financial dashboard with 60+ panels covering equities, crypto, forex, commodities, fixed income, prediction markets, and macro data. No login required.

![License](https://img.shields.io/badge/license-MIT-green) ![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20Vercel-black)

![Monoth Dashboard](docs/screenshot.png)

## Features

- **60+ live panels** — watchlist, sector heatmap, futures strip, yield curve, options flow, dark pool, congress trades, FedWatch, earnings calendar, AI insights, and more
- **Prediction markets** — live odds from Polymarket and Kalshi side by side
- **Preset layouts** — Overview, Markets, Macro, Crypto, News, Video — one click to switch
- **Price alerts** — browser notifications + dashboard flash when triggered
- **No login required** — watchlist, alerts, and settings live in localStorage
- **Self-hostable** — MIT licensed, deploy anywhere

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui, Vite |
| API | Vercel serverless functions (Node.js) |
| Auth (optional) | Supabase |
| Billing (optional) | Stripe |
| Charts | Lightweight Charts, Recharts |

## Quick Start

```bash
git clone https://github.com/jpoindexter/monoth
cd monoth
cp .env.example .env
# Fill in at minimum: FINNHUB_API_KEY and FRED_API_KEY (both free)
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## API Keys

Most panels work with free-tier keys. Only the keys for the data sources you want are required.

| Variable | Source | Required |
|---|---|---|
| `FINNHUB_API_KEY` | [finnhub.io](https://finnhub.io) — free tier | Recommended |
| `FRED_API_KEY` | [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html) — free | Recommended |
| `ALPHA_VANTAGE_API_KEY` | [alphavantage.co](https://www.alphavantage.co/support/#api-key) — free | Optional |
| `EIA_API_KEY` | [eia.gov/opendata](https://www.eia.gov/opendata/register.php) — free | Optional (energy panel) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | Optional (AI Insights panel) |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | Optional (AI summary) |
| `RESEND_API_KEY` | [resend.com](https://resend.com) | Optional (email alerts) |

Supabase and Stripe are only needed if you want user accounts and billing.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jpoindexter/monoth)

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**. Set `CRON_SECRET` to a random string — Vercel uses it to authenticate scheduled jobs.

## Project Structure

```
src/
  components/
    panels/       # Individual dashboard panels (60+)
    layout/       # TopBar, PanelWrapper, StatsBar, NewsTicker
    settings/     # Settings modal, layout manager
    charts/       # Shared chart components
  pages/
    Landing.tsx   # Marketing page
    Dashboard.tsx # Main dashboard
    landing/      # Landing page sub-components
  stores/         # Zustand state (panels, alerts, watchlist, layout)
  hooks/          # usePolling, useMarketData, etc.
  lib/
    panel-utils.ts # Shared formatters (fmtVol, fmtBig, tabCls, etc.)
  services/api/   # Client-side API wrappers

api/
  _auth.ts        # Supabase JWT auth helper
  _cache.ts       # In-process TTL cache
  _cors.ts        # CORS helper
  market/         # Quotes, fundamentals, movers, options
  crypto/         # CoinGecko prices and market data
  macro/          # FRED, FedWatch, yield curve, M2, signals
  news/           # Google News RSS aggregator
  predictions/    # Polymarket + Kalshi markets
  ai/             # AI market brief and summary
  alerts/         # Price alert cron checker
  billing/        # Stripe checkout and webhooks
  health.ts       # Service health check
```

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `/` | Command palette |
| `R` | Refresh all panels |
| `D` | Cycle theme (dark / light / system) |
| `L` | Lock / unlock layout |
| `?` | Show all shortcuts |

## Development

```bash
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run lint     # ESLint
```

For API routes locally, use the Vercel CLI:

```bash
npm i -g vercel
vercel dev       # Runs both frontend and API routes
```

## License

MIT — see [LICENSE](LICENSE).

Not financial advice.
