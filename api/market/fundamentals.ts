import type { VercelRequest, VercelResponse } from '@vercel/node'
import YahooFinance from 'yahoo-finance2'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

// yahoo-finance2 handles cookie+crumb auth internally; the raw v10 quoteSummary
// endpoint now 401s from serverless IPs, so we use the library like the other endpoints.
async function fetchYF(symbol: string) {
  const result = await yf.quoteSummary(symbol, {
    modules: ['defaultKeyStatistics', 'financialData', 'summaryDetail', 'summaryProfile', 'price'],
  })

  const ks = (result.defaultKeyStatistics ?? {}) as Record<string, unknown>
  const fd = (result.financialData ?? {}) as Record<string, unknown>
  const sd = (result.summaryDetail ?? {}) as Record<string, unknown>
  const sp = (result.summaryProfile ?? {}) as Record<string, unknown>
  const pr = (result.price ?? {}) as Record<string, unknown>

  const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
  const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null)

  return {
    symbol,
    name: str(pr.longName) ?? str(pr.shortName) ?? symbol,
    sector: str(sp.sector),
    industry: str(sp.industry),
    peRatio: num(sd.trailingPE),
    forwardPE: num(sd.forwardPE),
    pbRatio: num(ks.priceToBook),
    evToEbitda: num(ks.enterpriseToEbitda),
    evToRevenue: num(ks.enterpriseToRevenue),
    pegRatio: num(ks.pegRatio),
    priceToSales: num(sd.priceToSalesTrailing12Months),
    profitMargin: num(fd.profitMargins),
    operatingMargin: num(fd.operatingMargins),
    roe: num(fd.returnOnEquity),
    roa: num(fd.returnOnAssets),
    revenueGrowth: num(fd.revenueGrowth),
    earningsGrowth: num(fd.earningsGrowth),
    marketCap: num(sd.marketCap) ?? num(pr.marketCap),
    enterpriseValue: num(ks.enterpriseValue),
    revenue: num(fd.totalRevenue),
    ebitda: num(fd.ebitda),
    dividendYield: num(sd.dividendYield),
    payoutRatio: num(sd.payoutRatio),
    debtToEquity: num(fd.debtToEquity),
    currentRatio: num(fd.currentRatio),
    eps: num(ks.trailingEps),
    bookValue: num(ks.bookValue),
    sharesOutstanding: num(ks.sharesOutstanding),
    shortRatio: num(ks.shortRatio),
    beta: num(sd.beta),
    week52High: num(sd.fiftyTwoWeekHigh),
    week52Low: num(sd.fiftyTwoWeekLow),
    fiftyDayAvg: num(sd.fiftyDayAverage),
    twoHundredDayAvg: num(sd.twoHundredDayAverage),
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
