import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

function getRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return `${Math.floor(diffDays / 7)}w ago`
}

export default function CentralBanksPanel() {
  const { data, loading, error, refresh } = useNewsData('central-banks')

  return (
    <PanelWrapper title="Central Bank Watch" loading={loading} error={error} onRetry={refresh}>
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
