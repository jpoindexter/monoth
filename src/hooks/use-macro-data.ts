import { useCallback } from 'react'
import { usePolling } from './use-polling'
import { fetchFredData } from '@/services/api'
import { useUserStore } from '@/stores/user-store'

export function useMacroData(customInterval?: number) {
  const tier = useUserStore((s) => s.tier)
  const interval = customInterval ?? (tier === 'pro' ? 30_000 : 300_000)
  const fetcher = useCallback(async () => {
    return fetchFredData()
  }, [])

  return usePolling({ fetcher, interval })
}
