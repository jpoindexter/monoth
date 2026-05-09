interface CacheEntry<T> {
  data: T
  expiry: number
}

const MAX_CACHE_SIZE = 500

const cache = new Map<string, CacheEntry<unknown>>()
const inFlight = new Map<string, Promise<unknown>>()

export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<{ data: T; stale: boolean }> {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (entry && entry.expiry > Date.now()) {
    return { data: entry.data, stale: false }
  }

  // Deduplicate concurrent requests for the same key
  const existing = inFlight.get(key) as Promise<T> | undefined
  if (existing) {
    const data = await existing
    return { data, stale: false }
  }

  const promise = fetcher()
  inFlight.set(key, promise as Promise<unknown>)

  try {
    const data = await promise
    if (cache.size >= MAX_CACHE_SIZE) {
      const oldest = cache.keys().next().value
      if (oldest !== undefined) cache.delete(oldest)
    }
    cache.set(key, { data, expiry: Date.now() + ttlMs })
    return { data, stale: false }
  } catch (err) {
    if (entry) return { data: entry.data, stale: true }
    throw err
  } finally {
    inFlight.delete(key)
  }
}
