import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { StatsBar } from '@/components/layout/StatsBar'
import { NewsTicker } from '@/components/layout/NewsTicker'
import { LandingDashboardPreview } from './landing/LandingDashboardPreview'
import { LandingFeatures } from './landing/LandingContent'
import { DataSourcesBar, DocsSection, SetupSection, PricingSection, CTASection, LandingFooter } from './landing/LandingBottom'
import { LogoMark, GitHubIcon, useCountUp } from './landing/LandingPrimitives'

function LandingNav() {
  return (
    <nav className="sticky top-6 z-40 border-b border-zinc-900 bg-[#0e0e0e]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-12 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="font-mono text-[10px] font-semibold tracking-[0.22em] text-white uppercase">Monoth</span>
        </Link>
        <div className="hidden md:flex items-center gap-5 ml-6">
          {['Features', 'Data', 'Setup'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-[12px] text-zinc-400 hover:text-zinc-300 transition-colors">{item}</a>
          ))}
        </div>
        <div className="flex items-center gap-2.5 ml-auto">
          <a href="https://github.com/jpoindexter/monoth" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-300 transition-colors font-mono">
            <GitHubIcon />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <Link to="/dashboard">
            <button className="h-7 px-4 rounded-[3px] bg-white text-black text-[11px] font-semibold hover:bg-zinc-200 transition-colors">Launch →</button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

function LandingHero() {
  const panelCount = useCountUp(60, 1400)
  return (
    <section className="relative max-w-7xl mx-auto px-6 pt-28 pb-20 text-center overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 35% at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 70%)' }} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950 text-[9px] font-mono text-zinc-400 tracking-[0.15em] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Open source — {panelCount} panels
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold leading-snug tracking-tight text-white mb-6">
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
            <button className="h-10 px-7 rounded-[3px] bg-white text-black text-[13px] font-semibold hover:bg-zinc-100 transition-colors">Launch Dashboard</button>
          </Link>
          <a href="https://github.com/jpoindexter/monoth" target="_blank" rel="noopener noreferrer">
            <button className="h-10 px-7 rounded-[3px] border border-zinc-700 text-zinc-300 text-[13px] hover:border-zinc-500 hover:bg-zinc-900/60 transition-colors flex items-center gap-2">
              <GitHubIcon />Star on GitHub
            </button>
          </a>
        </div>
      </motion.div>
    </section>
  )
}

export function Landing() {
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-zinc-100 antialiased">
      <div className="sticky top-0 z-50"><StatsBar /></div>
      <LandingNav />
      <LandingHero />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }} className="pb-32">
        <LandingDashboardPreview />
      </motion.div>
      <LandingFeatures />
      <DataSourcesBar />
      <DocsSection />
      <SetupSection />
      <PricingSection />
      <CTASection />
      <div className="sticky bottom-0 z-50"><NewsTicker /></div>
      <LandingFooter />
    </div>
  )
}
