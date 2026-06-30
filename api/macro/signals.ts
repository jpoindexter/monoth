import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'
import { wmGet } from '../_wm.js'

interface MacroSignal {
  name: string
  value: number
  label: string
  status: 'bullish' | 'bearish' | 'neutral'
  detail: string
}

interface WmSignalBase {
  status: 'bullish' | 'bearish' | 'neutral'
  [key: string]: unknown
}

interface WmMacroSignals {
  liquidity?: WmSignalBase & { fedAssets?: number; trend?: string }
  flowStructure?: WmSignalBase & { spread?: number; label?: string }
  macroRegime?: WmSignalBase & { verdict?: string }
  technicalTrend?: WmSignalBase & { signal?: string; label?: string }
  hashRate?: WmSignalBase & { change30d?: number; label?: string }
  priceMomentum?: WmSignalBase & { changePercent?: number; label?: string }
  fearGreed?: WmSignalBase & { value?: number; classification?: string }
}

interface WmMacroResponse {
  timestamp: string
  verdict: string
  bullishCount: number
  totalCount: number
  signals?: WmMacroSignals
  unavailable: boolean
}

function mapWmSignals(wm: WmMacroResponse): MacroSignal[] {
  const signals: MacroSignal[] = []
  const s = wm.signals
  if (!s) return signals

  if (s.fearGreed) {
    const val = s.fearGreed.value ?? 50
    const label = s.fearGreed.classification ?? 'Neutral'
    signals.push({
      name: 'Fear & Greed',
      value: val,
      label,
      status: s.fearGreed.status,
      detail: `Index: ${val}/100`,
    })
  }

  if (s.hashRate) {
    const chg = s.hashRate.change30d ?? 0
    signals.push({
      name: 'BTC Hash Rate',
      value: Math.round(chg * 10) / 10,
      label: s.hashRate.label ?? (chg > 0 ? 'Growing' : 'Declining'),
      status: s.hashRate.status,
      detail: `30d: ${chg > 0 ? '+' : ''}${chg.toFixed(1)}%`,
    })
  }

  if (s.flowStructure) {
    const spread = s.flowStructure.spread ?? 0
    signals.push({
      name: 'Yield Curve',
      value: Math.round(spread * 100) / 100,
      label: s.flowStructure.label ?? (spread < 0 ? 'Inverted' : spread < 0.5 ? 'Flat' : 'Normal'),
      status: s.flowStructure.status,
      detail: `10Y-2Y: ${spread > 0 ? '+' : ''}${spread.toFixed(2)}%`,
    })
  }

  if (s.macroRegime) {
    signals.push({
      name: 'Macro Regime',
      value: 0,
      label: s.macroRegime.verdict ?? wm.verdict,
      status: s.macroRegime.status,
      detail: wm.verdict,
    })
  }

  if (s.technicalTrend) {
    signals.push({
      name: 'Technicals',
      value: 0,
      label: s.technicalTrend.label ?? s.technicalTrend.signal ?? '',
      status: s.technicalTrend.status,
      detail: s.technicalTrend.label ?? '',
    })
  }

  if (s.liquidity) {
    const assets = s.liquidity.fedAssets ?? 0
    signals.push({
      name: 'Liquidity',
      value: assets,
      label: s.liquidity.trend ?? (s.liquidity.status === 'bullish' ? 'Expanding' : s.liquidity.status === 'bearish' ? 'Tightening' : 'Neutral'),
      status: s.liquidity.status,
      detail: assets ? `Fed: $${(assets / 1e9).toFixed(1)}B` : '',
    })
  }

  if (s.priceMomentum) {
    const chg = s.priceMomentum.changePercent ?? 0
    signals.push({
      name: 'Momentum',
      value: Math.round(chg * 10) / 10,
      label: s.priceMomentum.label ?? (chg > 0 ? 'Bullish' : 'Bearish'),
      status: s.priceMomentum.status,
      detail: `${chg > 0 ? '+' : ''}${chg.toFixed(1)}%`,
    })
  }

  return signals
}

async function buildSignalsLocally(): Promise<MacroSignal[]> {
  const signals: MacroSignal[] = []

  // Fear & Greed
  try {
    const fng = await fetch('https://api.alternative.me/fng/?limit=1')
    const d = await fng.json()
    const val = parseInt(d.data?.[0]?.value ?? '50')
    const cls = d.data?.[0]?.value_classification ?? 'Neutral'
    signals.push({ name: 'Fear & Greed', value: val, label: cls, status: val >= 60 ? 'bullish' : val <= 40 ? 'bearish' : 'neutral', detail: `Index: ${val}/100` })
  } catch { signals.push({ name: 'Fear & Greed', value: 50, label: 'N/A', status: 'neutral', detail: 'Unavailable' }) }

  // BTC Hash Rate
  try {
    const hr = await fetch('https://mempool.space/api/v1/mining/hashrate/1m')
    const d = await hr.json()
    if (d.hashrates?.length >= 2) {
      const latest = d.hashrates[d.hashrates.length - 1].avgHashrate
      const prev = d.hashrates[0].avgHashrate
      const chg = ((latest - prev) / prev) * 100
      signals.push({ name: 'BTC Hash Rate', value: Math.round(chg * 10) / 10, label: chg > 0 ? 'Growing' : 'Declining', status: chg > 5 ? 'bullish' : chg < -5 ? 'bearish' : 'neutral', detail: `30d: ${chg > 0 ? '+' : ''}${chg.toFixed(1)}%` })
    }
  } catch { signals.push({ name: 'BTC Hash Rate', value: 0, label: 'N/A', status: 'neutral', detail: 'Unavailable' }) }

  // Yield Curve (Yahoo Finance ^TNX / ^IRX)
  try {
    const YF_H = { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' }
    const [tnxRes, irxRes] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1d&range=1d', { headers: YF_H }),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EIRX?interval=1d&range=1d', { headers: YF_H }),
    ])
    const tnxData = await tnxRes.json()
    const irxData = await irxRes.json()
    const y10 = tnxData.chart?.result?.[0]?.meta?.regularMarketPrice
    const yShort = irxData.chart?.result?.[0]?.meta?.regularMarketPrice
    if (y10 != null && yShort != null) {
      const spread = y10 - yShort
      signals.push({ name: 'Yield Curve', value: Math.round(spread * 100) / 100, label: spread < 0 ? 'Inverted' : spread < 0.5 ? 'Flat' : 'Normal', status: spread < 0 ? 'bearish' : spread > 0.5 ? 'bullish' : 'neutral', detail: `10Y-3M: ${spread > 0 ? '+' : ''}${spread.toFixed(2)}%` })
    }
  } catch { /* indicator unavailable; skip it */ }

  // VIX
  try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d', { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' } })
    const d = await r.json()
    const level = d.chart?.result?.[0]?.meta?.regularMarketPrice
    if (level != null) signals.push({ name: 'Volatility', value: Math.round(level * 10) / 10, label: level > 30 ? 'Elevated Fear' : level < 15 ? 'Low Volatility' : 'Moderate', status: level > 30 ? 'bearish' : level < 15 ? 'bullish' : 'neutral', detail: `VIX: ${level.toFixed(1)}` })
  } catch { /* indicator unavailable; skip it */ }

  // US Debt
  try {
    const r = await fetch('https://api.fiscaldata.treasury.gov/services/api/v1/accounting/od/debt_to_penny?sort=-record_date&page[number]=1&page[size]=2', { signal: AbortSignal.timeout(8_000) })
    const d = await r.json() as { data?: { record_date: string; tot_pub_debt_out_amt: string }[] }
    const entries = d.data ?? []
    const latest = entries[0]
    const prev = entries[1]
    if (latest) {
      const current = parseFloat(latest.tot_pub_debt_out_amt)
      const prevAmt = prev ? parseFloat(prev.tot_pub_debt_out_amt) : null
      const dailyChg = prevAmt ? ((current - prevAmt) / 1e9) : null
      const trillions = (current / 1e12).toFixed(2)
      signals.push({ name: 'US Debt', value: Math.round(current / 1e9), label: dailyChg != null ? `${dailyChg > 0 ? '+' : ''}${dailyChg.toFixed(0)}B today` : `$${trillions}T`, status: 'bearish', detail: `$${trillions}T as of ${latest.record_date}` })
    }
  } catch { /* indicator unavailable; skip it */ }

  return signals
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('macro-signals', 600_000, async () => {
      // Primary: proxy API
      try {
        const resp = await wmGet<WmMacroResponse>('/api/economic/v1/get-macro-signals')
        if (!resp.unavailable && resp.signals) {
          const mapped = mapWmSignals(resp)
          if (mapped.length >= 3) return mapped
        }
      } catch {
        // fallthrough to local build
      }
      // Fallback: build locally from free APIs
      return buildSignalsLocally()
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch macro signals' })
  }
}
