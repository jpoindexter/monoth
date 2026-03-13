interface CacheEntry<T> {
  data: T
  expiry: number
}

const cache = new Map<string, CacheEntry<unknown>>()

export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<{ data: T; stale: boolean }> {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (entry && entry.expiry > Date.now()) {
    return { data: entry.data, stale: false }
  }
  try {
    const data = await fetcher()
    cache.set(key, { data, expiry: Date.now() + ttlMs })
    return { data, stale: false }
  } catch (err) {
    if (entry) return { data: entry.data, stale: true }
    throw err
  }
}
