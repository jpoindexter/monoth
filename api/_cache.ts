import { createClient } from '@vercel/kv'

interface CacheEntry<T> {
  data: T
  expiry: number
}

// In-memory cache — always used as L1 (fast, per-instance)
const mem = new Map<string, CacheEntry<unknown>>()
const inFlight = new Map<string, Promise<unknown>>()

// KV client — used as L2 (shared across all Vercel instances) when configured
const kvUrl = process.env.KV_REST_API_URL
const kvToken = process.env.KV_REST_API_TOKEN
const kv = kvUrl && kvToken ? createClient({ url: kvUrl, token: kvToken }) : null

async function kvGet<T>(key: string): Promise<CacheEntry<T> | null> {
  if (!kv) return null
  try {
    return await kv.get<CacheEntry<T>>(key)
  } catch {
    return null
  }
}

async function kvSet<T>(key: string, entry: CacheEntry<T>, ttlMs: number): Promise<void> {
  if (!kv) return
  try {
    await kv.set(key, entry, { ex: Math.ceil(ttlMs / 1000) })
  } catch {}
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<{ data: T; stale: boolean }> {
  const now = Date.now()

  // L1: memory hit
  const memEntry = mem.get(key) as CacheEntry<T> | undefined
  if (memEntry && memEntry.expiry > now) {
    return { data: memEntry.data, stale: false }
  }

  // L2: KV hit
  const kvEntry = await kvGet<T>(key)
  if (kvEntry && kvEntry.expiry > now) {
    mem.set(key, kvEntry) // backfill L1
    return { data: kvEntry.data, stale: false }
  }

  // Deduplicate concurrent in-flight requests for the same key
  const existing = inFlight.get(key) as Promise<T> | undefined
  if (existing) {
    const data = await existing
    return { data, stale: false }
  }

  const promise = fetcher()
  inFlight.set(key, promise as Promise<unknown>)

  try {
    const data = await promise
    const entry: CacheEntry<T> = { data, expiry: now + ttlMs }
    mem.set(key, entry)
    kvSet(key, entry, ttlMs) // fire-and-forget — don't block response
    return { data, stale: false }
  } catch (err) {
    // Return stale data rather than error if we have anything
    if (memEntry) return { data: memEntry.data, stale: true }
    if (kvEntry) return { data: kvEntry.data, stale: true }
    throw err
  } finally {
    inFlight.delete(key)
  }
}
