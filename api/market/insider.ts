import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const SEC_HEADERS = {
  'User-Agent': 'Monoth Financial monoth@monoth.io',
  'Accept': 'application/json',
}

interface InsiderFiling {
  ticker: string
  issuer: string
  filerName: string
  role: string
  transactionType: string
  shares: number
  value: number | null
  filedDate: string
  url: string
}

// CIK → ticker mapping (zero-padded 10-digit CIK)
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
  '0000886982': 'GS',
  '0000034088': 'XOM',
  '0000023217': 'CVX',
  '0000200406': 'JNJ',
  '0000104169': 'WMT',
  '0000354950': 'HD',
  '0000078814': 'PFE',
  '0000310158': 'COST',
  '0001065280': 'NFLX',
  '0000051143': 'IBM',
}

async function pLimit<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = []
  let i = 0
  async function worker() {
    while (i < tasks.length) {
      const idx = i++
      results[idx] = await tasks[idx]()
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
  return results
}

function extractXmlValue(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'))
  return m?.[1]?.trim() ?? ''
}

// Parse a Form 4 XML document to get real transaction info
function parseForm4(xml: string, ticker: string, filedDate: string, cik: string, accNum: string): InsiderFiling | null {
  const filerName = extractXmlValue(xml, 'rptOwnerName')
  if (!filerName) return null

  const role = extractXmlValue(xml, 'officerTitle') || extractXmlValue(xml, 'reportingOwnerRelationship') || ''
  const issuer = extractXmlValue(xml, 'issuerName') || ticker

  // Try non-derivative transactions first, then derivative
  const txnBlocks = [...xml.matchAll(/<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/gi)]
    .concat([...xml.matchAll(/<derivativeTransaction>([\s\S]*?)<\/derivativeTransaction>/gi)])

  let shares = 0
  let price: number | null = null
  let txnCode = ''

  for (const [, block] of txnBlocks) {
    const code = extractXmlValue(block, 'transactionCode')
    // P=Purchase, S=Sale, A=Award/Grant, D=Disposition
    if (!['P', 'S', 'A', 'D'].includes(code)) continue
    const sharesMatch = block.match(/<transactionShares>\s*<value>([^<]+)<\/value>/i)
    const priceMatch = block.match(/<transactionPricePerShare>\s*<value>([^<]+)<\/value>/i)
    const adCode = extractXmlValue(block, 'transactionAcquiredDisposedCode')
    shares = sharesMatch ? Math.abs(parseFloat(sharesMatch[1] ?? '0')) : 0
    price = priceMatch ? parseFloat(priceMatch[1] ?? '0') : null
    txnCode = adCode === 'A' ? 'Buy' : adCode === 'D' ? 'Sell' : code === 'P' ? 'Buy' : code === 'S' ? 'Sell' : code
    if (shares > 0) break
  }

  const numericCIK = parseInt(cik).toString()
  const accNumNoHyphens = accNum.replace(/-/g, '')
  const filingUrl = `https://www.sec.gov/Archives/edgar/data/${numericCIK}/${accNumNoHyphens}/`

  return {
    ticker,
    issuer,
    filerName,
    role: role.replace(/true/gi, '').trim(),
    transactionType: txnCode || 'N/A',
    shares,
    value: price != null && shares > 0 ? Math.round(price * shares) : null,
    filedDate,
    url: filingUrl,
  }
}

async function fetchCompanyForm4s(cik: string, ticker: string): Promise<InsiderFiling[]> {
  // Fetch the company's recent filings index
  const submUrl = `https://data.sec.gov/submissions/CIK${cik}.json`
  const submRes = await fetch(submUrl, { headers: SEC_HEADERS, signal: AbortSignal.timeout(8_000) })
  if (!submRes.ok) return []

  const subm = await submRes.json() as {
    filings?: {
      recent?: {
        form?: string[]
        accessionNumber?: string[]
        primaryDocument?: string[]
        filingDate?: string[]
      }
    }
  }

  const recent = subm.filings?.recent
  if (!recent) return []

  const forms = recent.form ?? []
  const accNums = recent.accessionNumber ?? []
  const docs = recent.primaryDocument ?? []
  const dates = recent.filingDate ?? []

  // Find Form 4 filings — take the 3 most recent
  const form4s: { accNum: string; doc: string; date: string }[] = []
  for (let i = 0; i < forms.length && form4s.length < 3; i++) {
    if (forms[i] === '4') {
      const accNum = accNums[i]
      const doc = docs[i]
      const date = dates[i]
      if (accNum && doc && date) {
        form4s.push({ accNum, doc, date })
      }
    }
  }

  const numericCIK = parseInt(cik).toString()

  // Fetch all XMLs in parallel
  const xmlResults = await Promise.allSettled(
    form4s.map(async ({ accNum, doc, date }) => {
      const accNoHyphens = accNum.replace(/-/g, '')
      const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${numericCIK}/${accNoHyphens}/${doc}`
      const xmlRes = await fetch(xmlUrl, {
        headers: { 'User-Agent': 'Monoth Financial monoth@monoth.io', 'Accept': 'text/xml,application/xml,*/*' },
        signal: AbortSignal.timeout(6_000),
      })
      if (!xmlRes.ok) throw new Error(`HTTP ${xmlRes.status}`)
      const xml = await xmlRes.text()
      return parseForm4(xml, ticker, date, cik, accNum)
    })
  )

  return xmlResults
    .filter((r): r is PromiseFulfilledResult<InsiderFiling> => r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data } = await cached('insider:filings:v2', 3_600_000, async () => {
      const entries = Object.entries(CIK_TO_TICKER)
      const settled = await pLimit(
        entries.map(([cik, ticker]) => () => fetchCompanyForm4s(cik, ticker).catch(() => [] as InsiderFiling[])),
        5
      )
      const all: InsiderFiling[] = []
      for (const filings of settled) {
        all.push(...filings)
      }
      return all
        .filter(f => f.filerName)
        .sort((a, b) => b.filedDate.localeCompare(a.filedDate))
        .slice(0, 30)
    })
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch insider filings' })
  }
}
