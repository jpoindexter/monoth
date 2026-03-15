import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'
import { yfGet } from '../_yf.js'

async function fetchYF(symbol: string) {
  const modules = 'defaultKeyStatistics,financialData,summaryDetail,summaryProfile'
  const r = await yfGet(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`)
  if (!r.ok) throw new Error(`YF ${r.status}`)
  const json = await r.json()
  const result = json.quoteSummary?.result?.[0]
  if (!result) throw new Error('no data')

  const ks = result.defaultKeyStatistics ?? {}
  const fd = result.financialData ?? {}
  const sd = result.summaryDetail ?? {}
  const sp = result.summaryProfile ?? {}

  function raw(obj: Record<string, { raw?: number } | undefined>, key: string): number | null {
    return (obj[key] as { raw?: number } | undefined)?.raw ?? null
  }

  return {
    symbol,
    name: (sp as Record<string, string>).longName ?? (sp as Record<string, string>).shortName ?? symbol,
    sector: (sp as Record<string, string>).sector ?? null,
    industry: (sp as Record<string, string>).industry ?? null,
    peRatio: raw(sd, 'trailingPE'),
    forwardPE: raw(sd, 'forwardPE'),
    pbRatio: raw(sd, 'priceToBook'),
    evToEbitda: raw(ks, 'enterpriseToEbitda'),
    evToRevenue: raw(ks, 'enterpriseToRevenue'),
    pegRatio: raw(ks, 'pegRatio'),
    priceToSales: raw(sd, 'priceToSalesTrailing12Months'),
    profitMargin: raw(fd, 'profitMargins'),
    operatingMargin: raw(fd, 'operatingMargins'),
    roe: raw(fd, 'returnOnEquity'),
    roa: raw(fd, 'returnOnAssets'),
    revenueGrowth: raw(fd, 'revenueGrowth'),
    earningsGrowth: raw(fd, 'earningsGrowth'),
    marketCap: raw(sd, 'marketCap'),
    enterpriseValue: raw(ks, 'enterpriseValue'),
    revenue: raw(fd, 'totalRevenue'),
    ebitda: raw(fd, 'ebitda'),
    dividendYield: raw(sd, 'dividendYield'),
    payoutRatio: raw(sd, 'payoutRatio'),
    debtToEquity: raw(fd, 'debtToEquity'),
    currentRatio: raw(fd, 'currentRatio'),
    eps: raw(ks, 'trailingEps'),
    bookValue: raw(ks, 'bookValue'),
    sharesOutstanding: raw(ks, 'sharesOutstanding'),
    shortRatio: raw(ks, 'shortRatio'),
    beta: raw(sd, 'beta'),
    week52High: raw(sd, 'fiftyTwoWeekHigh'),
    week52Low: raw(sd, 'fiftyTwoWeekLow'),
    fiftyDayAvg: raw(sd, 'fiftyDayAverage'),
    twoHundredDayAvg: raw(sd, 'twoHundredDayAverage'),
  }
}

async function fetchFinnhub(symbol: string) {
  const key = process.env.FINNHUB_API_KEY
  if (!key) throw new Error('no finnhub key')
  const [metricRes, profileRes] = await Promise.all([
    fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${key}`),
    fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${key}`),
  ])
  if (!metricRes.ok) throw new Error(`finnhub ${metricRes.status}`)
  const { metric } = await metricRes.json()
  const profile = profileRes.ok ? await profileRes.json() : {}
  return {
    symbol,
    name: profile.name ?? symbol,
    sector: null,
    industry: profile.finnhubIndustry ?? null,
    peRatio: metric['peTTM'] ?? null,
    forwardPE: metric['peNormalizedAnnual'] ?? null,
    pbRatio: metric['pbAnnual'] ?? null,
    evToEbitda: metric['evEbitdaTTM'] ?? null,
    evToRevenue: metric['evRevenueTTM'] ?? null,
    pegRatio: null,
    priceToSales: metric['psTTM'] ?? null,
    profitMargin: metric['netProfitMarginTTM'] != null ? metric['netProfitMarginTTM'] / 100 : null,
    operatingMargin: metric['operatingMarginTTM'] != null ? metric['operatingMarginTTM'] / 100 : null,
    roe: metric['roeTTM'] != null ? metric['roeTTM'] / 100 : null,
    roa: metric['roaTTM'] != null ? metric['roaTTM'] / 100 : null,
    revenueGrowth: metric['revenueGrowthTTMYoy'] != null ? metric['revenueGrowthTTMYoy'] / 100 : null,
    earningsGrowth: null,
    marketCap: profile.marketCapitalization ? profile.marketCapitalization * 1e6 : null,
    enterpriseValue: null,
    revenue: null,
    ebitda: null,
    dividendYield: metric['dividendYieldIndicatedAnnual'] != null ? metric['dividendYieldIndicatedAnnual'] / 100 : null,
    payoutRatio: null,
    debtToEquity: metric['totalDebt/totalEquityAnnual'] ?? null,
    currentRatio: metric['currentRatioAnnual'] ?? null,
    eps: metric['epsTTM'] ?? null,
    bookValue: metric['bookValuePerShareAnnual'] ?? null,
    sharesOutstanding: profile.shareOutstanding ? profile.shareOutstanding * 1e6 : null,
    shortRatio: null,
    beta: metric['beta'] ?? null,
    week52High: metric['52WeekHigh'] ?? null,
    week52Low: metric['52WeekLow'] ?? null,
    fiftyDayAvg: metric['50DayMovingAverage'] ?? null,
    twoHundredDayAvg: metric['200DayMovingAverage'] ?? null,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  const symbol = (req.query.symbol as string)?.trim().toUpperCase()
  if (!symbol) return res.status(400).json({ error: 'symbol param required' })
  try {
    const data = await cached(`fundamentals:${symbol}`, 300_000, async () => {
      try { return await fetchYF(symbol) } catch { /* fall through */ }
      return await fetchFinnhub(symbol)
    })
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data.data)
  } catch {
    res.status(500).json({ error: `Failed to fetch fundamentals for ${symbol}` })
  }
}
