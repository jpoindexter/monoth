import { Link } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { StatsBar } from '@/components/layout/StatsBar'
import { NewsTicker } from '@/components/layout/NewsTicker'

// ─── Section label (Caret pattern) ────────────────────────────────────────────
function SectionMark({ num, label, tag }: { num: string; label: string; tag: string }) {
  return (
    <div className="flex items-center justify-between border-t border-zinc-800/60 py-3">
      <span className="font-mono text-[9px] tracking-[0.18em] text-zinc-400 uppercase">
        [{num}] {label}
      </span>
      <span className="font-mono text-[9px] tracking-[0.18em] text-zinc-400 uppercase">
        / / {tag}
      </span>
    </div>
  )
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_QUOTES = [
  { sym: 'SPY',  price: '544.23', chg: '+0.82%', up: true  },
  { sym: 'QQQ',  price: '445.67', chg: '+1.31%', up: true  },
  { sym: 'AAPL', price: '198.45', chg: '-0.34%', up: false },
  { sym: 'NVDA', price: '875.20', chg: '+2.18%', up: true  },
  { sym: 'MSFT', price: '412.88', chg: '+0.44%', up: true  },
  { sym: 'BTC',  price: '84,210', chg: '-1.03%', up: false },
]

const MOCK_PREDICTIONS = [
  { title: 'No rate change in March?',  yes: 92, no: 8,  src: 'POLY'   },
  { title: 'Fed cuts rates in 2025?',   yes: 67, no: 33, src: 'KALSHI' },
  { title: 'BTC above $100K by June?',  yes: 41, no: 59, src: 'POLY'   },
]

const MOCK_FUTURES = [
  { label: 'S&P 500', price: '5,441', chg: '+0.74%', up: true  },
  { label: 'Nasdaq',  price: '19,102',chg: '+0.91%', up: true  },
  { label: 'Crude',   price: '72.34', chg: '-0.43%', up: false },
  { label: 'Gold',    price: '3,142', chg: '+0.22%', up: true  },
  { label: 'VIX',     price: '18.42', chg: '-4.1%',  up: false },
]

// ─── Mock panel shell ──────────────────────────────────────────────────────────
function MockPanel({
  title, children, cols = 1,
}: { title: string; children: React.ReactNode; cols?: number }) {
  return (
    <div
      className="rounded-[2px] border border-zinc-800/80 bg-zinc-950/90 overflow-hidden"
      style={{ gridColumn: `span ${cols}` }}
    >
      <div className="px-3 py-1.5 border-b border-zinc-800/50 flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-widest text-zinc-400">{title}</span>
        <div className="flex gap-1">
          <span className="w-1 h-1 rounded-full bg-zinc-800" />
          <span className="w-1 h-1 rounded-full bg-zinc-800" />
        </div>
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}

// ─── Dashboard mockup ──────────────────────────────────────────────────────────
function DashboardPreview() {
  return (
    <div className="relative mx-auto max-w-5xl px-6">
      <div className="rounded-lg overflow-hidden border border-zinc-700/40 shadow-2xl shadow-black">
        {/* Browser chrome */}
        <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/80" />
          </div>
          <div className="flex-1 mx-4">
            <div className="mx-auto w-52 h-5 bg-zinc-800 rounded-sm flex items-center justify-center">
              <span className="font-mono text-[8px] text-zinc-400">monoth.finance/dashboard</span>
            </div>
          </div>
          <div className="w-16" />
        </div>

        {/* App topbar */}
        <div className="bg-[#0a0a0a] border-b border-zinc-800/50 px-3 h-6 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-[2px] bg-emerald-500 flex items-center justify-center shrink-0">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <rect x="0.5" y="0.5" width="3" height="3" rx="0.5" fill="black" />
                <rect x="4.5" y="0.5" width="3" height="3" rx="0.5" fill="black" />
                <rect x="0.5" y="4.5" width="3" height="3" rx="0.5" fill="black" />
                <rect x="4.5" y="4.5" width="3" height="3" rx="0.5" fill="black" />
              </svg>
            </div>
            <span className="font-mono text-[8px] font-bold tracking-widest text-zinc-300">MONOTH</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 4px #10b981' }} />
            <span className="font-mono text-[7px] text-zinc-400 uppercase tracking-widest">Live</span>
          </div>
          <div className="flex-1" />
          <span className="font-mono text-[7px] text-zinc-400">US · NY</span>
        </div>

        {/* Grid */}
        <div className="bg-[#0a0a0a] p-2 grid grid-cols-3 gap-1.5">
          <MockPanel title="Watchlist">
            <div className="space-y-1">
              {MOCK_QUOTES.map((q) => (
                <div key={q.sym} className="flex items-center justify-between">
                  <span className="font-mono text-[8px] text-zinc-400 w-9">{q.sym}</span>
                  <span className="font-mono text-[8px] text-zinc-200 tabular-nums">{q.price}</span>
                  <span className={`font-mono text-[8px] tabular-nums ${q.up ? 'text-emerald-500' : 'text-red-400'}`}>{q.chg}</span>
                </div>
              ))}
            </div>
          </MockPanel>

          <MockPanel title="Prediction Markets" cols={2}>
            <div className="space-y-2.5">
              {MOCK_PREDICTIONS.map((p) => (
                <div key={p.title}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[8px] text-zinc-400 truncate flex-1">{p.title}</span>
                    <span className={`font-mono text-[7px] ml-2 px-1 py-0.5 rounded-sm ${p.src === 'KALSHI' ? 'bg-sky-950/80 text-sky-500 border border-sky-900' : 'bg-purple-950/80 text-purple-400 border border-purple-900'}`}>
                      {p.src}
                    </span>
                  </div>
                  <div className="flex h-1.5 rounded-[1px] overflow-hidden bg-zinc-800">
                    <div className="bg-emerald-600" style={{ width: `${p.yes}%` }} />
                    <div className="bg-red-900/70" style={{ width: `${p.no}%` }} />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="font-mono text-[7px] text-emerald-600">Yes {p.yes}%</span>
                    <span className="font-mono text-[7px] text-zinc-400">No {p.no}%</span>
                  </div>
                </div>
              ))}
            </div>
          </MockPanel>

          <MockPanel title="Futures Strip" cols={2}>
            <div className="grid grid-cols-5 gap-1.5">
              {MOCK_FUTURES.map((f) => (
                <div key={f.label} className="flex flex-col gap-0.5">
                  <span className="font-mono text-[7px] text-zinc-400 truncate">{f.label}</span>
                  <span className="font-mono text-[8px] text-zinc-200 tabular-nums">{f.price}</span>
                  <span className={`font-mono text-[7px] tabular-nums ${f.up ? 'text-emerald-500' : 'text-red-400'}`}>{f.chg}</span>
                </div>
              ))}
            </div>
          </MockPanel>

          <MockPanel title="Congress Trades">
            <div className="space-y-1">
              {[
                { name: 'N. Pelosi',     ticker: 'NVDA', type: 'BUY'  },
                { name: 'T. Tuberville', ticker: 'SPY',  type: 'SELL' },
                { name: 'M. Waters',     ticker: 'AAPL', type: 'BUY'  },
                { name: 'R. Scott',      ticker: 'MSFT', type: 'BUY'  },
              ].map((t) => (
                <div key={t.name} className="flex items-center gap-1.5">
                  <span className="font-mono text-[7px] text-zinc-400 truncate flex-1">{t.name}</span>
                  <span className="font-mono text-[8px] text-amber-400">{t.ticker}</span>
                  <span className={`font-mono text-[7px] px-1 rounded-[2px] ${t.type === 'BUY' ? 'bg-emerald-950/80 text-emerald-600' : 'bg-red-950/80 text-red-500'}`}>
                    {t.type}
                  </span>
                </div>
              ))}
            </div>
          </MockPanel>
        </div>
      </div>

      {/* Glow */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(16,185,129,0.08) 0%, transparent 70%)' }}
      />
    </div>
  )
}

// ─── Counter ───────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const p = Math.min(elapsed / duration, 1)
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return value
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
const GitHubIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
)

const LogoMark = () => (
  <div className="w-5 h-5 rounded-[3px] bg-emerald-500 flex items-center justify-center shrink-0">
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <rect x="0.5" y="0.5" width="3.5" height="3.5" rx="0.5" fill="black" />
      <rect x="6" y="0.5" width="3.5" height="3.5" rx="0.5" fill="black" />
      <rect x="0.5" y="6" width="3.5" height="3.5" rx="0.5" fill="black" />
      <rect x="6" y="6" width="3.5" height="3.5" rx="0.5" fill="black" />
    </svg>
  </div>
)

// ─── Static data ───────────────────────────────────────────────────────────────
const DATA_SOURCES = [
  { name: 'Finnhub',       color: 'text-blue-400   border-blue-900   bg-blue-950/40'   },
  { name: 'CoinGecko',     color: 'text-green-400  border-green-900  bg-green-950/40'  },
  { name: 'FRED',          color: 'text-amber-400  border-amber-900  bg-amber-950/40'  },
  { name: 'Frankfurter',   color: 'text-purple-400 border-purple-900 bg-purple-950/40' },
  { name: 'Polymarket',    color: 'text-pink-400   border-pink-900   bg-pink-950/40'   },
  { name: 'Kalshi',        color: 'text-sky-400    border-sky-900    bg-sky-950/40'    },
  { name: 'Yahoo Finance', color: 'text-violet-400 border-violet-900 bg-violet-950/40' },
  { name: 'Google News',   color: 'text-red-400    border-red-900    bg-red-950/40'    },
  { name: 'Claude AI',     color: 'text-orange-400 border-orange-900 bg-orange-950/40' },
]

const SETUP_STEPS = [
  { step: '01', cmd: 'git clone github.com/jpoindexter/monoth', label: 'Clone the repo'      },
  { step: '02', cmd: 'cp .env.example .env  # add your API keys',  label: 'Configure env vars' },
  { step: '03', cmd: 'npm install && npm run dev',                  label: 'Start the dashboard'},
]

// ─── Page ──────────────────────────────────────────────────────────────────────
export function Landing() {
  const panelCount = useCountUp(60, 1400)

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-zinc-100 antialiased">
      <div className="sticky top-0 z-50">
        <StatsBar />
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="sticky top-6 z-40 border-b border-zinc-900 bg-[#0e0e0e]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <LogoMark />
            <span className="font-mono text-[10px] font-semibold tracking-[0.22em] text-white uppercase">
              Monoth
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-5 ml-6">
            {['Features', 'Data', 'Setup'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[12px] text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <a
              href="https://github.com/jpoindexter/monoth"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-300 transition-colors font-mono"
            >
              <GitHubIcon />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <Link to="/dashboard">
              <button className="h-7 px-4 rounded-[3px] bg-white text-black text-[11px] font-semibold hover:bg-zinc-200 transition-colors">
                Launch →
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-6 pt-28 pb-20 text-center overflow-hidden">
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 35% at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 70%)' }}
        />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950 text-[9px] font-mono text-zinc-400 tracking-[0.15em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Open source — {panelCount} panels
          </div>

          <h1
            className="text-3xl sm:text-4xl font-semibold leading-snug tracking-tight text-white mb-6"
          >
            Market Intelligence
            <span className="text-zinc-400 font-normal"> — in one dashboard.</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-lg mx-auto mb-3 leading-relaxed font-light">
            Real-time data across equities, crypto, forex, commodities,
            and prediction markets. No login. No account. Just open it and go.
          </p>

          <p className="font-mono text-[10px] text-zinc-400 mb-10 tracking-widest">
            14+ data sources &nbsp;·&nbsp; Polymarket + Kalshi &nbsp;·&nbsp; No login required &nbsp;·&nbsp; MIT license
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/dashboard">
              <button className="h-10 px-7 rounded-[3px] bg-white text-black text-[13px] font-semibold hover:bg-zinc-100 transition-colors">
                Launch Dashboard
              </button>
            </Link>
            <a href="https://github.com/jpoindexter/monoth" target="_blank" rel="noopener noreferrer">
              <button className="h-10 px-7 rounded-[3px] border border-zinc-700 text-zinc-300 text-[13px] hover:border-zinc-500 hover:bg-zinc-900/60 transition-colors flex items-center gap-2">
                <GitHubIcon />
                Star on GitHub
              </button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── Dashboard preview ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="pb-32"
      >
        <DashboardPreview />
      </motion.div>

      {/* ── Sections ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6" id="features">

        {/* 01 — All the data */}
        <SectionMark num="01" label="All the data" tag="Panels" />
        <div className="py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-6 leading-[1.1]"
            >
              60 panels.
              <br />
              <em className="not-italic text-zinc-400">Every asset class.</em>
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-8 text-[15px]">
              Equities, crypto, forex, commodities, fixed income, prediction markets, macro data,
              congress trades, options flow, dark pool activity — all in one configurable dashboard.
              Toggle what you need, hide what you don't.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { n: '60',  label: 'Live panels'   },
                { n: '14+', label: 'Data sources'  },
                { n: '6',   label: 'Asset classes' },
                { n: '6',   label: 'Preset layouts'},
              ].map((s) => (
                <div key={s.label} className="border border-zinc-800 rounded-[3px] p-4">
                  <div className="font-mono text-3xl font-bold text-white leading-none mb-1">{s.n}</div>
                  <div className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 rounded-[3px] bg-zinc-950 overflow-hidden">
            <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
              <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest">Active panels</span>
              <span className="font-mono text-[9px] text-emerald-600">60 enabled</span>
            </div>
            <div className="divide-y divide-zinc-900">
              {[
                'Live Markets', 'Futures Strip', 'Sector Heatmap', 'Watchlist',
                'Prediction Markets', 'Congress Trades', 'Crypto Markets', 'Options Flow',
                'Dark Pool Activity', 'Yield Curve', 'Credit Spreads', 'FX Heatmap',
                'AI Insights', 'Economic Calendar',
              ].map((p) => (
                <div key={p} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[12px] text-zinc-300">{p}</span>
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"
                    style={{ boxShadow: '0 0 4px rgba(16,185,129,0.4)' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 02 — Prediction markets */}
        <SectionMark num="02" label="Prediction Markets" tag="Signals" />
        <div className="py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 space-y-2">
            {[
              ...MOCK_PREDICTIONS,
              { title: 'Recession in 2025?',     yes: 28, no: 72, src: 'KALSHI' },
              { title: 'Gold above $3,500 EOY?', yes: 44, no: 56, src: 'POLY'   },
            ].map((p) => (
              <div key={p.title} className="border border-zinc-800 rounded-[3px] p-4 bg-zinc-950">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] text-zinc-300 leading-snug flex-1 pr-3">{p.title}</span>
                  <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded-[2px] border shrink-0 ${
                    p.src === 'KALSHI'
                      ? 'border-sky-900 bg-sky-950/80 text-sky-400'
                      : 'border-purple-900 bg-purple-950/80 text-purple-400'
                  }`}>{p.src}</span>
                </div>
                <div className="flex h-2 rounded-[2px] overflow-hidden bg-zinc-800/60">
                  <div className="bg-emerald-600" style={{ width: `${p.yes}%` }} />
                  <div className="bg-red-900/70" style={{ width: `${p.no}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="font-mono text-[10px] text-emerald-500">Yes {p.yes}%</span>
                  <span className="font-mono text-[10px] text-zinc-400">No {p.no}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="order-1 md:order-2">
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-6 leading-[1.1]"
            >
              The market's
              <br />
              <em className="not-italic text-zinc-400">collective forecast.</em>
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-6 text-[15px]">
              Live odds from Polymarket and Kalshi — both sources, side by side. Probability bars
              for rate decisions, macro outcomes, election results, and crypto targets. 86+ markets,
              refreshed every 5 minutes.
            </p>
            <div className="flex gap-3">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-1 rounded-[2px] border border-purple-900 bg-purple-950/50 text-purple-400">
                Polymarket
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-1 rounded-[2px] border border-sky-900 bg-sky-950/50 text-sky-400">
                Kalshi
              </span>
            </div>
          </div>
        </div>

        {/* 03 — Alerts */}
        <SectionMark num="03" label="Price Alerts" tag="Monitoring" />
        <div className="py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-6 leading-[1.1]"
            >
              Don't watch.
              <br />
              <em className="not-italic text-zinc-400">Get notified.</em>
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-8 text-[15px]">
              Set price alerts on any symbol in your watchlist. When triggered, the entire
              dashboard flashes red and you get a browser notification. No email. No app. No noise.
            </p>
            <div className="space-y-2">
              {[
                { sym: 'SPY',  dir: 'above', price: '$550.00', status: 'watching'  },
                { sym: 'BTC',  dir: 'below', price: '$80,000', status: 'watching'  },
                { sym: 'NVDA', dir: 'above', price: '$900.00', status: 'triggered' },
              ].map((a) => (
                <div
                  key={a.sym}
                  className={`flex items-center justify-between border rounded-[3px] px-4 py-3 ${
                    a.status === 'triggered'
                      ? 'border-red-800/80 bg-red-950/20'
                      : 'border-zinc-800 bg-zinc-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[13px] font-bold text-white">{a.sym}</span>
                    <span className="font-mono text-[10px] text-zinc-400">{a.dir} {a.price}</span>
                  </div>
                  <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-[2px] ${
                    a.status === 'triggered'
                      ? 'bg-red-500 text-white'
                      : 'bg-zinc-800/80 text-zinc-400'
                  }`}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 rounded-[3px] bg-zinc-950 p-6">
            <div className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mb-5">When an alert fires</div>
            <div className="space-y-4">
              {[
                { icon: '⚡', text: 'Red border flashes across the full dashboard' },
                { icon: '🔔', text: 'Browser notification with symbol + price'    },
                { icon: '📌', text: 'Red toast bottom-right with details'          },
                { icon: '✓',  text: 'Alert marked triggered, stays in history'    },
              ].map((i) => (
                <div key={i.text} className="flex items-start gap-3 pb-4 border-b border-zinc-900 last:border-0 last:pb-0">
                  <span className="text-base leading-none mt-0.5">{i.icon}</span>
                  <span className="text-[13px] text-zinc-400 leading-snug">{i.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 04 — Layouts */}
        <SectionMark num="04" label="Preset Layouts" tag="Customize" />
        <div className="py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div className="order-2 md:order-1 grid grid-cols-2 gap-2">
            {[
              { name: 'Overview', active: true },
              { name: 'Markets',  active: false },
              { name: 'Macro',    active: false },
              { name: 'Crypto',   active: false },
              { name: 'News',     active: false },
              { name: 'Video',    active: false },
            ].map((l) => (
              <div
                key={l.name}
                className={`border rounded-[3px] p-4 ${l.active ? 'border-emerald-800/60 bg-emerald-950/15' : 'border-zinc-800 bg-zinc-950'}`}
              >
                <div className={`font-mono text-[9px] uppercase tracking-widest mb-3 ${l.active ? 'text-emerald-500' : 'text-zinc-400'}`}>
                  {l.name}
                </div>
                <div className="grid grid-cols-3 gap-[2px]">
                  {[2, 1, 2, 1, 1, 2].map((w, j) => (
                    <div
                      key={j}
                      className={`h-3 rounded-[1px] ${l.active ? 'bg-emerald-900/50' : 'bg-zinc-800/80'}`}
                      style={{ gridColumn: `span ${w}` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="order-1 md:order-2">
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-6 leading-[1.1]"
            >
              Six presets.
              <br />
              <em className="not-italic text-zinc-400">One click to switch.</em>
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-6 text-[15px]">
              Overview, Markets, Macro, Crypto, News, Video — each preset activates a curated
              set of panels optimized for that workflow. Or build your own by toggling panels
              individually in settings.
            </p>
            <p className="font-mono text-[11px] text-zinc-400">
              Layouts persist across sessions. Panels remember their state.
            </p>
          </div>
        </div>

        {/* 05 — Private by default */}
        <SectionMark num="05" label="Private by default" tag="Data" />
        <div className="py-20">
          <div className="text-center mb-14">
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-3 leading-[1.1]"
            >
              No account. No tracking.
              <br />
              <em className="not-italic text-zinc-400">Your data stays local.</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'No login required',
                desc:  "Open the dashboard and it works. No email, no password, no OAuth. Your watchlist and settings live in localStorage.",
              },
              {
                title: 'No server-side storage',
                desc:  "We don't store your watchlist, portfolio, or alerts on any server. Everything is local to your browser.",
              },
              {
                title: 'Self-host it',
                desc:  "Clone the repo and run it on your own infrastructure. MIT licensed — own the code, own the data, own the stack.",
              },
            ].map((f) => (
              <div key={f.title} className="border border-zinc-800 rounded-[3px] bg-zinc-950 p-6">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mb-4" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
                <h3 className="text-[15px] font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-[13px] text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Data sources ──────────────────────────────────────────────────── */}
      <div className="border-y border-zinc-900 bg-zinc-950/40 py-16" id="data">
        <div className="max-w-7xl mx-auto px-6">
          <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest text-center mb-8">
            Data powered by
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {DATA_SOURCES.map((s) => (
              <motion.span
                key={s.name}
                whileHover={{ scale: 1.04 }}
                className={`inline-flex items-center px-3 py-1.5 rounded-[3px] border font-mono text-[10px] tracking-wide font-medium ${s.color}`}
              >
                {s.name}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Docs ──────────────────────────────────────────────────────────── */}
      <div className="border-t border-zinc-900 py-24" id="docs">
        <div className="max-w-7xl mx-auto px-6">
          <SectionMark num="07" label="How it works" tag="Docs" />
          <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Keyboard shortcuts */}
            <div>
              <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mb-5">Keyboard shortcuts</p>
              <div className="space-y-2">
                {[
                  { key: '/',  label: 'Command palette'   },
                  { key: 'R',  label: 'Refresh all panels' },
                  { key: 'D',  label: 'Cycle theme'        },
                  { key: 'L',  label: 'Lock layout'        },
                  { key: '?',  label: 'Show shortcuts'     },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <span className="text-[12px] text-zinc-400">{label}</span>
                    <kbd className="font-mono text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded-[3px]">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>

            {/* Panels */}
            <div>
              <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mb-5">Panels</p>
              <div className="space-y-3">
                {[
                  { title: 'Toggle panels',   desc: 'Open Settings → Panels. Enable or disable any of the 60 panels individually.' },
                  { title: 'Switch layouts',  desc: 'Open Settings → Layouts. Six presets — Overview, Markets, Macro, Crypto, News, Video.' },
                  { title: 'Drag to reorder', desc: 'Unlock the layout (L), then drag panels into any order. Lock again to save.' },
                  { title: 'Expand a panel',  desc: 'Click the expand icon on any panel to view it full-screen.' },
                ].map(({ title, desc }) => (
                  <div key={title} className="border-b border-zinc-900 pb-3">
                    <p className="text-[12px] text-white mb-0.5">{title}</p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div>
              <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mb-5">Tips</p>
              <div className="space-y-3">
                {[
                  { title: 'Watchlist',      desc: 'Add any ticker symbol to your watchlist. Click a symbol to see detailed charts and data.' },
                  { title: 'Price alerts',   desc: 'Set above/below alerts on watchlist symbols. The dashboard flashes red when triggered.' },
                  { title: 'Command palette', desc: 'Press / to search panels, symbols, and actions from anywhere in the dashboard.' },
                  { title: 'AI Insights',    desc: 'Add your Anthropic API key in the AI Insights panel to generate live market briefs.' },
                ].map(({ title, desc }) => (
                  <div key={title} className="border-b border-zinc-900 pb-3">
                    <p className="text-[12px] text-white mb-0.5">{title}</p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Setup ─────────────────────────────────────────────────────────── */}
      <div className="py-24 bg-[#0e0e0e]" id="setup">
        <div className="max-w-3xl mx-auto px-6">
          <SectionMark num="06" label="Self-host in minutes" tag="Setup" />
          <h2
            className="text-4xl font-bold text-white mt-12 mb-10"
          >
            Run it yourself.
          </h2>
          <div className="space-y-2">
            {SETUP_STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.1 }}
                className="flex items-start gap-5 border border-zinc-800/60 bg-zinc-950 rounded-[3px] px-5 py-4"
              >
                <span className="font-mono text-[10px] text-zinc-400 pt-0.5 shrink-0">{s.step}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mb-1.5">{s.label}</p>
                  <code className="text-[13px] text-emerald-400 font-mono break-all">{s.cmd}</code>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-zinc-400 text-center mt-8">
            Requires Node 20+. Free API keys from Finnhub, CoinGecko, FRED, and Kalshi.
          </p>
        </div>
      </div>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <div className="py-24 bg-[#0e0e0e] border-t border-zinc-900" id="pricing">
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest text-center mb-16">Pricing</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Free */}
            <div className="border border-zinc-800 rounded-[3px] bg-zinc-950 p-8 flex flex-col">
              <div className="mb-6">
                <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mb-3">Free</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="font-mono text-[11px] text-zinc-400 mb-1">/ month</span>
                </div>
                <p className="font-mono text-[10px] text-zinc-400">Self-host or use the hosted version</p>
              </div>
              <div className="space-y-2.5 flex-1 mb-8">
                {[
                  '60 live panels',
                  'All asset classes',
                  'Preset layouts',
                  'Price alerts',
                  'Watchlist',
                  'No login required',
                  'MIT licensed',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-700 shrink-0" />
                    <span className="text-[13px] text-zinc-400">{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/dashboard">
                <button className="w-full h-9 rounded-[3px] border border-zinc-700 text-zinc-400 text-[12px] hover:border-zinc-500 hover:text-zinc-200 transition-colors">
                  Launch Dashboard →
                </button>
              </Link>
            </div>

            {/* Pro */}
            <div className="border border-emerald-800/50 rounded-[3px] bg-emerald-950/10 p-8 flex flex-col relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-[2px] bg-emerald-500/10 text-emerald-500 border border-emerald-800/60">
                  Coming soon
                </span>
              </div>
              <div className="mb-6">
                <p className="font-mono text-[9px] text-emerald-600 uppercase tracking-widest mb-3">Pro</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="text-4xl font-bold text-white">TBD</span>
                </div>
                <p className="font-mono text-[10px] text-zinc-400">Everything in Free, plus</p>
              </div>
              <div className="space-y-2.5 flex-1 mb-8">
                {[
                  'Everything in Free',
                  'Cloud sync across devices',
                  'Portfolio tracking',
                  'Alert history',
                  'API access',
                  'Priority support',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-800/60 shrink-0" />
                    <span className="text-[13px] text-zinc-400">{f}</span>
                  </div>
                ))}
              </div>
              <button disabled className="w-full h-9 rounded-[3px] bg-emerald-950/40 border border-emerald-800/40 text-emerald-700 text-[12px] cursor-not-allowed">
                Notify me
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <div className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-6 py-36 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mb-8">Try Monoth today</p>
            <h2
              className="text-5xl md:text-7xl font-bold text-white mb-4 leading-[1.05]"
            >
              Everything in one place.
            </h2>
            <p className="text-zinc-400 mb-12 text-lg font-light">
              No account required. Just open it.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/dashboard">
                <button className="h-11 px-10 rounded-[3px] bg-white text-black text-[13px] font-semibold hover:bg-zinc-100 transition-colors">
                  Launch Dashboard →
                </button>
              </Link>
              <a href="https://github.com/jpoindexter/monoth" target="_blank" rel="noopener noreferrer">
                <button className="h-11 px-8 rounded-[3px] border border-zinc-700 text-zinc-400 text-[13px] hover:border-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2">
                  <GitHubIcon />
                  Star on GitHub
                </button>
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="sticky bottom-0 z-50">
        <NewsTicker />
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-900 px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest">Monoth</span>
          </div>
          <span className="font-mono text-[9px] text-zinc-400">
            © 2025 · MIT License · Not financial advice.
          </span>
        </div>
      </footer>
    </div>
  )
}
