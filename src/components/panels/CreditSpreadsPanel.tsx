import { useState, useCallback } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { tabCls, fmt } from '@/lib/panel-utils'

interface SpreadEntry {
  id: string
  name: string
  spread: number | null
  change: number
  date: string
}

type RiskLabel = 'TIGHT' | 'NORMAL' | 'WIDE' | 'CRISIS'

function hyRiskLabel(bps: number): RiskLabel {
  if (bps < 300) return 'TIGHT'
  if (bps <= 500) return 'NORMAL'
  if (bps <= 800) return 'WIDE'
  return 'CRISIS'
}

function riskColor(label: RiskLabel): string {
  if (label === 'TIGHT') return 'text-emerald-400'
  if (label === 'NORMAL') return 'text-emerald-600'
  if (label === 'WIDE') return 'text-amber-400'
  return 'text-red-400'
}

function SpreadsTab({ spreads }: { spreads: SpreadEntry[] }) {
  return (
    <div className="space-y-0.5">
      <div className="grid grid-cols-3 gap-x-2 mb-1 px-1">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Market</span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider text-right">OAS (bps)</span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider text-right">Chg</span>
      </div>
      {spreads.map((s) => (
        <div key={s.id} className="grid grid-cols-3 gap-x-2 px-1 py-0.5 rounded-sm hover:bg-muted/30">
          <span className="text-[10px] truncate">{s.name}</span>
          <span className="text-[10px] tabular-nums text-right font-medium">
            {s.spread != null ? fmt(s.spread, 0) : '—'}
          </span>
          <span className={`text-[10px] tabular-nums text-right ${s.change > 0 ? 'text-red-400' : s.change < 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
            {s.change !== 0 ? `${s.change > 0 ? '+' : ''}${fmt(s.change, 1)}` : '—'}
          </span>
        </div>
      ))}
      <p className="text-[9px] text-muted-foreground/50 mt-1 px-1">Higher spread = wider = more stress</p>
    </div>
  )
}

function RiskTab({ spreads }: { spreads: SpreadEntry[] }) {
  const hy = spreads.find((s) => s.id === 'BAMLH0A0HYM2')
  const ig = spreads.find((s) => s.id === 'BAMLC0A0CM')

  if (!hy?.spread) return <div className="text-[10px] text-muted-foreground">No data</div>

  const label = hyRiskLabel(hy.spread)
  const color = riskColor(label)

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">HY Spreads</span>
          <span className={`text-[11px] font-semibold tabular-nums ${color}`}>{fmt(hy.spread, 0)} bps</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-muted/40 ${color}`}>
            {label}
          </span>
        </div>
        {ig?.spread != null && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">IG Spreads</span>
            <span className="text-[10px] tabular-nums font-medium">{fmt(ig.spread, 0)} bps</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 text-[10px] text-muted-foreground leading-relaxed">
        <p>Credit spreads are the extra yield investors demand over Treasuries for taking on corporate default risk.</p>
        <p>
          {label === 'TIGHT' && 'Tight spreads signal strong risk appetite and easy credit conditions.'}
          {label === 'NORMAL' && 'Spreads are in a normal range — markets pricing moderate credit risk.'}
          {label === 'WIDE' && 'Wide spreads indicate rising stress and tighter lending conditions.'}
          {label === 'CRISIS' && 'Spreads at crisis levels signal severe market stress and possible credit crunch.'}
        </p>
        <p className="text-[9px]">Thresholds: HY &lt;300 = TIGHT, 300-500 = NORMAL, 500-800 = WIDE, &gt;800 = CRISIS</p>
      </div>
    </div>
  )
}

export default function CreditSpreadsPanel() {
  const [tab, setTab] = useState<'spreads' | 'risk'>('spreads')

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/macro/credit-spreads')
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<SpreadEntry[]>
  }, [])

  const { data, loading, error, refresh } = usePolling({ fetcher, interval: 3_600_000 })

  return (
    <PanelWrapper title="Credit Spreads" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'spreads')} onClick={() => setTab('spreads')}>Spreads</button>
        <button className={tabCls(tab === 'risk')} onClick={() => setTab('risk')}>Risk</button>
      </div>

      {tab === 'spreads' && data && <SpreadsTab spreads={data} />}
      {tab === 'risk' && data && <RiskTab spreads={data} />}
    </PanelWrapper>
  )
}
