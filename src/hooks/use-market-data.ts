import { useCallback } from 'react'
import { usePolling } from './use-polling'
import { fetchIndices } from '@/services/api'
import { useMarketStore } from '@/stores'
import { useUserStore } from '@/stores/user-store'

export function useMarketData(customInterval?: number) {
  const tier = useUserStore((s) => s.tier)
  const interval = customInterval ?? (tier === 'pro' ? 30_000 : 300_000)
  const setIndices = useMarketStore((s) => s.setIndices)
  const fetcher = useCallback(async () => {
    const data = await fetchIndices()
    setIndices(data)
    return data
  }, [setIndices])

  return usePolling({ fetcher, interval })
}
