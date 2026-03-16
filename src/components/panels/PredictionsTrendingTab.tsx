import type { EnrichedPrediction } from './PredictionsPanel'

function fmtVol(n: number | string): string {
  const v = typeof n === 'string' ? Number(n) : n
  if (!isFinite(v)) return '$0'
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K'
  return '$' + v.toFixed(0)
}

function getMomentum(yesPct: number): { label: string; cls: string } {
  if (yesPct > 60) return { label: 'Strong Yes', cls: 'text-emerald-500 font-bold' }
  if (yesPct < 40) return { label: 'Strong No', cls: 'text-red-400 font-bold' }
  return { label: 'Contested', cls: 'text-amber-400 font-bold' }
}

interface Props {
  topFive: EnrichedPrediction[]
  topFiveMaxVol: number
  loading: boolean
}

export function PredictionsTrendingTab({ topFive, topFiveMaxVol, loading }: Props) {
  return (
    <div className="space-y-3">
      {topFive.length === 0 && !loading && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">No data available.</div>
      )}
      {topFive.map((p, i) => {
        const momentum = getMomentum(p.yesPct)
        return (
          <div key={p.id} className="rounded-md border border-border/30 p-2.5 bg-background/50">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-[11px] font-bold text-muted-foreground shrink-0 mt-0.5">#{i + 1}</span>
              <div className="text-[13px] font-semibold text-foreground leading-snug flex-1">{p.title}</div>
            </div>
            <div className="flex-1 h-4 rounded-sm overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex mb-2">
              <div className="h-full bg-emerald-500 flex items-center justify-center" style={{ width: `${p.yesPct}%` }}>
                {p.yesPct >= 15 && <span className="text-[9px] font-bold text-white">Yes {p.yesPct}%</span>}
              </div>
              <div className="h-full bg-red-400 flex items-center justify-center" style={{ width: `${p.noPct}%` }}>
                {p.noPct >= 15 && <span className="text-[9px] font-bold text-white">No {p.noPct}%</span>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-foreground/20">
                <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${(p.volume / topFiveMaxVol) * 100}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{fmtVol(p.volume)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Momentum</span>
              <span className={`text-[10px] ${momentum.cls}`}>{momentum.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
