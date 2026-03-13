import { useCallback } from 'react'
import { usePolling } from './use-polling'
import { fetchNews } from '@/services/api'
import { useNewsStore } from '@/stores'

export function useNewsData(category: string, interval = 300_000) {
  const addItems = useNewsStore((s) => s.addItems)
  const fetcher = useCallback(async () => {
    const data = await fetchNews(category)
    addItems(data)
    return data
  }, [category, addItems])

  return usePolling({ fetcher, interval })
}
