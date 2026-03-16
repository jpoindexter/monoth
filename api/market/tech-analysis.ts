import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

function ema(data: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const result: number[] = []
  let prev = data.slice(0, period).reduce((a, b) => a + b) / period
  result.push(...Array(period - 1).fill(null))
  result.push(prev)
  for (let i = period; i < data.length; i++) {
    prev = data[i]! * k + prev * (1 - k)
    result.push(prev)
  }
  return result
}

function calcRSI(closes: number[], period = 14): number {
  const changes = closes.slice(1).map((c, i) => c - closes[i]!)
  const gains = changes.map((c) => Math.max(0, c))
  const losses = changes.map((c) => Math.abs(Math.min(0, c)))
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]!) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]!) / period
  }
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

function sma(data: number[], period: number): number {
  const slice = data.slice(-period)
  return slice.reduce((a, b) => a + b) / slice.length
}

function stddev(data: number[], mean: number): number {
  const variance = data.reduce((acc, v) => acc + (v - mean) ** 2, 0) / data.length
  return Math.sqrt(variance)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  const symbol = (typeof req.query.symbol === 'string' ? req.query.symbol : 'SPY').toUpperCase()
  try {
    const { data, stale } = await cached(`tech-analysis-${symbol}`, 300_000, async () => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=6mo`
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (!r.ok) throw new Error(`Yahoo Finance returned ${r.status}`)
      const json = await r.json()
      const result = json?.chart?.result?.[0]
      if (!result) throw new Error('No data returned')

      const closes: number[] = result.indicators.quote[0].close
      const validCloses = closes.filter((c: number | null) => c != null) as number[]
      if (validCloses.length < 30) throw new Error('Insufficient data')

      const price = validCloses[validCloses.length - 1]!

      const rsi = calcRSI(validCloses)
      const rsiSignal = rsi < 30 ? 'oversold' : rsi > 70 ? 'overbought' : 'neutral'

      const ema12 = ema(validCloses, 12)
      const ema26 = ema(validCloses, 26)
      const macdLine: number[] = []
      for (let i = 0; i < ema12.length; i++) {
        const e12 = ema12[i]
        const e26 = ema26[i]
        macdLine.push(e12 != null && e26 != null ? e12 - e26 : 0)
      }
      const validMacd = macdLine.filter((v) => v !== 0)
      const signalArr = ema(validMacd.length >= 9 ? validMacd : macdLine, 9)
      const macdVal = macdLine[macdLine.length - 1]!
      const signalVal = signalArr[signalArr.length - 1] ?? 0
      const histogram = macdVal - signalVal
      const macdSignal = histogram >= 0 ? 'bullish' : 'bearish'

      const s20 = validCloses.length >= 20 ? sma(validCloses, 20) : price
      const s50 = validCloses.length >= 50 ? sma(validCloses, 50) : price
      const s200 = validCloses.length >= 200 ? sma(validCloses, 200) : price
      const maSignal = price > s50 && s50 > s200 ? 'bullish' : price < s50 && s50 < s200 ? 'bearish' : 'mixed'

      const bb20Slice = validCloses.slice(-20)
      const bbMiddle = sma(validCloses, 20)
      const bbStd = stddev(bb20Slice, bbMiddle)
      const bbUpper = bbMiddle + 2 * bbStd
      const bbLower = bbMiddle - 2 * bbStd
      const bbSignal = price >= bbUpper ? 'upper' : price <= bbLower ? 'lower' : 'middle'

      const bullishSignals = [
        rsiSignal === 'oversold',
        macdSignal === 'bullish',
        maSignal === 'bullish',
        bbSignal === 'lower',
      ].filter(Boolean).length

      const bearishSignals = [
        rsiSignal === 'overbought',
        macdSignal === 'bearish',
        maSignal === 'bearish',
        bbSignal === 'upper',
      ].filter(Boolean).length

      const overall =
        bullishSignals >= 3 ? 'strong_buy' :
        bullishSignals >= 2 ? 'buy' :
        bearishSignals >= 3 ? 'strong_sell' :
        bearishSignals >= 2 ? 'sell' : 'neutral'

      return {
        symbol,
        price,
        rsi,
        rsiSignal,
        macd: { line: macdVal, signal: signalVal, histogram },
        macdSignal,
        sma20: s20,
        sma50: s50,
        sma200: s200,
        maSignal,
        bb: { upper: bbUpper, middle: bbMiddle, lower: bbLower },
        bbSignal,
        overall,
        bullishCount: bullishSignals,
        bearishCount: bearishSignals,
      }
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch tech analysis' })
  }
}
