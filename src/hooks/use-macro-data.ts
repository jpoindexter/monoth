import { useCallback } from 'react'
import { usePolling } from './use-polling'
import { fetchFredData } from '@/services/api'

export function useMacroData(interval = 300_000) {
  const fetcher = useCallback(async () => {
    return fetchFredData()
  }, [])

  return usePolling({ fetcher, interval })
}
