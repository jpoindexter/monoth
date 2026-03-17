import { Link } from 'react-router-dom'
import { MOCK_PREDICTIONS } from './landing-data'
import { SectionMark } from './LandingPrimitives'

export function PanelsSection() {
  return (
    <>
      <SectionMark num="01" label="All the data" tag="Panels" />
      <div className="py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-[1.1]">
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
            {['Live Markets','Futures Strip','Sector Heatmap','Watchlist','Prediction Markets','Congress Trades','Crypto Markets','Options Flow','Dark Pool Activity','Yield Curve','Credit Spreads','FX Heatmap','AI Insights','Economic Calendar'].map((p) => (
              <div key={p} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[12px] text-zinc-300">{p}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" style={{ boxShadow: '0 0 4px rgba(16,185,129,0.4)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export function PredictionsSection() {
  const items = [
    ...MOCK_PREDICTIONS,
    { title: 'Recession in 2025?',     yes: 28, no: 72, src: 'KALSHI' },
    { title: 'Gold above $3,500 EOY?', yes: 44, no: 56, src: 'POLY'   },
  ]
  return (
    <>
      <SectionMark num="02" label="Prediction Markets" tag="Signals" />
      <div className="py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="order-2 md:order-1 space-y-2">
          {items.map((p) => (
            <div key={p.title} className="border border-zinc-800 rounded-[3px] p-4 bg-zinc-950">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-zinc-300 leading-snug flex-1 pr-3">{p.title}</span>
                <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded-[2px] border shrink-0 ${p.src === 'KALSHI' ? 'border-sky-900 bg-sky-950/80 text-sky-400' : 'border-purple-900 bg-purple-950/80 text-purple-400'}`}>{p.src}</span>
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
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-[1.1]">
            The market's<br />
            <em className="not-italic text-zinc-400">collective forecast.</em>
          </h2>
          <p className="text-zinc-400 leading-relaxed mb-6 text-[15px]">
            Live odds from Polymarket and Kalshi — both sources, side by side. Probability bars
            for rate decisions, macro outcomes, election results, and crypto targets. 86+ markets,
            refreshed every 5 minutes.
          </p>
          <div className="flex gap-3">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-1 rounded-[2px] border border-purple-900 bg-purple-950/50 text-purple-400">Polymarket</span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-1 rounded-[2px] border border-sky-900 bg-sky-950/50 text-sky-400">Kalshi</span>
          </div>
        </div>
      </div>
    </>
  )
}

export function AlertsSection() {
  return (
    <>
      <SectionMark num="03" label="Price Alerts" tag="Monitoring" />
      <div className="py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-[1.1]">
            Don't watch.<br />
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
              <div key={a.sym} className={`flex items-center justify-between border rounded-[3px] px-4 py-3 ${a.status === 'triggered' ? 'border-red-800/80 bg-red-950/20' : 'border-zinc-800 bg-zinc-950'}`}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[13px] font-bold text-white">{a.sym}</span>
                  <span className="font-mono text-[10px] text-zinc-400">{a.dir} {a.price}</span>
                </div>
                <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-[2px] ${a.status === 'triggered' ? 'bg-red-500 text-white' : 'bg-zinc-800/80 text-zinc-400'}`}>{a.status}</span>
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
    </>
  )
}

export function LayoutsSection() {
  return (
    <>
      <SectionMark num="04" label="Preset Layouts" tag="Customize" />
      <div className="py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        <div className="order-2 md:order-1 grid grid-cols-2 gap-2">
          {['Overview','Markets','Macro','Crypto','News','Video'].map((name, idx) => (
            <div key={name} className={`border rounded-[3px] p-4 ${idx === 0 ? 'border-emerald-800/60 bg-emerald-950/15' : 'border-zinc-800 bg-zinc-950'}`}>
              <div className={`font-mono text-[9px] uppercase tracking-widest mb-3 ${idx === 0 ? 'text-emerald-500' : 'text-zinc-400'}`}>{name}</div>
              <div className="grid grid-cols-3 gap-[2px]">
                {[2,1,2,1,1,2].map((w, j) => (
                  <div key={j} className={`h-3 rounded-[1px] ${idx === 0 ? 'bg-emerald-900/50' : 'bg-zinc-800/80'}`} style={{ gridColumn: `span ${w}` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="order-1 md:order-2">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-[1.1]">
            Six presets.<br />
            <em className="not-italic text-zinc-400">One click to switch.</em>
          </h2>
          <p className="text-zinc-400 leading-relaxed mb-6 text-[15px]">
            Overview, Markets, Macro, Crypto, News, Video — each preset activates a curated
            set of panels optimized for that workflow. Or build your own by toggling panels
            individually in settings.
          </p>
          <p className="font-mono text-[11px] text-zinc-400">Layouts persist across sessions. Panels remember their state.</p>
        </div>
      </div>
    </>
  )
}

export function PrivacySection() {
  return (
    <>
      <SectionMark num="05" label="Private by default" tag="Data" />
      <div className="py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-[1.1]">
            No account. No tracking.<br />
            <em className="not-italic text-zinc-400">Your data stays local.</em>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'No login required',      desc: "Open the dashboard and it works. No email, no password, no OAuth. Your watchlist and settings live in localStorage." },
            { title: 'No server-side storage', desc: "We don't store your watchlist, portfolio, or alerts on any server. Everything is local to your browser." },
            { title: 'Self-host it',           desc: "Clone the repo and run it on your own infrastructure. MIT licensed — own the code, own the data, own the stack." },
          ].map((f) => (
            <div key={f.title} className="border border-zinc-800 rounded-[3px] bg-zinc-950 p-6">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mb-4" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
              <h3 className="text-[15px] font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-[13px] text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export function LandingFeatures() {
  return (
    <div className="max-w-7xl mx-auto px-6" id="features">
      <PanelsSection />
      <PredictionsSection />
      <AlertsSection />
      <LayoutsSection />
      <PrivacySection />
    </div>
  )
}

// Re-export for direct link usage
export { Link }
