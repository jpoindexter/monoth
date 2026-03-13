import { useCallback } from 'react'
import { usePolling } from './use-polling'
import { fetchNews } from '@/services/api'
import { useNewsStore } from '@/stores'
import { useUserStore } from '@/stores/user-store'
import { useRegionStore } from '@/stores/region-store'

export function useNewsData(category: string, customInterval?: number) {
  const tier = useUserStore((s) => s.tier)
  const region = useRegionStore((s) => s.region)
  const interval = customInterval ?? (tier === 'pro' ? 30_000 : 300_000)
  const addItems = useNewsStore((s) => s.addItems)
  const fetcher = useCallback(async () => {
    const data = await fetchNews(category, region)
    addItems(data)
    return data
  }, [category, region, addItems])

  return usePolling({ fetcher, interval })
}
