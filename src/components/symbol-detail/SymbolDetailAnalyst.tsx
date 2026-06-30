import { ACTION_LABELS, ACTION_CLS } from './helpers'

interface AnalystRating {
  action: string
  firm?: string
  fromGrade?: string
  toGrade?: string
  date?: string
}

interface Props {
  analystLoading: boolean
  analystData: unknown[] | null
}

export function SymbolDetailAnalyst({ analystLoading, analystData }: Props) {
  if (analystLoading) {
    return <div className="px-5 py-4 h-20 flex items-center justify-center text-[10px] text-muted-foreground animate-pulse">Loading…</div>
  }
  if (!analystData || analystData.length === 0) {
    return <div className="px-5 py-4 text-[10px] text-muted-foreground text-center py-8">No analyst ratings in the last 90 days</div>
  }

  return (
    <div className="px-5 py-4 space-y-0">
      {(analystData as AnalystRating[]).map((r, i) => (
        <div key={i} className="flex items-start gap-2 border-t border-border/15 py-2">
          <span className={`text-[9px] font-bold uppercase w-14 shrink-0 mt-0.5 ${ACTION_CLS[r.action] ?? 'text-muted-foreground'}`}>
            {ACTION_LABELS[r.action] ?? r.action}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium truncate">{r.firm}</div>
            {(r.fromGrade || r.toGrade) && (
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {r.fromGrade && <span>{r.fromGrade}</span>}
                {r.fromGrade && r.toGrade && <span className="mx-1">→</span>}
                {r.toGrade && <span className={ACTION_CLS[r.action] ?? ''}>{r.toGrade}</span>}
              </div>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">{r.date?.slice(5)}</span>
        </div>
      ))}
    </div>
  )
}
