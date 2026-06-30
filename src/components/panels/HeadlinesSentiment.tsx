import { useIsExpanded } from '@/components/layout/PanelWrapper'
import type { NewsItem } from '@/types/news'

const POS_KEYWORDS = ['rally', 'surge', 'gain', 'rise', 'beat', 'upgrade', 'bullish', 'record high', 'growth', 'soar']
const NEG_KEYWORDS = ['crash', 'drop', 'fall', 'decline', 'miss', 'downgrade', 'bearish', 'recession', 'crisis', 'warning']

function scoreSentiment(title: string): number {
  const lower = title.toLowerCase()
  let score = 0
  for (const k of POS_KEYWORDS) if (lower.includes(k)) score++
  for (const k of NEG_KEYWORDS) if (lower.includes(k)) score--
  return score
}

function sentimentLabel(gauge: number): { label: string; color: string } {
  if (gauge < 35) return { label: 'FEAR', color: 'text-red-400' }
  if (gauge < 55) return { label: 'NEUTRAL', color: 'text-yellow-400' }
  return { label: 'GREED', color: 'text-emerald-400' }
}

function gaugeColor(pct: number): string {
  if (pct < 35) return 'bg-red-500'
  if (pct < 55) return 'bg-yellow-500'
  return 'bg-emerald-500'
}

export function HeadlinesSentiment({ data }: { data: NewsItem[] }) {
  const expanded = useIsExpanded()

  if (!data.length) {
    return <p className="text-[10px] text-muted-foreground">No data</p>
  }

  const scored = data.map((item) => ({ item, score: scoreSentiment(item.title) }))
  const pos = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 3)
  const neg = scored.filter((s) => s.score < 0).sort((a, b) => a.score - b.score).slice(0, 3)
  const totalPos = scored.reduce((acc, s) => acc + Math.max(0, s.score), 0)
  const totalNeg = scored.reduce((acc, s) => acc + Math.max(0, -s.score), 0)
  const total = totalPos + totalNeg
  const gauge = total === 0 ? 50 : Math.round((totalPos / total) * 100)
  // Relative-time display count; reading current time at render is intentional here.
  // eslint-disable-next-line react-hooks/purity
  const lastHourCount = data.filter((item) => Date.now() - item.published < 3_600_000).length
  const sl = sentimentLabel(gauge)

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Sentiment Gauge</span>
          <span className={`text-[10px] font-bold tracking-wider ${sl.color}`}>{sl.label}</span>
        </div>
        <div className="relative h-3 rounded-full bg-zinc-700/40 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${gaugeColor(gauge)}`} style={{ width: `${gauge}%` }} />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-red-400">0 Fear</span>
          <span className="text-[9px] text-muted-foreground/60">{gauge}</span>
          <span className="text-[9px] text-emerald-400">100 Greed</span>
        </div>
      </div>

      <div className="flex items-center justify-between border border-border/30 rounded-sm px-2 py-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Headline Velocity</span>
        <span className="text-[10px] font-bold text-foreground">
          {lastHourCount}<span className="text-[9px] text-muted-foreground font-normal ml-0.5">/hr</span>
        </span>
      </div>

      {pos.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-1">Most Positive</div>
          <div className="space-y-1">
            {pos.map(({ item }) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1.5 hover:bg-zinc-800/50 -mx-1 px-1 py-0.5 rounded-sm transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                <span className={`text-[10px] text-foreground leading-snug ${expanded ? '' : 'line-clamp-2'}`}>{item.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {neg.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-red-400 font-bold mb-1">Most Negative</div>
          <div className="space-y-1">
            {neg.map(({ item }) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1.5 hover:bg-zinc-800/50 -mx-1 px-1 py-0.5 rounded-sm transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                <span className={`text-[10px] text-foreground leading-snug ${expanded ? '' : 'line-clamp-2'}`}>{item.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
