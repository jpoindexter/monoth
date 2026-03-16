import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { fetchQuotes } from '@/services/api/market'
import { fetchCryptoPrices } from '@/services/api/crypto'

// --- Icons ---
const GridIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

const SignalIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 12h2M20 12h2M12 2v2M12 20v2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4" />
  </svg>
)

const DatabaseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5" />
    <path d="M3 12c0 1.657 4.03 3 9 3s9-1.343 9-3" />
  </svg>
)

const MoonIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const KeyboardIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const GitHubIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
)

const StarIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const PredictIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
)

// --- Data ---
const FEATURES = [
  {
    tag: 'PREDICTION MARKETS',
    title: 'Polymarket Integration',
    desc: 'Live prediction market odds across finance and crypto. See what the market thinks about rate decisions, BTC price, macro outcomes.',
  },
  {
    tag: 'CORRELATION',
    title: 'Cross-Asset Correlation',
    desc: 'See how CPI prints, rate decisions, and jobs data move markets across equities, crypto, and commodities in real time.',
  },
  {
    tag: 'AI INSIGHTS',
    title: 'AI Market Brief',
    desc: 'Daily AI-generated market summaries powered by Groq. Macro signals, sentiment analysis, and trend detection — bring your own key.',
  },
  {
    tag: 'MULTI-ASSET',
    title: 'All Asset Classes',
    desc: 'Equities, crypto, forex, commodities, fixed income, derivatives, and prediction markets in one customisable view.',
  },
]

const FEATURE_GRID = [
  { icon: <GridIcon />, label: '44 Live Panels', desc: 'Every panel updates automatically' },
  { icon: <SignalIcon />, label: 'Real-Time Data', desc: 'Sub-minute refresh intervals' },
  { icon: <DatabaseIcon />, label: '12+ Data Sources', desc: 'Aggregated market feeds' },
  { icon: <PredictIcon />, label: 'Polymarket', desc: 'Prediction market signals' },
  { icon: <MoonIcon />, label: 'Dark Mode', desc: 'Terminal-native dark theme' },
  { icon: <KeyboardIcon />, label: 'Keyboard Shortcuts', desc: 'Navigate without a mouse' },
  { icon: <DownloadIcon />, label: 'Export Data', desc: 'CSV export from any panel' },
]

const DATA_SOURCES = [
  { name: 'Finnhub', color: 'text-blue-400 border-blue-900 bg-blue-950/40' },
  { name: 'CoinGecko', color: 'text-green-400 border-green-900 bg-green-950/40' },
  { name: 'FRED', color: 'text-amber-400 border-amber-900 bg-amber-950/40' },
  { name: 'Frankfurter', color: 'text-purple-400 border-purple-900 bg-purple-950/40' },
  { name: 'Polymarket', color: 'text-pink-400 border-pink-900 bg-pink-950/40' },
  { name: 'Google News', color: 'text-red-400 border-red-900 bg-red-950/40' },
  { name: 'Groq AI', color: 'text-orange-400 border-orange-900 bg-orange-950/40' },
]

const SETUP_STEPS = [
  { step: '01', cmd: 'git clone github.com/jpoindexter/monoth', label: 'Clone the repo' },
  { step: '02', cmd: 'cp .env.example .env  # add your API keys', label: 'Configure env vars' },
  { step: '03', cmd: 'npm install && npm run dev', label: 'Start the dashboard' },
]

// --- Animated counter ---
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick)
      }
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return value
}

// --- Preview card types ---
interface PreviewCard {
  symbol: string
  label: string
  price: number
  change: number
}

interface TickerItem {
  symbol: string
  price: number
  changePercent: number
}

function fmt(n: number) {
  return n >= 1000 ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n.toFixed(2)
}

function MarketBar() {
  const [tickers, setTickers] = useState<TickerItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [quotes, crypto] = await Promise.all([fetchQuotes(['SPY']), fetchCryptoPrices()])
        if (cancelled) return
        const items: TickerItem[] = []
        const spy = quotes.find((q) => q.symbol === 'SPY')
        if (spy) items.push({ symbol: 'SPY', price: spy.price, changePercent: spy.changePercent })
        const btc = crypto.find((c) => c.symbol?.toUpperCase() === 'BTC' || c.id === 'bitcoin')
        const eth = crypto.find((c) => c.symbol?.toUpperCase() === 'ETH' || c.id === 'ethereum')
        if (btc) items.push({ symbol: 'BTC', price: btc.price, changePercent: btc.changePercent24h ?? 0 })
        if (eth) items.push({ symbol: 'ETH', price: eth.price, changePercent: eth.changePercent24h ?? 0 })
        setTickers(items)
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="border-b border-zinc-800 bg-zinc-950 py-2 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-6 justify-center">
          {['SPY', 'BTC', 'ETH'].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{s}</span>
              <span className="text-[10px] font-mono text-zinc-700 animate-pulse">---</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (tickers.length === 0) return null

  return (
    <motion.div
      className="border-b border-zinc-800 bg-zinc-950 py-2 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-6 justify-center flex-wrap">
        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest hidden sm:block">Live</span>
        {tickers.map((t) => {
          const up = t.changePercent >= 0
          return (
            <div key={t.symbol} className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{t.symbol}</span>
              <span className="text-[11px] font-mono text-zinc-100 tabular-nums">{fmt(t.price)}</span>
              <span className={`text-[10px] font-mono tabular-nums ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                {up ? '+' : ''}{t.changePercent.toFixed(2)}%
              </span>
            </div>
          )
        })}
        <span className="text-[10px] font-mono text-zinc-700 hidden sm:block">Delayed</span>
      </div>
    </motion.div>
  )
}

function LivePreview() {
  const [cards, setCards] = useState<PreviewCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [quotes, crypto] = await Promise.all([fetchQuotes(['SPY', 'GLD']), fetchCryptoPrices()])
        if (cancelled) return
        const result: PreviewCard[] = []
        const spy = quotes.find((q) => q.symbol === 'SPY')
        if (spy) result.push({ symbol: 'SPY', label: 'S&P 500 ETF', price: spy.price, change: spy.changePercent })
        const btc = crypto.find((c) => c.symbol?.toUpperCase() === 'BTC' || c.id === 'bitcoin')
        if (btc) result.push({ symbol: 'BTC', label: 'Bitcoin', price: btc.price, change: btc.changePercent24h ?? 0 })
        try {
          const fx = await fetch('/api/forex/rates').then((r) => r.json()).catch(() => null)
          const eurusd = fx?.rates?.USD ?? fx?.EUR?.USD ?? null
          if (eurusd) result.push({ symbol: 'EUR/USD', label: 'Euro / Dollar', price: eurusd, change: 0 })
        } catch { /* skip */ }
        const gld = quotes.find((q) => q.symbol === 'GLD')
        if (gld) result.push({ symbol: 'GLD', label: 'Gold ETF', price: gld.price, change: gld.changePercent })
        setCards(result.slice(0, 4))
      } catch { /* fail silently */ } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const placeholders = [
    { symbol: 'SPY', label: 'S&P 500 ETF' },
    { symbol: 'BTC', label: 'Bitcoin' },
    { symbol: 'EUR/USD', label: 'Euro / Dollar' },
    { symbol: 'GLD', label: 'Gold ETF' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="max-w-4xl mx-auto px-6 pb-20"
    >
      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest text-center mb-4">Live market snapshot</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading
          ? placeholders.map((p) => (
              <div key={p.symbol} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col gap-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{p.symbol}</span>
                <span className="text-[11px] text-zinc-600 font-mono">{p.label}</span>
                <div className="h-5 w-20 bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-12 bg-zinc-800 rounded animate-pulse" />
              </div>
            ))
          : (cards.length > 0 ? cards : placeholders.map((p) => ({ ...p, price: 0, change: 0 }))).map((c) => {
              const up = c.change >= 0
              return (
                <motion.div
                  key={c.symbol}
                  whileHover={{ scale: 1.02 }}
                  className="backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col gap-1 hover:border-white/20 transition-colors"
                >
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{c.symbol}</span>
                  <span className="text-[11px] text-zinc-500 font-mono truncate">{c.label}</span>
                  <span className="text-base font-mono font-semibold text-white tabular-nums mt-1">
                    {c.price > 0 ? fmt(c.price) : '---'}
                  </span>
                  {c.change !== 0 && (
                    <span className={`text-xs font-mono tabular-nums ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                      {up ? '+' : ''}{c.change.toFixed(2)}%
                    </span>
                  )}
                </motion.div>
              )
            })}
      </div>
    </motion.div>
  )
}

// --- Page ---
export function Landing() {
  const panelCount = useCountUp(44, 1400)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Live market bar */}
      <MarketBar />

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 max-w-7xl mx-auto">
        <span className="font-mono text-sm font-semibold tracking-widest text-zinc-300 uppercase">Monoth</span>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/jpoindexter/monoth"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <GitHubIcon />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <Link to="/dashboard">
            <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative flex flex-col items-center text-center px-6 pt-24 pb-20 max-w-4xl mx-auto overflow-hidden"
        style={{ isolation: 'isolate' }}
      >
        <div
          className="absolute inset-0 -z-10 opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -20%, #22c55e33 0%, transparent 70%)',
            animation: 'pulse 6s ease-in-out infinite',
          }}
        />

        {/* Open source badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-400 tracking-wider uppercase"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Open source &mdash; {panelCount} panels</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight mb-6"
        >
          Market Intelligence<br />for Everyone
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-zinc-400 max-w-2xl mb-3 leading-relaxed"
        >
          Real-time data across equities, crypto, forex, commodities, and prediction markets.
          Self-host it. Fork it. Make it yours.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-xs font-mono text-zinc-600 mb-10 tracking-wide"
        >
          12+ data sources &nbsp;&bull;&nbsp; Polymarket signals &nbsp;&bull;&nbsp; MIT license
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          <Link to="/dashboard">
            <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-200 font-semibold px-8">
              Launch Dashboard
            </Button>
          </Link>
          <a
            href="https://github.com/jpoindexter/monoth"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 px-8 gap-2">
              <GitHubIcon />
              Star on GitHub
            </Button>
          </a>
        </motion.div>
      </section>

      {/* Live preview cards */}
      <LivePreview />

      {/* Stats strip */}
      <section className="border-y border-zinc-800 bg-zinc-900">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-zinc-800">
          {[
            { label: '44 Panels', sub: 'dashboard widgets' },
            { label: '12+ Sources', sub: 'live market feeds' },
            { label: '6 Asset Classes', sub: 'in a single view' },
            { label: 'MIT License', sub: 'free to self-host' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-8 px-4 gap-1">
              <span className="font-mono text-2xl font-bold text-white">{s.label}</span>
              <span className="text-xs text-zinc-500 uppercase tracking-wide">{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest text-center mb-3">What you get</p>
        <h2 className="text-3xl font-bold text-center mb-14 text-white">Built for serious market watchers</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {FEATURE_GRID.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              whileHover={{ scale: 1.02 }}
              className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-emerald-900/60 hover:shadow-[0_0_16px_rgba(16,185,129,0.06)] transition-all cursor-default"
            >
              <div className="text-zinc-400 group-hover:text-emerald-400 transition-colors">{f.icon}</div>
              <div>
                <p className="text-sm font-semibold text-white font-mono">{f.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-zinc-600 hover:shadow-[0_0_20px_rgba(255,255,255,0.04)] transition-all"
            >
              <div className="inline-block mb-4 px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-xs font-mono text-zinc-400 tracking-widest">
                {f.tag}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Self-host setup */}
      <section className="bg-zinc-900 border-y border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest text-center mb-3">Self-host in minutes</p>
          <h2 className="text-3xl font-bold text-center mb-14 text-white">Run it yourself</h2>
          <div className="space-y-4">
            {SETUP_STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.1 }}
                className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5"
              >
                <span className="font-mono text-xs text-zinc-600 pt-0.5 flex-shrink-0">{s.step}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 mb-1.5 uppercase tracking-wide font-mono">{s.label}</p>
                  <code className="text-sm text-emerald-400 font-mono break-all">{s.cmd}</code>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-zinc-600 font-mono mt-8">
            Requires Node 20+. Free API keys from Finnhub, CoinGecko, and FRED.
          </p>
        </div>
      </section>

      {/* Data Sources */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-8">Data powered by</p>
        <div className="flex flex-wrap justify-center gap-3">
          {DATA_SOURCES.map((s) => (
            <motion.span
              key={s.name}
              whileHover={{ scale: 1.04 }}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg border font-mono text-[11px] tracking-wide font-medium ${s.color}`}
            >
              {s.name}
            </motion.span>
          ))}
        </div>
      </section>

      {/* GitHub CTA */}
      <section className="border-t border-zinc-800 bg-zinc-900 text-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-zinc-700 bg-zinc-800 mb-6 mx-auto text-zinc-400">
            <GitHubIcon />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Open source. Fork it.</h2>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto">
            MIT licensed. Add panels, swap data sources, deploy to your own infra.
            PRs welcome.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-200 font-semibold px-10">
                Launch Dashboard
              </Button>
            </Link>
            <a
              href="https://github.com/jpoindexter/monoth"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 px-8 gap-2">
                <StarIcon />
                Star on GitHub
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8 text-center">
        <p className="text-xs text-zinc-600 font-mono">
          Monoth &mdash; Open source market intelligence. MIT license. Not financial advice.
        </p>
      </footer>
    </div>
  )
}
