import { useState, useEffect, useCallback, useRef } from 'react'

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>
  interval: number
  enabled?: boolean
}

export function usePolling<T>({ fetcher, interval, enabled = true }: UsePollingOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    if (!enabled) return
    refresh()
    timerRef.current = setInterval(refresh, interval)
    return () => clearInterval(timerRef.current)
  }, [refresh, interval, enabled])

  return { data, loading, error, refresh }
}
