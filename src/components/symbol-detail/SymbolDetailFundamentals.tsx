import { fmtBig, fmtPct, fmtNum } from './helpers'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/15">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-[11px] font-medium tabular-nums text-foreground">{value}</span>
    </div>
  )
}

interface Props {
  fundsLoading: boolean
  fundamentals: Record<string, number | string | null> | null
}

export function SymbolDetailFundamentals({ fundsLoading, fundamentals }: Props) {
  if (fundsLoading) {
    return <div className="px-5 py-4 h-20 flex items-center justify-center text-[10px] text-muted-foreground animate-pulse">Loading…</div>
  }
  if (!fundamentals) {
    return <div className="px-5 py-4 text-[10px] text-muted-foreground text-center py-8">No fundamental data available</div>
  }

  const f = fundamentals as Record<string, number | null | undefined>

  return (
    <div className="px-5 py-4 space-y-4">
      {(fundamentals.sector || fundamentals.industry) && (
        <div className="text-[10px] text-muted-foreground">
          {fundamentals.sector as string}
          {fundamentals.industry ? ` · ${fundamentals.industry as string}` : ''}
        </div>
      )}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Valuation</div>
        <Row label="P/E (TTM)" value={fmtNum(f.peRatio)} />
        <Row label="Forward P/E" value={fmtNum(f.forwardPE)} />
        <Row label="P/B" value={fmtNum(f.pbRatio)} />
        <Row label="P/S (TTM)" value={fmtNum(f.priceToSales)} />
        <Row label="EV/EBITDA" value={fmtNum(f.evToEbitda)} />
        <Row label="PEG Ratio" value={fmtNum(f.pegRatio)} />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Profitability</div>
        <Row label="Net Margin" value={fmtPct(f.profitMargin)} />
        <Row label="Operating Margin" value={fmtPct(f.operatingMargin)} />
        <Row label="ROE" value={fmtPct(f.roe)} />
        <Row label="ROA" value={fmtPct(f.roa)} />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Growth</div>
        <Row label="Revenue Growth" value={fmtPct(f.revenueGrowth)} />
        <Row label="Earnings Growth" value={fmtPct(f.earningsGrowth)} />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Balance Sheet</div>
        <Row label="Market Cap" value={fmtBig(f.marketCap)} />
        <Row label="Revenue (TTM)" value={fmtBig(f.revenue)} />
        <Row label="EBITDA" value={fmtBig(f.ebitda)} />
        <Row label="Debt/Equity" value={fmtNum(f.debtToEquity)} />
        <Row label="Current Ratio" value={fmtNum(f.currentRatio)} />
        <Row label="Beta" value={fmtNum(f.beta)} />
      </div>
    </div>
  )
}
