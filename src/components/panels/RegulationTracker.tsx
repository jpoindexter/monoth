const CATEGORIES = [
  { key: 'SEC', keywords: ['sec ', 'securities', 'gensler', 'enforcement', 'filing', 'registration'], icon: 'S' },
  { key: 'Fed', keywords: ['fed ', 'federal reserve', 'fomc', 'powell', 'rate cut', 'rate hike', 'monetary policy'], icon: 'F' },
  { key: 'Tariffs', keywords: ['tariff', 'trade war', 'import duty', 'customs', 'export ban', 'trade deal'], icon: 'T' },
  { key: 'Crypto', keywords: ['crypto reg', 'stablecoin', 'defi regulation', 'bitcoin etf', 'digital asset', 'cbdc'], icon: 'C' },
  { key: 'Antitrust', keywords: ['antitrust', 'monopoly', 'merger block', 'ftc', 'doj', 'competition'], icon: 'A' },
  { key: 'Banking', keywords: ['basel', 'capital requirement', 'stress test', 'fdic', 'bank regulation', 'dodd-frank'], icon: 'B' },
] as const

function ActivityDot({ level }: { level: number }) {
  const color = level >= 7 ? 'bg-red-500' : level >= 4 ? 'bg-amber-500' : level >= 2 ? 'bg-yellow-500' : 'bg-zinc-300 dark:bg-zinc-600'
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />
}

interface CategoryEntry {
  key: string
  icon: string
  activity: number
}

interface Props {
  categories: CategoryEntry[]
  onCategoryClick: (key: string) => void
}

export function RegulationTracker({ categories, onCategoryClick }: Props) {
  return (
    <div className="space-y-1">
      {categories.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onCategoryClick(cat.key)}
          className="w-full flex items-center gap-2 py-1.5 px-1.5 rounded-sm hover:bg-muted/30 transition-colors text-left"
        >
          <div className="w-5 h-5 rounded-sm bg-foreground/5 flex items-center justify-center text-[10px] font-bold text-foreground/60">
            {cat.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-foreground">{cat.key}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-px">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={`w-1 h-3 rounded-sm ${
                  i < cat.activity / 2
                    ? cat.activity >= 7 ? 'bg-red-500' : cat.activity >= 4 ? 'bg-amber-500' : 'bg-emerald-500'
                    : 'bg-border/30'
                }`} />
              ))}
            </div>
            <ActivityDot level={cat.activity} />
          </div>
        </button>
      ))}
    </div>
  )
}
