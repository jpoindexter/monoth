import { useState, useMemo } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

const CATEGORIES = [
  { key: 'SEC', keywords: ['sec ', 'securities', 'gensler', 'enforcement', 'filing', 'registration'], icon: 'S' },
  { key: 'Fed', keywords: ['fed ', 'federal reserve', 'fomc', 'powell', 'rate cut', 'rate hike', 'monetary policy'], icon: 'F' },
  { key: 'Tariffs', keywords: ['tariff', 'trade war', 'import duty', 'customs', 'export ban', 'trade deal'], icon: 'T' },
  { key: 'Crypto', keywords: ['crypto reg', 'stablecoin', 'defi regulation', 'bitcoin etf', 'digital asset', 'cbdc'], icon: 'C' },
  { key: 'Antitrust', keywords: ['antitrust', 'monopoly', 'merger block', 'ftc', 'doj', 'competition'], icon: 'A' },
  { key: 'Banking', keywords: ['basel', 'capital requirement', 'stress test', 'fdic', 'bank regulation', 'dodd-frank'], icon: 'B' },
] as const

function categorizeNews(headlines: { title: string; published: number; id: string }[]) {
  const counts: Record<string, number> = {}
  const now = Date.now()

  for (const cat of CATEGORIES) counts[cat.key] = 0

  for (const h of headlines) {
    const lower = h.title.toLowerCase()
    for (const cat of CATEGORIES) {
      if (cat.keywords.some((kw) => lower.includes(kw))) {
        const ageHours = (now - h.published) / 3_600_000
        counts[cat.key] += ageHours < 6 ? 2 : 1
      }
    }
  }

  return CATEGORIES.map((cat) => ({
    ...cat,
    activity: Math.min(counts[cat.key], 10),
  })).sort((a, b) => b.activity - a.activity)
}

function ActivityDot({ level }: { level: number }) {
  const color = level >= 7 ? 'bg-red-500' : level >= 4 ? 'bg-amber-500' : level >= 2 ? 'bg-yellow-500' : 'bg-zinc-300 dark:bg-zinc-600'
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />
}

export default function RegulationPanel() {
  const [tab, setTab] = useState<'tracker' | 'news'>('tracker')
  const [filter, setFilter] = useState<string>('All')
  const { data, loading, error, refresh } = useNewsData('regulation')

  const categories = useMemo(() => data ? categorizeNews(data) : [], [data])

  const filtered = useMemo(() => {
    if (!data) return []
    if (filter === 'All') return data
    const cat = CATEGORIES.find((c) => c.key === filter)
    if (!cat) return data
    return data.filter((item) =>
      cat.keywords.some((kw) => item.title.toLowerCase().includes(kw))
    )
  }, [data, filter])

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Regulation" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'tracker')} onClick={() => setTab('tracker')}>Tracker</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'tracker' && (
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setFilter(cat.key); setTab('news') }}
              className="w-full flex items-center gap-2 py-1.5 px-1.5 rounded-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
            >
              <div className="w-5 h-5 rounded-sm bg-foreground/5 flex items-center justify-center text-[9px] font-bold text-foreground/60">
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-foreground">{cat.key}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-px">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={`w-1 h-3 rounded-sm ${
                        i < cat.activity / 2
                          ? cat.activity >= 7 ? 'bg-red-500' : cat.activity >= 4 ? 'bg-amber-500' : 'bg-emerald-500'
                          : 'bg-border/30'
                      }`}
                    />
                  ))}
                </div>
                <ActivityDot level={cat.activity} />
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === 'news' && (
        <>
          <div className="flex gap-1 mb-1.5 flex-wrap">
            {['All', ...CATEGORIES.map((c) => c.key)].map((f) => (
              <button key={f} className={tabCls(filter === f)} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
          <div className="space-y-0">
            {filtered.map((item) => {
              const cls = classifyHeadline(item.title)
              return (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-1 px-1 rounded-sm transition-colors">
                  <div className="flex-1 min-w-0">
                    {cls && (
                      <span className="inline-block text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                        style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}>
                        {CATEGORY_LABELS[cls.category]}
                      </span>
                    )}
                    <span className="text-[11px] font-medium leading-snug text-foreground line-clamp-2">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">{relTime(item.published)}</span>
                </a>
              )
            })}
          </div>
        </>
      )}
    </PanelWrapper>
  )
}
