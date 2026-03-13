import { useCallback } from 'react'
import { usePolling } from './use-polling'
import { fetchForexRates } from '@/services/api'
import { useMarketStore } from '@/stores'
import { useUserStore } from '@/stores/user-store'

export function useForexData(customInterval?: number) {
  const tier = useUserStore((s) => s.tier)
  const interval = customInterval ?? (tier === 'pro' ? 30_000 : 300_000)
  const setForex = useMarketStore((s) => s.setForex)
  const fetcher = useCallback(async () => {
    const data = await fetchForexRates()
    setForex(data)
    return data
  }, [setForex])

  return usePolling({ fetcher, interval })
}
