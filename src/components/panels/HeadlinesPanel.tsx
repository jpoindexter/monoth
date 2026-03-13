import { useState } from 'react'
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

const SOURCES = ['All', 'Bloomberg', 'Reuters', 'CNBC'] as const

export default function HeadlinesPanel() {
  const [source, setSource] = useState<string>('All')
  const { data, loading, error, refresh } = useNewsData('markets')

  const filtered = source === 'All'
    ? data
    : data?.filter((item) => item.source.toLowerCase().includes(source.toLowerCase()))

  const pillCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Headlines" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        {SOURCES.map((s) => (
          <button key={s} className={pillCls(source === s)} onClick={() => setSource(s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="space-y-0">
        {filtered?.map((item) => {
          const cls = classifyHeadline(item.title)
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-1 px-1 rounded-sm transition-colors"
            >
              <div className="flex-1 min-w-0">
                {Date.now() - item.published < 1800_000 && (
                  <span className="inline-block text-[7px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle bg-red-600 text-white animate-pulse">
                    New
                  </span>
                )}
                {cls && (
                  <span
                    className="inline-block text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                    style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}
                  >
                    {CATEGORY_LABELS[cls.category]}
                  </span>
                )}
                <span className="text-[11px] font-medium leading-snug text-foreground line-clamp-2">
                  {item.title}
                </span>
              </div>
              <div className="text-right shrink-0 ml-1">
                <span className="text-[10px] text-muted-foreground whitespace-nowrap block">
                  {relTime(item.published)}
                </span>
                {item.source && (
                  <span className="text-[8px] text-muted-foreground/60 whitespace-nowrap block">
                    {item.source}
                  </span>
                )}
              </div>
            </a>
          )
        })}
      </div>
    </PanelWrapper>
  )
}
