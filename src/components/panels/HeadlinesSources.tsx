import type { NewsItem } from '@/types/news'

function extractFullDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return '?'
  }
}

export function HeadlinesSources({ data }: { data: NewsItem[] }) {
  if (!data.length) {
    return <p className="text-[10px] text-muted-foreground">No data</p>
  }

  const counts = new Map<string, number>()
  for (const item of data) {
    const domain = extractFullDomain(item.url)
    counts.set(domain, (counts.get(domain) ?? 0) + 1)
  }
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  const max = sorted[0]?.[1] ?? 1
  const total = data.length
  const entropy = sorted.reduce((acc, [, cnt]) => {
    const p = cnt / total
    return acc - p * Math.log2(p)
  }, 0)
  const maxEntropy = Math.log2(sorted.length || 1)
  const diversity = maxEntropy === 0 ? 0 : Math.round((entropy / maxEntropy) * 100)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border border-border/30 rounded-sm px-2 py-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Source Diversity Score</span>
        <span className="text-[10px] font-bold text-foreground">
          {diversity}<span className="text-[9px] text-muted-foreground font-normal ml-0.5">/100</span>
        </span>
      </div>

      <div className="space-y-1.5">
        {sorted.map(([domain, count]) => (
          <div key={domain}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-foreground font-medium truncate max-w-[70%]">{domain}</span>
              <span className="text-[10px] text-muted-foreground">{count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-700/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500/60"
                style={{ width: `${Math.round((count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
