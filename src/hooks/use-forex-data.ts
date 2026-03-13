import { useCallback } from 'react'
import { usePolling } from './use-polling'
import { fetchForexRates } from '@/services/api'
import { useMarketStore } from '@/stores'

export function useForexData(interval = 300_000) {
  const setForex = useMarketStore((s) => s.setForex)
  const fetcher = useCallback(async () => {
    const data = await fetchForexRates()
    setForex(data)
    return data
  }, [setForex])

  return usePolling({ fetcher, interval })
}
