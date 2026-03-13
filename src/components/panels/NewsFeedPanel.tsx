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

export interface NewsFeedPanelProps {
  category: string
  title: string
}

export function NewsFeedPanel({ category, title }: NewsFeedPanelProps) {
  const { data, loading, error, refresh } = useNewsData(category)

  return (
    <PanelWrapper title={title} loading={loading} error={error} onRetry={refresh}>
      <div className="space-y-0">
        {data?.map((item) => {
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
              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                {relTime(item.published)}
              </span>
            </a>
          )
        })}
      </div>
    </PanelWrapper>
  )
}
