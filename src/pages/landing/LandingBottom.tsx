import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { DATA_SOURCES, SETUP_STEPS } from './landing-data'
import { SectionMark, GitHubIcon, LogoMark } from './LandingPrimitives'

export function DataSourcesBar() {
  return (
    <div className="bg-zinc-950/20 py-16" id="data">
      <div className="max-w-7xl mx-auto px-6">
        <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest text-center mb-8">Data powered by</p>
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
  )
}

export function DocsSection() {
  return (
    <div className="py-24" id="docs">
      <div className="max-w-7xl mx-auto px-6">
        <SectionMark num="07" label="How it works" tag="Docs" />
        <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mb-5">Keyboard shortcuts</p>
            <div className="space-y-2">
              {[
                { key: '/', label: 'Command palette'   },
                { key: 'R', label: 'Refresh all panels' },
                { key: 'D', label: 'Cycle theme'        },
                { key: 'L', label: 'Lock layout'        },
                { key: '?', label: 'Show shortcuts'     },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-[12px] text-zinc-400">{label}</span>
                  <kbd className="font-mono text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded-[3px]">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
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
          <div>
            <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mb-5">Tips</p>
            <div className="space-y-3">
              {[
                { title: 'Watchlist',       desc: 'Add any ticker symbol to your watchlist. Click a symbol to see detailed charts and data.' },
                { title: 'Price alerts',    desc: 'Set above/below alerts on watchlist symbols. The dashboard flashes red when triggered.' },
                { title: 'Command palette', desc: 'Press / to search panels, symbols, and actions from anywhere in the dashboard.' },
                { title: 'AI Insights',     desc: 'Add your Anthropic API key in the AI Insights panel to generate live market briefs.' },
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
  )
}

export function SetupSection() {
  return (
    <div className="py-24 bg-[#0e0e0e]" id="setup">
      <div className="max-w-3xl mx-auto px-6">
        <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mb-12">Self-host in minutes</p>
        <h2 className="text-4xl font-bold text-white mb-10">Run it yourself.</h2>
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
  )
}

export function PricingSection() {
  return (
    <div className="py-24 bg-[#0e0e0e] " id="pricing">
      <div className="max-w-4xl mx-auto px-6">
        <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest text-center mb-16">Pricing</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {['60 live panels','All asset classes','Preset layouts','Price alerts','Watchlist','No login required','MIT licensed'].map((f) => (
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
        </div>
      </div>
    </div>
  )
}

export function CTASection() {
  return (
    <div className="">
      <div className="max-w-4xl mx-auto px-6 py-36 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mb-8">Try Monoth today</p>
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-[1.05]">Everything in one place.</h2>
          <p className="text-zinc-400 mb-12 text-lg font-light">No account required. Just open it.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/dashboard">
              <button className="h-11 px-10 rounded-[3px] bg-emerald-500 text-black text-[13px] font-semibold hover:bg-emerald-400 transition-colors">
                Launch Dashboard →
              </button>
            </Link>
            <a href="https://github.com/jpoindexter/monoth" target="_blank" rel="noopener noreferrer">
              <button className="h-11 px-8 rounded-[3px] border border-zinc-700 text-zinc-300 text-[13px] hover:border-zinc-500 hover:bg-zinc-900/60 transition-colors flex items-center gap-2">
                <GitHubIcon />
                Star on GitHub
              </button>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export function LandingFooter() {
  return (
    <footer className="px-6 py-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest">Monoth</span>
        </div>
        <span className="font-mono text-[9px] text-zinc-400">© 2025 · MIT License · Not financial advice.</span>
      </div>
    </footer>
  )
}
