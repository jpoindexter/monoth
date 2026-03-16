type ImpactLevel = 'HIGH' | 'MED' | 'LOW'

interface RegEvent {
  id: string
  title: string
  agency: string
  date: Date
  impact: ImpactLevel
  description: string
}

const TIMELINE_EVENTS: RegEvent[] = ([
  { id: '1', title: 'SEC Climate Disclosure Rules Effective', agency: 'SEC', date: new Date('2026-03-28'), impact: 'HIGH', description: 'Public companies required to disclose material climate-related risks in annual filings.' },
  { id: '2', title: 'Basel III Endgame Comment Period Closes', agency: 'Fed/OCC/FDIC', date: new Date('2026-04-15'), impact: 'HIGH', description: 'Final comment period on revised capital requirements for large U.S. banks.' },
  { id: '3', title: 'CFPB Open Banking Rule Takes Effect', agency: 'CFPB', date: new Date('2026-04-30'), impact: 'MED', description: 'Banks must allow customers to share financial data with third-party apps via secure APIs.' },
  { id: '4', title: 'EU MiCA Phase 2 Implementation', agency: 'ESMA', date: new Date('2026-05-20'), impact: 'HIGH', description: 'Full Markets in Crypto-Assets regulation applies to all crypto-asset service providers in EU.' },
  { id: '5', title: 'Fed Rate Decision (FOMC)', agency: 'Federal Reserve', date: new Date('2026-06-11'), impact: 'HIGH', description: 'FOMC meeting rate decision and updated economic projections (dot plot).' },
  { id: '6', title: 'SEC Crypto Custody Rule Final', agency: 'SEC', date: new Date('2026-06-30'), impact: 'HIGH', description: 'Investment advisers must use qualified custodians for all crypto assets under management.' },
  { id: '7', title: 'FDIC Annual Stress Test Results', agency: 'FDIC', date: new Date('2026-07-15'), impact: 'MED', description: 'Stress test results for banks with $100B+ in assets released publicly.' },
  { id: '8', title: 'G20 Crypto Regulatory Framework', agency: 'G20/FSB', date: new Date('2026-08-05'), impact: 'MED', description: 'G20 member states report on progress implementing FSB cross-border crypto standards.' },
  { id: '9', title: 'EU AI Act Financial Services Provisions', agency: 'EU Commission', date: new Date('2026-09-01'), impact: 'MED', description: 'AI Act provisions covering high-risk AI systems in credit scoring and trading go live.' },
  { id: '10', title: 'CFTC Digital Asset Derivatives Rule', agency: 'CFTC', date: new Date('2026-10-01'), impact: 'LOW', description: 'New reporting and margin requirements for digital asset derivatives on U.S. platforms.' },
] as RegEvent[]).sort((a, b) => a.date.getTime() - b.date.getTime())

function daysUntil(date: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86_400_000)
}

function ImpactBadge({ level }: { level: ImpactLevel }) {
  const cls =
    level === 'HIGH' ? 'bg-red-500/20 text-red-500 border border-red-500/30'
    : level === 'MED' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
    : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
  return <span className={`text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm ${cls}`}>{level}</span>
}

interface Props {
  expanded: boolean
}

export function RegulationTimeline({ expanded }: Props) {
  return (
    <div className="space-y-1.5">
      {(expanded ? TIMELINE_EVENTS : TIMELINE_EVENTS.slice(0, 5)).map((ev) => {
        const days = daysUntil(ev.date)
        const isPast = days < 0
        const isUrgent = days >= 0 && days <= 14
        return (
          <div key={ev.id} className="border border-border/30 rounded-sm px-2 py-1.5">
            <div className="flex items-start justify-between gap-1 mb-0.5">
              <span className={`font-semibold text-foreground leading-tight flex-1 min-w-0 pr-1 ${expanded ? 'text-[12px]' : 'text-[10px]'}`}>
                {ev.title}
              </span>
              <ImpactBadge level={ev.impact} />
            </div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] text-muted-foreground">
                {ev.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-[9px] px-1 py-px rounded-sm bg-foreground/5 text-muted-foreground font-medium">{ev.agency}</span>
              <span className={`text-[10px] font-bold ml-auto ${isPast ? 'text-zinc-400 dark:text-zinc-600' : isUrgent ? 'text-red-500' : 'text-foreground/70'}`}>
                {isPast ? `${Math.abs(days)}d ago` : days === 0 ? 'TODAY' : `${days}d`}
              </span>
            </div>
            <p className={`text-muted-foreground leading-snug ${expanded ? 'text-[11px]' : 'text-[10px] line-clamp-2'}`}>{ev.description}</p>
          </div>
        )
      })}
    </div>
  )
}
