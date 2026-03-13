import { useNewsStore } from '@/stores'
import { useNewsData } from '@/hooks/use-news-data'

function timeAgo(published: number): string {
  const diff = Math.floor((Date.now() - published) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export function NewsTicker() {
  useNewsData('markets')

  const items = useNewsStore((s) => s.items)
  const headlines = items.sort((a, b) => b.published - a.published).slice(0, 20)

  if (headlines.length === 0) return null

  const renderItems = [...headlines, ...headlines]

  return (
    <div className="h-5 border-t border-border/20 bg-background overflow-hidden shrink-0 relative group">
      <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="flex items-center h-full animate-marquee whitespace-nowrap">
        {renderItems.map((item, i) => (
          <span key={`${item.id}-${i}`} className="inline-flex items-center gap-1.5">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-medium text-foreground hover:text-foreground/80 transition-colors cursor-pointer"
            >
              {item.title}
            </a>
            <span className="text-[10px] text-muted-foreground">{timeAgo(item.published)}</span>
            <span className="text-[10px] text-muted-foreground/40 mx-2">|</span>
          </span>
        ))}
      </div>
    </div>
  )
}
