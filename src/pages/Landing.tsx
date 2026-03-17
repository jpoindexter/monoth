import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { LandingDashboardPreview } from './landing/LandingDashboardPreview'
import { DataSourcesBar, SetupSection, CTASection, LandingFooter } from './landing/LandingBottom'
import { LogoMark, GitHubIcon } from './landing/LandingPrimitives'

const FEATURES = [
  { label: '60+ Panels',         desc: 'Equities, crypto, forex, commodities, fixed income, prediction markets — all toggleable.'  },
  { label: 'Prediction Markets', desc: 'Live odds from Polymarket and Kalshi side by side. Fed decisions, BTC targets, macro outcomes.' },
  { label: 'Price Alerts',       desc: 'Dashboard flashes red + browser notification the instant a price threshold is crossed.'       },
  { label: 'No Login Required',  desc: 'Watchlist, alerts, and settings live in localStorage. No account, no tracking, no noise.'     },
  { label: '14+ Data Sources',   desc: 'Finnhub, CoinGecko, FRED, Yahoo Finance, Polymarket, Kalshi, and more — all aggregated.'     },
  { label: 'MIT Licensed',       desc: 'Fully open source. Fork it, self-host it, add your own panels. PRs welcome.'                 },
]

function LandingNav() {
  return (
    <nav className="border-b border-zinc-900 bg-[#0e0e0e]/95 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 h-12 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="font-mono text-[10px] font-semibold tracking-[0.22em] text-white uppercase">Monoth</span>
        </Link>
        <div className="flex-1" />
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
          <button className="h-7 px-4 rounded-[3px] bg-emerald-500 text-black text-[11px] font-semibold hover:bg-emerald-400 transition-colors">
            Launch →
          </button>
        </Link>
      </div>
    </nav>
  )
}

function LandingHero() {
  return (
    <section className="relative max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
      <div className="absolute inset-0 -z-10 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 35% at 50% 0%, rgba(16,185,129,0.06) 0%, transparent 70%)' }} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
        <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950 text-[9px] font-mono text-zinc-400 tracking-[0.15em] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Open source · MIT license
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold leading-snug tracking-tight text-white mb-5">
          Market intelligence —{' '}
          <span className="text-zinc-400 font-normal">in one dashboard.</span>
        </h1>
        <p className="text-base text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed font-light">
          Real-time data across equities, crypto, forex, commodities, and prediction markets.
          No login. No account. Self-host it or use the live version.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/dashboard">
            <button className="h-10 px-7 rounded-[3px] bg-emerald-500 text-black text-[13px] font-semibold hover:bg-emerald-400 transition-colors">
              Launch Dashboard →
            </button>
          </Link>
          <a href="https://github.com/jpoindexter/monoth" target="_blank" rel="noopener noreferrer">
            <button className="h-10 px-6 rounded-[3px] border border-zinc-700 text-zinc-300 text-[13px] hover:border-zinc-500 hover:bg-zinc-900/60 transition-colors flex items-center gap-2">
              <GitHubIcon />Star on GitHub
            </button>
          </a>
        </div>
      </motion.div>
    </section>
  )
}

function FeatureGrid() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20" id="features">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800/40 border border-zinc-800/40 rounded-[4px] overflow-hidden">
        {FEATURES.map((f) => (
          <div key={f.label} className="bg-[#0e0e0e] p-6">
            <p className="text-[13px] font-semibold text-white mb-2">{f.label}</p>
            <p className="text-[12px] text-zinc-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Landing() {
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-zinc-100 antialiased">
      <LandingNav />
      <LandingHero />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.2 }}
        className="pb-24"
      >
        <LandingDashboardPreview />
      </motion.div>
      <FeatureGrid />
      <DataSourcesBar />
      <SetupSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}
