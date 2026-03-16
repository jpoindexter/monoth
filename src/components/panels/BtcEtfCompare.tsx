const ETF_SYMBOLS = ['IBIT', 'FBTC', 'GBTC', 'ARKB', 'BITB']

const ETF_META: Record<string, { fee: number; aum: number; fullName: string }> = {
  IBIT: { fee: 0.25, aum: 50, fullName: 'iShares Bitcoin Trust' },
  FBTC: { fee: 0.25, aum: 18, fullName: 'Fidelity Wise Origin BTC' },
  GBTC: { fee: 1.50, aum: 22, fullName: 'Grayscale Bitcoin Trust' },
  ARKB: { fee: 0.21, aum: 5,  fullName: 'ARK 21Shares Bitcoin ETF' },
  BITB: { fee: 0.20, aum: 3,  fullName: 'Bitwise Bitcoin ETF' },
}

const maxAUM = Math.max(...ETF_SYMBOLS.map((t) => ETF_META[t]?.aum ?? 0))
const minFee = Math.min(...ETF_SYMBOLS.map((t) => ETF_META[t]?.fee ?? Infinity))

export function BtcEtfCompare() {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">AUM ($B)</div>
        <div className="space-y-1.5">
          {ETF_SYMBOLS.map((ticker) => {
            const meta = ETF_META[ticker]
            const aum = meta?.aum ?? 0
            const barPct = (aum / maxAUM) * 100
            const isLargest = aum === maxAUM
            return (
              <div key={ticker}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-medium">{ticker}</span>
                    {isLargest && (
                      <span className="text-[7px] font-bold uppercase tracking-wider px-1 py-px rounded-sm bg-amber-500/20 text-amber-500">
                        LARGEST
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] tabular-nums text-foreground">${aum}B</span>
                </div>
                <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${barPct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-border/20 pt-2">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Expense Ratio</div>
        <div className="space-y-0.5">
          {ETF_SYMBOLS.map((ticker) => {
            const meta2 = ETF_META[ticker]
            const fee = meta2?.fee ?? 0
            const isCheapest = fee === minFee
            return (
              <div key={ticker} className="flex items-center justify-between py-0.5 border-b border-border/10 last:border-0">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-medium">{ticker}</span>
                  {isCheapest && (
                    <span className="text-[7px] font-bold uppercase tracking-wider px-1 py-px rounded-sm bg-emerald-500/20 text-emerald-500">
                      CHEAPEST
                    </span>
                  )}
                </div>
                <span className={`text-[11px] tabular-nums font-medium ${fee >= 1 ? 'text-red-500' : 'text-foreground'}`}>
                  {fee.toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
