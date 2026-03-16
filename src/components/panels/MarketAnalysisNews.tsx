import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime } from '@/lib/panel-utils'

interface NewsItem {
  id: string
  title: string
  url: string
  published: number
}

interface Props {
  newsData: NewsItem[] | null
  expanded: boolean
}

export function MarketAnalysisNews({ newsData, expanded }: Props) {
  return (
    <div className="space-y-0">
      {(expanded ? newsData : newsData?.slice(0, 8))?.map((item) => {
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
  )
}
