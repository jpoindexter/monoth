import { useCallback } from 'react'
import { usePolling } from './use-polling'
import { fetchSectors } from '@/services/api'
import { useMarketStore } from '@/stores'

export function useSectorData() {
  const setSectorData = useMarketStore((s) => s.setSectorData)
  const fetcher = useCallback(async () => {
    const data = await fetchSectors()
    setSectorData(data)
    return data
  }, [setSectorData])

  return usePolling({ fetcher, interval: 60_000 })
}
