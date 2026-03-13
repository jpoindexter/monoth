import { useNewsStore } from '@/stores'
import { useNewsData } from '@/hooks/use-news-data'

export function NewsTicker() {
  useNewsData('markets')

  const items = useNewsStore((s) => s.items)
  const headlines = items
    .sort((a, b) => b.published - a.published)
    .slice(0, 20)

  if (headlines.length === 0) return null

  const text = headlines.map((h) => h.title).join('  \u2022  ')

  return (
    <div className="h-5 border-b border-border/40 bg-white dark:bg-[#0a0a0a] overflow-hidden shrink-0 relative">
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white dark:from-[#0a0a0a] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white dark:from-[#0a0a0a] to-transparent z-10" />
      <div className="flex items-center h-full animate-marquee whitespace-nowrap">
        <span className="text-[9px] text-muted-foreground">
          {text}  &bull;  {text}
        </span>
      </div>
    </div>
  )
}
