import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
}

async function fetchFundamentals(symbol: string) {
  const modules = 'defaultKeyStatistics,financialData,summaryDetail,summaryProfile'
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`
  const r = await fetch(url, { headers: YF_HEADERS })
  if (!r.ok) throw new Error(`Yahoo Finance error: ${r.status}`)
  const json = await r.json()
  const result = json.quoteSummary?.result?.[0]
  if (!result) throw new Error('No data')

  const ks = result.defaultKeyStatistics ?? {}
  const fd = result.financialData ?? {}
  const sd = result.summaryDetail ?? {}
  const sp = result.summaryProfile ?? {}

  function raw(obj: Record<string, { raw?: number } | undefined>, key: string): number | null {
    return (obj[key] as { raw?: number } | undefined)?.raw ?? null
  }

  return {
    symbol,
    name: sp.longName ?? sp.shortName ?? symbol,
    sector: sp.sector ?? null,
    industry: sp.industry ?? null,
    // Valuation
    peRatio: raw(sd, 'trailingPE'),
    forwardPE: raw(sd, 'forwardPE'),
    pbRatio: raw(sd, 'priceToBook'),
    evToEbitda: raw(ks, 'enterpriseToEbitda'),
    evToRevenue: raw(ks, 'enterpriseToRevenue'),
    pegRatio: raw(ks, 'pegRatio'),
    priceToSales: raw(sd, 'priceToSalesTrailing12Months'),
    // Profitability
    profitMargin: raw(fd, 'profitMargins'),
    operatingMargin: raw(fd, 'operatingMargins'),
    roe: raw(fd, 'returnOnEquity'),
    roa: raw(fd, 'returnOnAssets'),
    // Growth
    revenueGrowth: raw(fd, 'revenueGrowth'),
    earningsGrowth: raw(fd, 'earningsGrowth'),
    // Size
    marketCap: raw(sd, 'marketCap'),
    enterpriseValue: raw(ks, 'enterpriseValue'),
    revenue: raw(fd, 'totalRevenue'),
    ebitda: raw(fd, 'ebitda'),
    // Dividends
    dividendYield: raw(sd, 'dividendYield'),
    payoutRatio: raw(sd, 'payoutRatio'),
    // Debt
    debtToEquity: raw(fd, 'debtToEquity'),
    currentRatio: raw(fd, 'currentRatio'),
    // Per share
    eps: raw(ks, 'trailingEps'),
    bookValue: raw(ks, 'bookValue'),
    // Float / short
    sharesOutstanding: raw(ks, 'sharesOutstanding'),
    shortRatio: raw(ks, 'shortRatio'),
    beta: raw(sd, 'beta'),
    // 52W
    week52High: raw(sd, 'fiftyTwoWeekHigh'),
    week52Low: raw(sd, 'fiftyTwoWeekLow'),
    fiftyDayAvg: raw(sd, 'fiftyDayAverage'),
    twoHundredDayAvg: raw(sd, 'twoHundredDayAverage'),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  const symbol = (req.query.symbol as string)?.trim().toUpperCase()
  if (!symbol) return res.status(400).json({ error: 'symbol param required' })
  try {
    const data = await cached(`fundamentals:${symbol}`, 300_000, () => fetchFundamentals(symbol))
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data.data)
  } catch {
    res.status(500).json({ error: `Failed to fetch fundamentals for ${symbol}` })
  }
}
