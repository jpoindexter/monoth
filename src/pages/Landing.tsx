import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { LandingDashboardPreview } from './landing/LandingDashboardPreview'
import { DataSourcesBar, SetupSection, LandingFooter } from './landing/LandingBottom'
import { LogoMark, GitHubIcon } from './landing/LandingPrimitives'

const STATS = [
  { n: '60+',  label: 'live panels'    },
  { n: '14+',  label: 'data sources'   },
  { n: '6',    label: 'asset classes'  },
  { n: 'MIT',  label: 'open source'    },
]

const FEATURES = [
  { n: '01', label: 'Prediction Markets', desc: 'Live Polymarket and Kalshi odds side by side — rate decisions, BTC targets, macro outcomes.'   },
  { n: '02', label: 'Price Alerts',       desc: 'Set above/below thresholds. Dashboard flashes red and you get a browser notification instantly.' },
  { n: '03', label: 'No Login Required',  desc: 'Watchlist, alerts, and settings live in localStorage. No email, no tracking, no account.'       },
  { n: '04', label: 'Congress Trades',    desc: 'Real-time disclosure feed. See exactly what senators and representatives are buying and selling.' },
  { n: '05', label: 'Macro Dashboard',    desc: 'Yield curve, FRED data, FedWatch, CPI, GDP, M2 — the macro picture in one view.'                },
  { n: '06', label: 'Self-Hostable',      desc: 'MIT licensed. Clone, fork, add panels, swap sources, deploy to your own infra.'                  },
]

function LandingNav() {
  return (
    <nav className="bg-black sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-white uppercase">Monoth</span>
        </Link>
        <div className="flex-1" />
        <a
          href="https://github.com/jpoindexter/monoth"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors mr-4"
        >
          <GitHubIcon />
          <span className="hidden sm:inline font-mono">GitHub</span>
        </a>
        <Link to="/dashboard">
          <button className="h-8 px-5 rounded-full bg-emerald-500 text-black text-[11px] font-bold hover:bg-emerald-400 transition-colors tracking-wide">
            Launch →
          </button>
        </Link>
      </div>
    </nav>
  )
}

function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-black">
      {/* atmospheric glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.12) 0%, transparent 65%)' }}
      />
      <div className="relative max-w-5xl mx-auto px-6 pt-28 pb-20 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 mb-10 px-3 py-1 rounded-full bg-zinc-900 text-[9px] font-mono text-zinc-400 tracking-[0.18em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Open source · MIT license
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight text-white mb-6">
            Everything happening<br />
            <span className="text-zinc-500 font-light">in markets, right now.</span>
          </h1>
          <p className="text-[15px] text-zinc-400 max-w-lg mx-auto mb-12 leading-relaxed">
            60+ live panels across equities, crypto, forex, commodities, prediction markets,
            and macro data — in one configurable dashboard. No login required.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/dashboard">
              <button className="h-11 px-8 rounded-full bg-emerald-500 text-black text-[13px] font-bold hover:bg-emerald-400 transition-colors tracking-wide">
                Launch Dashboard →
              </button>
            </Link>
            <a href="https://github.com/jpoindexter/monoth" target="_blank" rel="noopener noreferrer">
              <button className="h-11 px-7 rounded-full bg-zinc-900 text-zinc-300 text-[13px] hover:bg-zinc-800 transition-colors flex items-center gap-2">
                <GitHubIcon />Star on GitHub
              </button>
            </a>
          </div>
        </motion.div>

        {/* stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-900 rounded-xl overflow-hidden max-w-2xl mx-auto"
        >
          {STATS.map((s) => (
            <div key={s.label} className="bg-black px-6 py-5 text-center">
              <div className="text-2xl font-bold text-white tracking-tight">{s.n}</div>
              <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function FeatureGrid() {
  return (
    <div className="bg-black py-24" id="features">
      <div className="max-w-5xl mx-auto px-6">
        <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mb-14">What's inside</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900 rounded-xl overflow-hidden">
          {FEATURES.map((f) => (
            <div key={f.n} className="bg-black p-8 hover:bg-zinc-950 transition-colors">
              <span className="font-mono text-[9px] text-zinc-600 mb-4 block">{f.n}</span>
              <p className="text-[14px] font-semibold text-white mb-2">{f.label}</p>
              <p className="text-[12px] text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Landing() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 antialiased">
      <LandingNav />
      <LandingHero />

      {/* dashboard preview */}
      <div className="bg-black py-12 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <LandingDashboardPreview />
        </motion.div>
      </div>

      <FeatureGrid />
      <DataSourcesBar />
      <SetupSection />

      {/* CTA */}
      <div className="relative bg-black overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(16,185,129,0.1) 0%, transparent 70%)' }}
        />
        <div className="relative max-w-3xl mx-auto px-6 py-36 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-5xl sm:text-6xl font-bold text-white mb-5 leading-[1.05] tracking-tight">
              Every market.<br />
              <span className="text-zinc-500 font-light">One dashboard.</span>
            </h2>
            <p className="text-zinc-400 mb-10 text-[15px] font-light">No account required. Just open it.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/dashboard">
                <button className="h-11 px-10 rounded-full bg-emerald-500 text-black text-[13px] font-bold hover:bg-emerald-400 transition-colors">
                  Launch Dashboard →
                </button>
              </Link>
              <a href="https://github.com/jpoindexter/monoth" target="_blank" rel="noopener noreferrer">
                <button className="h-11 px-8 rounded-full bg-zinc-900 text-zinc-300 text-[13px] hover:bg-zinc-800 transition-colors flex items-center gap-2">
                  <GitHubIcon />Star on GitHub
                </button>
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
