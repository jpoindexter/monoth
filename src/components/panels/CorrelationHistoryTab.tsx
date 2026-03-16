import { rollingCellCls } from '@/components/panels/correlation-data'

interface HistoryRow {
  pair: string
  w1: number
  m1: number
  m3: number
  m6: number
}

interface Props {
  history: HistoryRow[]
  isLive: boolean
  liveAsOf?: string
}

export function CorrelationHistoryTab({ history, isLive, liveAsOf }: Props) {
  return (
    <div>
      <div
        className="grid text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1"
        style={{ gridTemplateColumns: 'minmax(64px,1fr) repeat(4, 40px)' }}
      >
        <div>Pair</div>
        <div className="text-center">1W</div>
        <div className="text-center">1M</div>
        <div className="text-center">3M</div>
        <div className="text-center">6M</div>
      </div>
      <div className="space-y-px">
        {history.map((row) => (
          <div key={row.pair} className="grid items-center gap-px" style={{ gridTemplateColumns: 'minmax(64px,1fr) repeat(4, 40px)' }}>
            <div className="text-[10px] font-semibold">{row.pair}</div>
            {([row.w1, row.m1, row.m3, row.m6] as number[]).map((val, i) => (
              <div key={i} className={`text-center text-[10px] font-semibold tabular-nums rounded-sm py-1 ${rollingCellCls(val)}`}>
                {val >= 0 ? '+' : ''}{val.toFixed(2)}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-emerald-600" /> negative (diversifies)</span>
        <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-red-600" /> positive (no hedge)</span>
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground/60">
        {isLive ? `Live · Pearson rolling windows · as of ${liveAsOf}` : 'Reference · long-run estimated rolling correlations'}
      </div>
    </div>
  )
}
