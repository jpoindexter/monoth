import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
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

// --- Data ---
const STATS = [
  { label: '36 Panels', sub: 'dashboard widgets' },
  { label: '10 Data Sources', sub: 'live market feeds' },
  { label: '6 Asset Classes', sub: 'in a single view' },
  { label: 'Free Forever', sub: 'no credit card needed' },
]

const FEATURES = [
  {
    tag: 'CORRELATION',
    title: 'Correlation Engine',
    desc: 'See how CPI prints, rate decisions, and jobs data move markets across asset classes in real time.',
  },
  {
    tag: 'LIVE DATA',
    title: 'Real-Time Data',
    desc: 'Live prices from Finnhub, FRED, CoinGecko, Polymarket, and more. Auto-refreshing, no manual reload.',
  },
  {
    tag: 'AI INSIGHTS',
    title: 'AI Market Brief',
    desc: 'Daily AI-generated market summaries powered by Groq. Macro signals, sentiment analysis, and trend detection.',
  },
  {
    tag: 'MULTI-ASSET',
    title: 'All Asset Classes',
    desc: 'Equities, crypto, forex, commodities, fixed income, derivatives, and prediction markets in one view.',
  },
]

const FEATURE_GRID = [
  { icon: <GridIcon />, label: '36 Live Panels', desc: 'Every panel updates live' },
  { icon: <SignalIcon />, label: 'Real-Time Data', desc: 'Sub-minute refresh intervals' },
  { icon: <DatabaseIcon />, label: '10+ Data Sources', desc: 'Aggregated market feeds' },
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
]

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    note: 'forever',
    highlight: false,
    features: [
      'All 36 panels',
      '5-15 min delayed data',
      'Bring your own AI key',
      '5 watchlist items',
      'CSV export',
    ],
  },
  {
    name: 'Pro',
    price: '$19',
    note: 'per month',
    highlight: true,
    features: [
      'Under 60s refresh',
      'AI included',
      'Unlimited watchlist',
      'Saved layouts',
      'Priority support',
    ],
  },
  {
    name: 'API',
    price: '$29',
    note: 'per month',
    highlight: false,
    features: [
      'REST endpoints',
      '1K-50K req/day',
      'JSON + webhooks',
      'API key management',
      'Usage dashboard',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Contact us',
    note: '',
    highlight: false,
    features: [
      'White-label deploy',
      'SSO / SAML',
      'Custom connectors',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
]

// --- Market ticker ---
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
        const [quotes, crypto] = await Promise.all([
          fetchQuotes(['SPY']),
          fetchCryptoPrices(),
        ])
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
        // silently fail - don't block the page
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
        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest hidden sm:block">Live</span>
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
        <span className="text-[9px] font-mono text-zinc-700 hidden sm:block">Delayed data</span>
      </div>
    </motion.div>
  )
}

// --- Page ---
export function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Live market bar */}
      <MarketBar />

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 max-w-7xl mx-auto">
        <span className="font-mono text-sm font-semibold tracking-widest text-zinc-300 uppercase">Monoth</span>
        <Link to="/dashboard">
          <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            Dashboard
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block mb-6 px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-400 tracking-wider uppercase"
        >
          Open Access Market Intelligence
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight mb-6"
        >
          Free Market Intelligence<br />for Everyone
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed"
        >
          Real-time data across equities, crypto, forex, commodities, and bonds.
          No paywall.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          <Link to="/dashboard">
            <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-200 font-semibold px-8">
              Launch Dashboard
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 px-8">
              Learn More
            </Button>
          </a>
        </motion.div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-zinc-800 bg-zinc-900">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-zinc-800">
          {STATS.map((s) => (
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

        {/* Visual feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
          {FEATURE_GRID.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 transition-colors"
            >
              <div className="text-zinc-400">{f.icon}</div>
              <div>
                <p className="text-sm font-semibold text-white font-mono">{f.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detailed feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-zinc-600 transition-colors">
              <div className="inline-block mb-4 px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-xs font-mono text-zinc-400 tracking-widest">
                {f.tag}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-zinc-900 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest text-center mb-3">Pricing</p>
          <h2 className="text-3xl font-bold text-center mb-14 text-white">Simple, transparent pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIERS.map((t) => (
              <Card
                key={t.name}
                className={`flex flex-col p-6 rounded-xl border ${
                  t.highlight
                    ? 'border-white bg-white text-zinc-900'
                    : 'border-zinc-700 bg-zinc-950 text-zinc-100'
                }`}
              >
                <div className="mb-4">
                  <p className={`text-xs font-mono uppercase tracking-widest mb-2 ${t.highlight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                    {t.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono">{t.price}</span>
                    {t.note && (
                      <span className={`text-xs ${t.highlight ? 'text-zinc-600' : 'text-zinc-500'}`}>{t.note}</span>
                    )}
                  </div>
                </div>
                <ul className="flex-1 space-y-2 mb-6">
                  {t.features.map((feat) => (
                    <li key={feat} className={`text-sm flex items-center gap-2 ${t.highlight ? 'text-zinc-700' : 'text-zinc-400'}`}>
                      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${t.highlight ? 'bg-zinc-500' : 'bg-zinc-600'}`} />
                      {feat}
                    </li>
                  ))}
                </ul>
                {t.name === 'Enterprise' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    Contact us
                  </Button>
                ) : t.highlight ? (
                  <Link to="/dashboard">
                    <Button size="sm" className="w-full bg-zinc-900 text-white hover:bg-zinc-800">
                      Get started
                    </Button>
                  </Link>
                ) : (
                  <Link to="/dashboard">
                    <Button size="sm" variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                      Get started
                    </Button>
                  </Link>
                )}
              </Card>
            ))}
          </div>
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

      {/* Footer CTA */}
      <section className="border-t border-zinc-800 bg-zinc-900 text-center px-6 py-20">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to start?</h2>
        <p className="text-zinc-400 mb-8">No account required. Just open the dashboard and go.</p>
        <Link to="/dashboard">
          <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-200 font-semibold px-10">
            Launch Dashboard
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8 text-center">
        <p className="text-xs text-zinc-600 font-mono">Monoth &mdash; Free market intelligence. Not financial advice.</p>
      </footer>
    </div>
  )
}
