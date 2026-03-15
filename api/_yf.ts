import { cached } from './_cache.js'

export const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://finance.yahoo.com/',
  'Origin': 'https://finance.yahoo.com',
}

interface Crumb { crumb: string; cookie: string }

async function fetchCrumb(): Promise<Crumb> {
  const cookieRes = await fetch('https://fc.yahoo.com', { headers: YF_HEADERS })
  const cookie = cookieRes.headers.get('set-cookie') ?? ''
  const crumbRes = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: { ...YF_HEADERS, Cookie: cookie },
  })
  if (!crumbRes.ok) throw new Error(`crumb ${crumbRes.status}`)
  const crumb = await crumbRes.text()
  return { crumb, cookie }
}

export async function yfGet(path: string): Promise<Response> {
  const { crumb, cookie } = await cached('yf:crumb', 1_800_000, fetchCrumb).then(r => r.data)
  const sep = path.includes('?') ? '&' : '?'
  return fetch(`${path}${sep}crumb=${encodeURIComponent(crumb)}`, {
    headers: { ...YF_HEADERS, Cookie: cookie },
  })
}
