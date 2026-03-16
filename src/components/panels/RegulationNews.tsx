import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime, tabCls } from '@/lib/panel-utils'

const CATEGORIES = [
  { key: 'SEC', keywords: ['sec ', 'securities', 'gensler', 'enforcement', 'filing', 'registration'] },
  { key: 'Fed', keywords: ['fed ', 'federal reserve', 'fomc', 'powell', 'rate cut', 'rate hike', 'monetary policy'] },
  { key: 'Tariffs', keywords: ['tariff', 'trade war', 'import duty', 'customs', 'export ban', 'trade deal'] },
  { key: 'Crypto', keywords: ['crypto reg', 'stablecoin', 'defi regulation', 'bitcoin etf', 'digital asset', 'cbdc'] },
  { key: 'Antitrust', keywords: ['antitrust', 'monopoly', 'merger block', 'ftc', 'doj', 'competition'] },
  { key: 'Banking', keywords: ['basel', 'capital requirement', 'stress test', 'fdic', 'bank regulation', 'dodd-frank'] },
] as const

interface NewsItem {
  id: string
  title: string
  url: string
  published: number
}

interface Props {
  filtered: NewsItem[]
  filter: string
  expanded: boolean
  onFilterChange: (f: string) => void
}

export function RegulationNews({ filtered, filter, expanded, onFilterChange }: Props) {
  return (
    <>
      <div className="flex gap-1 mb-1.5 flex-wrap">
        {['All', ...CATEGORIES.map((c) => c.key)].map((f) => (
          <button key={f} className={tabCls(filter === f)} onClick={() => onFilterChange(f)}>{f}</button>
        ))}
      </div>
      <div className="space-y-0">
        {(expanded ? filtered : filtered.slice(0, 8)).map((item) => {
          const cls = classifyHeadline(item.title)
          return (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-muted/30 -mx-1 px-1 rounded-sm transition-colors">
              <div className="flex-1 min-w-0">
                {cls && (
                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                    style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}>
                    {CATEGORY_LABELS[cls.category]}
                  </span>
                )}
                <span className={`font-medium leading-snug text-foreground ${expanded ? 'text-[13px]' : 'text-[11px] line-clamp-2'}`}>{item.title}</span>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">{relTime(item.published)}</span>
            </a>
          )
        })}
      </div>
    </>
  )
}
