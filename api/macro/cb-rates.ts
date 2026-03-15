import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'
import { wmGet } from '../_wm.js'

const CURRENCY_MAP: Record<string, string> = {
  US: 'USD', GB: 'GBP', JP: 'JPY', XM: 'EUR',
  CH: 'CHF', AU: 'AUD', CA: 'CAD', SG: 'SGD',
  IN: 'INR', CN: 'CNY', KR: 'KRW', BR: 'BRL',
}

const NAME_MAP: Record<string, string> = {
  US: 'Fed (US)', GB: 'BoE (UK)', JP: 'BoJ (Japan)', XM: 'ECB (EU)',
  CH: 'SNB (Swiss)', AU: 'RBA (Australia)', CA: 'BoC (Canada)', SG: 'MAS (Singapore)',
  IN: 'RBI (India)', CN: 'PBoC (China)', KR: 'BoK (Korea)', BR: 'BCB (Brazil)',
}

const NEXT_MEETING: Record<string, string> = {
  US: 'May 7', XM: 'Apr 17', GB: 'May 8', JP: 'Apr 30',
  CH: 'Jun 19', AU: 'Apr 1', CA: 'Apr 16', SG: 'Apr 25',
  IN: 'Apr 9', CN: 'Apr 20', KR: 'Apr 17', BR: 'May 7',
}

interface WmBisRate {
  countryCode: string
  countryName: string
  rate: number
  previousRate: number
  date: string
  centralBank: string
}

// BIS CSV direct fetch as local fallback
const BIS_COUNTRIES = 'US+GB+JP+XM+CH+AU+CA'

function getStartPeriod(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 4)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

async function fetchBISDirect() {
  const start = getStartPeriod()
  const url = `https://stats.bis.org/api/v1/data/WS_CBPOL/M.${BIS_COUNTRIES}?startPeriod=${start}&detail=dataonly&format=csv`
  const r = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!r.ok) throw new Error(`BIS error: ${r.status}`)
  const text = await r.text()

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('REF_AREA') && lines[i].includes('TIME_PERIOD')) { headerIdx = i; break }
  }
  if (headerIdx === -1) throw new Error('BIS CSV header not found')

  const headers = lines[headerIdx].split(',').map(h => h.trim().replace(/"/g, ''))
  const refAreaIdx = headers.indexOf('REF_AREA')
  const timePeriodIdx = headers.indexOf('TIME_PERIOD')
  const obsValueIdx = headers.indexOf('OBS_VALUE')
  if (refAreaIdx === -1 || timePeriodIdx === -1 || obsValueIdx === -1) throw new Error('BIS CSV missing columns')

  const obs: Record<string, { period: string; value: number }[]> = {}
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''))
    const area = cols[refAreaIdx]
    const period = cols[timePeriodIdx]
    const raw = cols[obsValueIdx]
    if (!area || !period || !raw) continue
    const value = parseFloat(raw)
    if (isNaN(value)) continue
    if (!obs[area]) obs[area] = []
    obs[area].push({ period, value })
  }

  return Object.keys(NAME_MAP)
    .filter(code => obs[code])
    .map(code => {
      const entries = (obs[code] ?? []).sort((a, b) => a.period.localeCompare(b.period))
      const last = entries[entries.length - 1]
      const prev = entries[entries.length - 2]
      return {
        name: NAME_MAP[code]!,
        currency: CURRENCY_MAP[code]!,
        rate: last?.value ?? null,
        prev: prev?.value ?? null,
        next: NEXT_MEETING[code] ?? null,
      }
    })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('cb-rates', 21_600_000, async () => {
      // Primary: worldmonitor BIS policy rates (cached 6h server-side with Redis)
      try {
        const resp = await wmGet<{ rates: WmBisRate[] }>('/api/economic/v1/get-bis-policy-rates')
        if (resp.rates?.length) {
          return resp.rates.map(r => ({
            name: NAME_MAP[r.countryCode] ?? r.countryName,
            currency: CURRENCY_MAP[r.countryCode] ?? r.countryCode,
            rate: r.rate,
            prev: r.previousRate,
            next: NEXT_MEETING[r.countryCode] ?? null,
          }))
        }
      } catch (e) {
      }

      // Fallback: direct BIS API
      return fetchBISDirect()
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=43200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch central bank rates' })
  }
}
