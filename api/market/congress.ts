import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

interface CongressFiling {
  chamber: 'senate' | 'house'
  name: string
  party?: string
  state?: string
  filedDate: string
  type: string
  ticker?: string
  amount?: string
  url: string
}

const BASE = 'https://efdsearch.senate.gov'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function getSession(): Promise<{ csrfToken: string; cookies: string }> {
  const res = await fetch(`${BASE}/search/home/`, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html' },
    signal: AbortSignal.timeout(8_000),
  })
  if (!res.ok) throw new Error(`EFDS home ${res.status}`)
  const html = await res.text()
  if (html.includes('Under Maintenance')) throw new Error('EFDS under maintenance')

  const rawCookies = res.headers.getSetCookie?.() ?? []
  const cookies = rawCookies.map((c) => c.split(';')[0]).join('; ')
  const match = html.match(/name="csrfmiddlewaretoken"\s+value="([^"]+)"/)
  if (!match) throw new Error('CSRF token not found')
  return { csrfToken: match[1], cookies }
}

function toSlashDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

async function fetchSenatePTRs(): Promise<CongressFiling[]> {
  const { csrfToken, cookies } = await getSession()

  const end = new Date()
  const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)

  const body = new URLSearchParams({
    draw: '1',
    'columns[0][data]': 'senator_name',
    'columns[0][name]': 'senator_name',
    'columns[1][data]': 'date_received',
    'columns[1][name]': 'date_received',
    start: '0',
    length: '50',
    'report_types[]': '11', // PTR = 11
    'submitted_start_date': toSlashDate(start),
    'submitted_end_date': toSlashDate(end),
  }).toString()

  const res = await fetch(`${BASE}/search/report/data/`, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Referer': `${BASE}/search/home/`,
      'X-CSRFToken': csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': cookies,
    },
    body,
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) throw new Error(`EFDS data ${res.status}`)
  const json = await res.json() as {
    data?: { senator_name?: string; date_received?: string; link?: string }[]
    recordsTotal?: number
  }

  const rows = json.data ?? []
  return rows.map((r) => ({
    chamber: 'senate' as const,
    name: String(r.senator_name ?? '').replace(/<[^>]*>/g, '').trim(),
    filedDate: String(r.date_received ?? '').trim(),
    type: 'PTR',
    url: extractHref(String(r.senator_name ?? '')) || 'https://efdsearch.senate.gov/search/home/',
  })).filter((f) => !!f.name)
}

function extractHref(html: string): string {
  const m = html.match(/href="([^"]+)"/)
  return m ? `${BASE}${m[1]}` : ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('congress:filings:v3', 1_800_000, async () => {
      const filings = await fetchSenatePTRs()
      return filings.sort((a, b) => b.filedDate.localeCompare(a.filedDate))
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
    res.json(data)
  } catch (err) {
    res.status(503).json({ error: 'Senate disclosure system temporarily unavailable', detail: String(err) })
  }
}
