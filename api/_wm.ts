/**
 * Worldmonitor API proxy helper.
 * Calls https://api.worldmonitor.app (or WM_API_URL env override).
 * No API key needed — worldmonitor's public production API.
 */

const WM_BASE = (process.env.WM_API_URL ?? 'https://api.worldmonitor.app').replace(/\/$/, '')

export async function wmGet<T>(
  path: string,
  params?: Record<string, string | string[]>,
): Promise<T> {
  const url = new URL(`${WM_BASE}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, Array.isArray(v) ? v.join(',') : v)
    }
  }
  const r = await fetch(url.toString(), {
    headers: { 'User-Agent': 'monoth/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!r.ok) throw new Error(`WM ${path}: HTTP ${r.status}`)
  return r.json()
}

export async function wmPost<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${WM_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'monoth/1.0',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  })
  if (!r.ok) throw new Error(`WM ${path}: HTTP ${r.status}`)
  return r.json()
}
