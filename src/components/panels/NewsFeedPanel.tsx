import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

function getRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diffMs = now - timestamp
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 4) return `${diffWeeks}w ago`

  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}mo ago`
}

export interface NewsFeedPanelProps {
  category: string
  title: string
}

export function NewsFeedPanel({ category, title }: NewsFeedPanelProps) {
  const { data, loading, error, refresh } = useNewsData(category)

  return (
    <PanelWrapper title={title} loading={loading} error={error} onRetry={refresh}>
      <ScrollArea className="h-full w-full">
        <div className="space-y-3 pr-4">
          {data?.map((item) => (
            <div key={item.id} className="border-b pb-3 last:border-0">
              <div className="flex gap-2 items-start mb-1">
                <Badge variant="secondary" className="text-xs shrink-0">{item.source}</Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {getRelativeTime(item.published)}
                </span>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium leading-snug hover:underline text-foreground line-clamp-2"
              >
                {item.title}
              </a>
            </div>
          ))}
        </div>
      </ScrollArea>
    </PanelWrapper>
  )
}
