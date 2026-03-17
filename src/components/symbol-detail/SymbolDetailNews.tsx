import { relTime } from '@/lib/panel-utils'

interface NewsItem {
  title: string
  url: string
  source: string
  published: number
}

interface Props {
  ticker: string
  relatedNews: NewsItem[]
}

export function SymbolDetailNews({ ticker, relatedNews }: Props) {
  if (relatedNews.length === 0) {
    return (
      <div className="px-5 py-4 text-[10px] text-muted-foreground text-center py-8">
        No related news found for {ticker}
      </div>
    )
  }

  return (
    <div className="px-5 py-4 space-y-3">
      {relatedNews.map((item, i) => (
        <a
          key={i}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block border border-border/20 rounded-sm p-3 hover:border-border/50 hover:bg-white/[0.02] transition-colors"
        >
          <div className="text-[11px] font-medium text-foreground leading-snug mb-1.5">{item.title}</div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{item.source}</span>
            <span>·</span>
            <span>{relTime(item.published)}</span>
          </div>
        </a>
      ))}
    </div>
  )
}
