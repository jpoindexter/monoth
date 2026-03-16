import { useState, useEffect } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { tabCls } from '@/lib/panel-utils'
import type { Stablecoin } from '@/components/panels/stablecoins-data'
import { StablecoinsDataTab } from '@/components/panels/StablecoinsDataTab'
import { StablecoinsPegTab } from '@/components/panels/StablecoinsPegTab'
import { StablecoinsDominanceTab } from '@/components/panels/StablecoinsDominanceTab'
import { StablecoinsReservesTab } from '@/components/panels/StablecoinsReservesTab'
import { StablecoinsYieldTab } from '@/components/panels/StablecoinsYieldTab'
import { StablecoinsNewsTab } from '@/components/panels/StablecoinsNewsTab'

type Tab = 'data' | 'peg' | 'dominance' | 'reserves' | 'yield' | 'news'

export default function StablecoinsPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('data')

  const { data, loading, error, refresh } = usePolling<Stablecoin[]>({
    fetcher: async () => {
      const res = await fetch('/api/crypto/stablecoins')
      if (!res.ok) throw new Error('Failed to fetch stablecoins')
      return res.json()
    },
    interval: 300_000,
    enabled: tab !== 'reserves' && tab !== 'yield' && tab !== 'news',
  })

  const { data: newsData } = useNewsData('stablecoins')

  useEffect(() => {
    if (!loading && data != null && !data.length && tab === 'data') {
      setTab('news')
    }
  }, [loading, data, tab])

  return (
    <PanelWrapper title="Stablecoins" loading={loading} error={error} onRetry={refresh}>
      <div className="flex flex-wrap gap-1 mb-2">
        <button className={tabCls(tab === 'data')} onClick={() => setTab('data')}>Data</button>
        <button className={tabCls(tab === 'peg')} onClick={() => setTab('peg')}>Peg</button>
        <button className={tabCls(tab === 'dominance')} onClick={() => setTab('dominance')}>Dominance</button>
        <button className={tabCls(tab === 'reserves')} onClick={() => setTab('reserves')}>Reserves</button>
        <button className={tabCls(tab === 'yield')} onClick={() => setTab('yield')}>Yield</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'data' && <StablecoinsDataTab data={data ?? []} expanded={expanded} />}
      {tab === 'peg' && <StablecoinsPegTab data={data ?? []} expanded={expanded} />}
      {tab === 'dominance' && <StablecoinsDominanceTab data={data ?? []} expanded={expanded} />}
      {tab === 'reserves' && <StablecoinsReservesTab />}
      {tab === 'yield' && <StablecoinsYieldTab />}
      {tab === 'news' && <StablecoinsNewsTab data={newsData ?? []} expanded={expanded} />}
    </PanelWrapper>
  )
}
