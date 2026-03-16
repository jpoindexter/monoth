type CyclePhase = 'EARLY CYCLE' | 'MID CYCLE' | 'LATE CYCLE' | 'DOWNTURN'

const CYCLE_PHASE_CLS: Record<CyclePhase, string> = {
  'EARLY CYCLE': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
  'MID CYCLE': 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
  'LATE CYCLE': 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
  'DOWNTURN': 'text-red-500 bg-red-50 dark:bg-red-950/30',
}

const SUPERCYCLE_SECTORS: { name: string; phase: CyclePhase }[] = [
  { name: 'Precious Metals', phase: 'LATE CYCLE' },
  { name: 'Energy', phase: 'MID CYCLE' },
  { name: 'Agriculture', phase: 'EARLY CYCLE' },
  { name: 'Industrial Metals', phase: 'MID CYCLE' },
  { name: 'Livestock', phase: 'DOWNTURN' },
  { name: 'Softs (Coffee, Cocoa, Sugar)', phase: 'LATE CYCLE' },
]

export function CommoditiesSupercycleTab() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-muted-foreground">Bloomberg Cmdty Index (proxy)</span>
          <div className="text-right">
            <span className="text-[11px] tabular-nums font-medium text-foreground">214.3</span>
            <span className="text-[10px] text-amber-600 ml-1">+18% vs 10Y avg</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-muted-foreground">Cmdty/Equity ratio (GLD+USO/SPY)</span>
          <div className="text-right">
            <span className="text-[11px] tabular-nums font-medium text-foreground">0.42</span>
            <span className="text-[10px] text-emerald-600 ml-1">Trending up</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border/20 pt-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Sector Cycle Position</div>
        <div className="flex flex-col gap-1">
          {SUPERCYCLE_SECTORS.map((sector) => (
            <div key={sector.name} className="flex items-center justify-between">
              <span className="text-[11px] text-foreground">{sector.name}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${CYCLE_PHASE_CLS[sector.phase]}`}>
                {sector.phase}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/20 pt-2 flex items-center justify-between">
        <span className="text-[11px] font-medium text-foreground">Supercycle Signal</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30">
          BULLISH
        </span>
      </div>
    </div>
  )
}
