type Signal = 'bullish' | 'bearish' | 'neutral'

const SIGNAL_TEXT: Record<Signal, string> = {
  bullish: 'text-emerald-600',
  bearish: 'text-red-500',
  neutral: 'text-yellow-500',
}

interface FlowItem {
  name: string
  flow: number
}

const ETF_FLOWS: FlowItem[] = [
  { name: 'US Equity', flow: 2.1 },
  { name: 'Intl Equity', flow: -0.8 },
  { name: 'Fixed Income', flow: 1.5 },
  { name: 'Money Market', flow: 3.2 },
  { name: 'Commodities', flow: 0.4 },
  { name: 'Crypto', flow: 0.6 },
]

const MAX_FLOW = Math.max(...ETF_FLOWS.map((f) => Math.abs(f.flow)))

function deriveRiskAppetite(): Signal {
  const usEquity = ETF_FLOWS.find((f) => f.name === 'US Equity')?.flow ?? 0
  const moneyMkt = ETF_FLOWS.find((f) => f.name === 'Money Market')?.flow ?? 0
  if (usEquity > 0 && usEquity > moneyMkt * 0.5) return 'bullish'
  if (moneyMkt > usEquity * 1.5) return 'bearish'
  return 'neutral'
}

export function MarketAnalysisFlows() {
  const riskAppetite = deriveRiskAppetite()
  const totalEquity = ETF_FLOWS.filter((f) => f.name.includes('Equity')).reduce((s, f) => s + f.flow, 0)
  const moneyMkt = ETF_FLOWS.find((f) => f.name === 'Money Market')?.flow ?? 0

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {ETF_FLOWS.map((item) => {
          const pos = item.flow >= 0
          const barPct = (Math.abs(item.flow) / MAX_FLOW) * 100
          const fmt = (v: number) => `${v >= 0 ? '+' : ''}$${Math.abs(v) >= 1 ? `${v.toFixed(1)}B` : `${(v * 1000).toFixed(0)}M`}`
          return (
            <div key={item.name} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground w-24">{item.name}</span>
                <div className="flex-1 mx-2 h-2 rounded-full bg-border/30 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${pos ? 'bg-emerald-500' : 'bg-red-500'} transition-all`}
                    style={{ width: `${barPct}%`, marginLeft: pos ? '0' : 'auto' }}
                  />
                </div>
                <div className="flex items-center gap-1 w-16 justify-end">
                  <span className={`text-[10px] tabular-nums font-medium ${pos ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(item.flow)}</span>
                  <span className={`text-[10px] ${pos ? 'text-emerald-600' : 'text-red-500'}`}>{pos ? '▲' : '▼'}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-2 border-t border-border/30 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Appetite</span>
          <span className={`text-[13px] font-bold ${SIGNAL_TEXT[riskAppetite]}`}>{riskAppetite.toUpperCase()}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Equity flows {totalEquity >= 0 ? '+' : ''}${totalEquity.toFixed(1)}B</span>
          <span>Money Mkt +${moneyMkt.toFixed(1)}B</span>
        </div>
      </div>
    </div>
  )
}
