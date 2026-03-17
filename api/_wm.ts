const WM_BASE = (process.env.WM_API_URL ?? '').replace(/\/$/, '')

function requireBase(path: string): string {
  if (!WM_BASE) throw new Error(`WM_API_URL not set (path: ${path})`)
  return WM_BASE
}

export async function wmGet<T>(
  path: string,
  params?: Record<string, string | string[]>,
): Promise<T> {
  const url = new URL(`${requireBase(path)}${path}`)
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
  const r = await fetch(`${requireBase(path)}${path}`, {
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
