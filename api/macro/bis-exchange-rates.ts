import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const NAME_MAP: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', JP: 'Japan', XM: 'Euro Area',
  CH: 'Switzerland', SG: 'Singapore', IN: 'India', AU: 'Australia',
  CN: 'China', CA: 'Canada', KR: 'South Korea', BR: 'Brazil',
}

const BIS_COUNTRY_CODES = 'US+GB+JP+XM+CH+SG+IN+AU+CN+CA+KR+BR'

interface BisExchangeRate {
  countryCode: string
  countryName: string
  realEer: number
  realChange: number
  date: string
}

function getStartPeriod(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 3)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

async function fetchBisEer(): Promise<BisExchangeRate[]> {
  const start = getStartPeriod()
  const url = `https://stats.bis.org/api/v1/data/WS_EER/M.R.B.${BIS_COUNTRY_CODES}?startPeriod=${start}&detail=dataonly&format=csv`
  const r = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!r.ok) throw new Error(`BIS EER error: ${r.status}`)
  const text = await r.text()

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('REF_AREA') && lines[i].includes('TIME_PERIOD')) { headerIdx = i; break }
  }
  if (headerIdx === -1) throw new Error('BIS EER CSV header not found')

  const headers = lines[headerIdx].split(',').map(h => h.trim().replace(/"/g, ''))
  const refAreaIdx = headers.indexOf('REF_AREA')
  const timePeriodIdx = headers.indexOf('TIME_PERIOD')
  const obsValueIdx = headers.indexOf('OBS_VALUE')
  if (refAreaIdx === -1 || timePeriodIdx === -1 || obsValueIdx === -1) throw new Error('BIS EER CSV missing columns')

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
    .filter(code => obs[code] && obs[code].length >= 1)
    .map(code => {
      const entries = (obs[code] ?? []).sort((a, b) => a.period.localeCompare(b.period))
      const last = entries[entries.length - 1]
      const prev = entries[entries.length - 2]
      const realChange = prev
        ? parseFloat((((last.value - prev.value) / prev.value) * 100).toFixed(1))
        : 0
      return {
        countryCode: code,
        countryName: NAME_MAP[code]!,
        realEer: last.value,
        realChange,
        date: last.period,
      }
    })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('bis-exchange-rates', 21_600_000, fetchBisEer)
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=43200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch BIS exchange rates' })
  }
}
