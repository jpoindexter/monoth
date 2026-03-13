import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

// SEC EDGAR headers - required by their ToS
const SEC_HEADERS = {
  'User-Agent': 'Monoth Financial monoth@monoth.io',
  'Accept': 'application/json',
}

interface InsiderFiling {
  ticker: string
  issuer: string
  filerName: string
  role: string
  transactionType: string // 'P' buy, 'S' sell, 'A' award, 'D' dispose
  shares: number
  value: number | null
  filedDate: string // YYYY-MM-DD
  url: string
}

// Map CIK to ticker for top companies
const CIK_TO_TICKER: Record<string, string> = {
  '0000320193': 'AAPL',
  '0000789019': 'MSFT',
  '0001045810': 'NVDA',
  '0001326801': 'META',
  '0001652044': 'GOOGL',
  '0001018724': 'AMZN',
  '0001318605': 'TSLA',
  '0000019617': 'JPM',
  '0001403161': 'V',
  '0000070858': 'BAC',
  '0000034088': 'XOM',
}

async function fetchRecentForm4s(): Promise<InsiderFiling[]> {
  // Use EDGAR full-text search for Form 4 filings from last 7 days
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10)
  const url = `https://efts.sec.gov/LATEST/search-index?forms=4&dateRange=custom&startdt=${since}&hits.hits._source=period_of_report,entity_name,file_date,period_of_report&_source=entity_name,file_date,period_of_report`

  const r = await fetch(url, { headers: SEC_HEADERS })
  if (!r.ok) throw new Error(`EDGAR error: ${r.status}`)
  const json = await r.json() as { hits?: { hits?: Record<string, unknown>[] } }
  const hits = json?.hits?.hits ?? []

  const filings: InsiderFiling[] = []
  for (const hit of hits.slice(0, 50)) {
    const source = (hit._source ?? {}) as Record<string, unknown>
    const entityName = String(source.entity_name ?? source.display_names ?? '')
    const fileDate = String(source.file_date ?? '').slice(0, 10)
    const formUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=4&dateb=&owner=include&count=10`

    if (!entityName || !fileDate) continue
    filings.push({
      ticker: '',
      issuer: entityName,
      filerName: '',
      role: '',
      transactionType: 'P',
      shares: 0,
      value: null,
      filedDate: fileDate,
      url: formUrl,
    })
  }
  return filings
}

async function fetchCompanyInsider(cik: string, ticker: string): Promise<InsiderFiling[]> {
  const url = `https://data.sec.gov/submissions/CIK${cik}.json`
  const r = await fetch(url, { headers: SEC_HEADERS })
  if (!r.ok) return []
  const json = await r.json() as Record<string, unknown>
  const filings = (json.filings as Record<string, unknown>)?.recent as Record<string, unknown[]> | undefined
  if (!filings) return []

  const forms = filings.form as string[]
  const dates = filings.filingDate as string[]
  const accNums = filings.accessionNumber as string[]
  const issuer = String(json.name ?? ticker)

  const results: InsiderFiling[] = []
  const since = Date.now() - 30 * 86_400_000

  for (let i = 0; i < forms.length; i++) {
    if (forms[i] !== '4') continue
    const date = dates[i] ?? ''
    if (new Date(date).getTime() < since) continue
    const accNum = (accNums[i] ?? '').replace(/-/g, '')
    const fileUrl = `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${accNum}/`

    results.push({
      ticker,
      issuer,
      filerName: '',
      role: '',
      transactionType: 'P',
      shares: 0,
      value: null,
      filedDate: date,
      url: fileUrl,
    })
    if (results.length >= 5) break
  }
  return results
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data } = await cached('insider:filings', 300_000, async () => {
      const results = await Promise.allSettled(
        Object.entries(CIK_TO_TICKER).map(([cik, ticker]) => fetchCompanyInsider(cik, ticker))
      )
      const all: InsiderFiling[] = []
      for (const r of results) {
        if (r.status === 'fulfilled') all.push(...r.value)
      }
      return all.sort((a, b) => b.filedDate.localeCompare(a.filedDate))
    })
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch insider filings' })
  }
}
