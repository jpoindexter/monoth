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

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const failuresRef = useRef(0)
  const fetcherRef = useRef(fetcher)
  const intervalRef = useRef(interval)
  // activeRef: true only when the hook is enabled AND mounted — guards both in-flight fetches and next-poll scheduling
  const activeRef = useRef(false)

  // Indirection so doFetch can re-schedule itself without referencing its own
  // binding before declaration (keeps the React Compiler happy). The ref always
  // points at the latest (stable) doFetch.
  const doFetchRef = useRef<() => void>(() => {})

  const doFetch = useCallback(async () => {
    if (!activeRef.current) return
    try {
      setError(null)
      const result = await fetcherRef.current()
      if (!activeRef.current) return
      setData(result)
      setLoading(false)
      failuresRef.current = 0
      timerRef.current = setTimeout(() => doFetchRef.current(), intervalRef.current)
    } catch (err) {
      if (!activeRef.current) return
      failuresRef.current++
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
      // Exponential backoff: 5s → 10s → 20s → 30s max
      const backoff = Math.min(5_000 * Math.pow(2, failuresRef.current - 1), 30_000)
      timerRef.current = setTimeout(() => doFetchRef.current(), backoff)
    }
  }, []) // stable — reads everything via refs

  // Keep the "latest value" refs current. Done in an effect (not during render)
  // so render stays pure; they're only read later inside the async doFetch.
  useEffect(() => {
    fetcherRef.current = fetcher
    intervalRef.current = interval
    doFetchRef.current = doFetch
  })

  const refresh = useCallback(() => {
    if (!activeRef.current) return
    clearTimeout(timerRef.current)
    failuresRef.current = 0
    doFetch()
  }, [doFetch])

  useEffect(() => {
    if (!enabled) {
      activeRef.current = false
      clearTimeout(timerRef.current)
      return
    }
    activeRef.current = true
    failuresRef.current = 0
    // Random jitter 0–2s so 33 panels don't all fire simultaneously on mount
    const jitter = Math.random() * 2_000
    timerRef.current = setTimeout(doFetch, jitter)
    return () => {
      activeRef.current = false
      clearTimeout(timerRef.current)
    }
  }, [enabled, doFetch])

  useEffect(() => {
    if (!enabled) return
    const handler = () => refresh()
    window.addEventListener('monoth:refresh-all', handler)
    return () => window.removeEventListener('monoth:refresh-all', handler)
  }, [refresh, enabled])

  return { data, loading, error, refresh }
}
