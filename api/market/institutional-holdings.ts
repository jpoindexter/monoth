import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const SEC_HEADERS = {
  'User-Agent': 'Monoth Financial monoth@monoth.io',
  'Accept': 'application/json',
}

export interface InstitutionalFiling {
  fund: string
  cik: string
  filedDate: string
  period: string
  url: string
}

const FUNDS: Record<string, string> = {
  '0001067983': 'Berkshire Hathaway',
  '0001037389': 'Vanguard Group',
  '0000102909': 'BlackRock',
  '0000038777': 'Fidelity Investments',
  '0000093751': 'T. Rowe Price',
  '0001335730': 'Pershing Square',
  '0001336528': 'Renaissance Technologies',
}

async function fetchFund(cik: string, fundName: string): Promise<InstitutionalFiling | null> {
  const url = `https://data.sec.gov/submissions/CIK${cik}.json`
  const r = await fetch(url, { headers: SEC_HEADERS, signal: AbortSignal.timeout(8_000) })
  if (!r.ok) return null
  const json = await r.json() as {
    filings?: {
      recent?: {
        form?: string[]
        accessionNumber?: string[]
        filingDate?: string[]
        reportDate?: string[]
      }
    }
  }
  const recent = json.filings?.recent
  if (!recent) return null
  const forms = recent.form ?? []
  const accNums = recent.accessionNumber ?? []
  const dates = recent.filingDate ?? []
  const periods = recent.reportDate ?? []
  for (let i = 0; i < forms.length; i++) {
    if (forms[i] === '13F-HR') {
      const acc = accNums[i]
      const date = dates[i]
      const period = periods[i] ?? ''
      if (!acc || !date) continue
      const numericCik = parseInt(cik).toString()
      const accNoHyphens = acc.replace(/-/g, '')
      const filingUrl = `https://www.sec.gov/Archives/edgar/data/${numericCik}/${accNoHyphens}/`
      return { fund: fundName, cik, filedDate: date, period, url: filingUrl }
    }
  }
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data } = await cached<InstitutionalFiling[]>('institutional-holdings:v1', 86_400_000, async () => {
      const results = await Promise.allSettled(
        Object.entries(FUNDS).map(([cik, name]) => fetchFund(cik, name))
      )
      return results
        .filter((r): r is PromiseFulfilledResult<InstitutionalFiling> =>
          r.status === 'fulfilled' && r.value !== null
        )
        .map(r => r.value)
        .sort((a, b) => b.filedDate.localeCompare(a.filedDate))
    })
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch institutional holdings' })
  }
}
