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

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

async function fetchSenateFiled(): Promise<CongressFiling[]> {
  const end = new Date()
  const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
  const url =
    `https://efts.ussenate.gov/financial-disclosures/filings` +
    `?submitted_start_date=${toISODate(start)}` +
    `&submitted_end_date=${toISODate(end)}` +
    `&report_types[]=PT&limit=50`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Monoth Financial monoth@monoth.io',
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) return []

  const json = await res.json() as {
    data?: {
      first_name?: string
      last_name?: string
      senator_name?: string
      name?: string
      date_received?: string
      filed_date?: string
      report_type?: string
      url?: string
      link?: string
    }[]
  }

  const rows = json.data ?? []
  return rows.map((r) => {
    const first = r.first_name ?? ''
    const last = r.last_name ?? ''
    const fullName = r.senator_name ?? r.name ?? (first && last ? `${first} ${last}` : 'Unknown')
    const filed = r.date_received ?? r.filed_date ?? ''
    const fileUrl = r.url ?? r.link ?? `https://efts.ussenate.gov/financial-disclosures/filings`
    return {
      chamber: 'senate' as const,
      name: fullName,
      filedDate: filed,
      type: 'PTR',
      url: fileUrl,
    }
  }).filter((f) => f.name !== 'Unknown')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('congress:filings:v1', 1_800_000, async () => {
      const senate = await fetchSenateFiled().catch(() => [] as CongressFiling[])
      const all = [...senate].sort((a, b) => b.filedDate.localeCompare(a.filedDate))
      return all
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch congress disclosures' })
  }
}
