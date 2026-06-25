import { MOCK_QUOTES, MOCK_PREDICTIONS, MOCK_FUTURES } from './landing-data'
import { MockPanel } from './LandingPrimitives'

export function LandingDashboardPreview() {
  return (
    <div className="relative mx-auto max-w-5xl px-6">
      <div className="rounded-lg overflow-hidden border border-zinc-700/40 shadow-2xl shadow-black">
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

        <div className="bg-bg-chrome border-b border-zinc-800/50 px-3 h-6 flex items-center gap-3">
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

        <div className="bg-bg-chrome p-2 grid grid-cols-3 gap-1.5">
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

      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(16,185,129,0.08) 0%, transparent 70%)' }}
      />
    </div>
  )
}
