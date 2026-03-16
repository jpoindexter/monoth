import type { FredSeries } from '@/services/api/macro'

type CyclePhase = 'early-expansion' | 'late-expansion' | 'early-contraction' | 'late-contraction'

interface PhaseConfig {
  label: string
  assets: string[]
  color: string
  bgColor: string
  borderColor: string
}

const CYCLE_PHASES: Record<CyclePhase, PhaseConfig> = {
  'early-expansion': {
    label: 'Early Expansion',
    assets: ['Stocks', 'Credit'],
    color: '#10b981',
    bgColor: '#10b98115',
    borderColor: '#10b98133',
  },
  'late-expansion': {
    label: 'Late Expansion',
    assets: ['Commodities', 'Inflation hedges'],
    color: '#f59e0b',
    bgColor: '#f59e0b15',
    borderColor: '#f59e0b33',
  },
  'early-contraction': {
    label: 'Early Contraction',
    assets: ['Bonds', 'Defensive stocks'],
    color: '#f97316',
    bgColor: '#f9731615',
    borderColor: '#f9731633',
  },
  'late-contraction': {
    label: 'Late Contraction',
    assets: ['Cash', 'Short-term bonds'],
    color: '#ef4444',
    bgColor: '#ef444415',
    borderColor: '#ef444433',
  },
}

const PHASE_ORDER: CyclePhase[] = ['early-expansion', 'late-expansion', 'early-contraction', 'late-contraction']

function computePhase(fredData: FredSeries[]): CyclePhase | null {
  const get = (id: string) => fredData.find(d => d.seriesId === id)
  const dgs2 = get('DGS2')
  const dgs10 = get('DGS10')
  const unrate = get('UNRATE')
  const fedfunds = get('FEDFUNDS')

  if (!dgs2 && !dgs10 && !unrate && !fedfunds) return null

  const spread = dgs2 && dgs10 ? dgs10.value - dgs2.value : null
  const unrateHigh = unrate ? unrate.value > 5 : false
  const fedCutting = fedfunds ? fedfunds.value < 3 : false

  if (spread !== null && spread < 0 && unrateHigh) return 'late-contraction'
  if (spread !== null && spread < 0) return 'early-contraction'
  if (fedCutting) return 'early-expansion'
  if (spread !== null && spread > 0 && !unrateHigh) return 'late-expansion'
  return 'early-contraction'
}

interface Props {
  fredData: FredSeries[]
}

export function MacroSignalsCycleTab({ fredData }: Props) {
  const phase = computePhase(fredData)
  const current = phase ? CYCLE_PHASES[phase] : null

  return (
    <div className="space-y-3">
      <div
        className="rounded-md px-3 py-2 text-center"
        style={current
          ? { backgroundColor: current.bgColor, border: `1px solid ${current.borderColor}` }
          : { backgroundColor: '#ffffff08', border: '1px solid #ffffff15' }
        }
      >
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Current Phase</div>
        {current ? (
          <>
            <div className="text-base font-bold tracking-wide" style={{ color: current.color }}>{current.label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Favors: <span style={{ color: current.color }}>{current.assets.join(', ')}</span>
            </div>
          </>
        ) : (
          <div className="text-base font-bold tracking-wide text-muted-foreground">Calculating...</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {PHASE_ORDER.map((p) => {
          const cfg = CYCLE_PHASES[p]
          const isActive = p === phase
          return (
            <div
              key={p}
              className="rounded-sm px-2 py-1.5 transition-all"
              style={{
                backgroundColor: isActive ? cfg.bgColor : 'transparent',
                border: `1px solid ${isActive ? cfg.borderColor : '#ffffff10'}`,
                opacity: isActive ? 1 : 0.55,
              }}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                <div className="text-[10px] font-bold uppercase tracking-wider leading-tight" style={{ color: isActive ? cfg.color : undefined }}>
                  {cfg.label}
                </div>
                {isActive && (
                  <span
                    className="text-[7px] font-bold uppercase px-1 py-0.5 rounded-sm ml-auto leading-none"
                    style={{ backgroundColor: cfg.color + '25', color: cfg.color }}
                  >
                    NOW
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">{cfg.assets.join(' · ')}</div>
            </div>
          )
        })}
      </div>

      <div className="pt-1 border-t border-border/20">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Cycle Position</div>
        <div className="relative h-3 rounded-full bg-border/20 overflow-hidden">
          {PHASE_ORDER.map((p, i) => {
            const cfg = CYCLE_PHASES[p]
            return (
              <div
                key={p}
                className="absolute top-0 h-full"
                style={{
                  left: `${i * 25}%`,
                  width: '25%',
                  backgroundColor: cfg.color + '33',
                  borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                }}
              />
            )
          })}
          {phase && current && (
            <div
              className="absolute top-0 h-full w-1 rounded-full -translate-x-0.5 transition-all"
              style={{
                left: `${(PHASE_ORDER.indexOf(phase) * 25) + 12.5}%`,
                backgroundColor: current.color,
                boxShadow: `0 0 6px ${current.color}`,
              }}
            />
          )}
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
          <span>Early Exp.</span>
          <span>Late Exp.</span>
          <span>Early Con.</span>
          <span>Late Con.</span>
        </div>
      </div>
    </div>
  )
}
