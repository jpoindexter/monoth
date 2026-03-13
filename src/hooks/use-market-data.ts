import { useCallback } from 'react'
import { usePolling } from './use-polling'
import { fetchIndices } from '@/services/api'
import { useMarketStore } from '@/stores'

export function useMarketData(interval = 300_000) {
  const setIndices = useMarketStore((s) => s.setIndices)
  const fetcher = useCallback(async () => {
    const data = await fetchIndices()
    setIndices(data)
    return data
  }, [setIndices])

  return usePolling({ fetcher, interval })
}
