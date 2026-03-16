import { useMemo } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { tabCls } from '@/lib/panel-utils'
import { useState } from 'react'
import { HeadlinesFeed } from '@/components/panels/HeadlinesFeed'
import { HeadlinesSentiment } from '@/components/panels/HeadlinesSentiment'
import { HeadlinesSources } from '@/components/panels/HeadlinesSources'

function extractDomain(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return host.split('.')[0] ?? '?'
  } catch {
    return '?'
  }
}

const SOURCE_COLORS = [
  'bg-blue-500/20 text-blue-400',
  'bg-purple-500/20 text-purple-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-orange-500/20 text-orange-400',
  'bg-pink-500/20 text-pink-400',
  'bg-cyan-500/20 text-cyan-400',
  'bg-yellow-500/20 text-yellow-400',
]

type MainTab = 'feed' | 'sentiment' | 'sources'

export default function HeadlinesPanel() {
  useIsExpanded()
  const [tab, setTab] = useState<MainTab>('feed')
  const { data, loading, error, refresh } = useNewsData('markets')

  const sourceColorMap = useMemo(() => {
    const map = new Map<string, string>()
    let i = 0
    data?.forEach((item) => {
      const domain = extractDomain(item.url)
      if (!map.has(domain)) {
        map.set(domain, SOURCE_COLORS[i % SOURCE_COLORS.length] ?? SOURCE_COLORS[0] ?? '')
        i++
      }
    })
    return map
  }, [data])

  const uniqueSources = sourceColorMap.size
  const breakingCount = useMemo(
    () => data?.filter((item) => Date.now() - item.published < 1_800_000).length ?? 0,
    [data]
  )

  return (
    <PanelWrapper title="Headlines" loading={loading} error={error} onRetry={refresh}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          <button className={tabCls(tab === 'feed')} onClick={() => setTab('feed')}>Feed</button>
          <button className={tabCls(tab === 'sentiment')} onClick={() => setTab('sentiment')}>Sentiment</button>
          <button className={tabCls(tab === 'sources')} onClick={() => setTab('sources')}>Sources</button>
        </div>
        <div className="flex items-center gap-2">
          {uniqueSources > 0 && (
            <span className="text-[9px] text-muted-foreground/60">
              {uniqueSources} feed{uniqueSources !== 1 ? 's' : ''}
            </span>
          )}
          {breakingCount > 0 && (
            <span className="text-[9px] font-bold text-red-500 animate-pulse">{breakingCount} NEW</span>
          )}
        </div>
      </div>

      {tab === 'feed' && <HeadlinesFeed data={data ?? []} sourceColorMap={sourceColorMap} />}
      {tab === 'sentiment' && <HeadlinesSentiment data={data ?? []} />}
      {tab === 'sources' && <HeadlinesSources data={data ?? []} />}
    </PanelWrapper>
  )
}
