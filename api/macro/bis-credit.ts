import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const NAME_MAP: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', JP: 'Japan', XM: 'Euro Area',
  CH: 'Switzerland', SG: 'Singapore', IN: 'India', AU: 'Australia',
  CN: 'China', CA: 'Canada', KR: 'South Korea', BR: 'Brazil',
}

const BIS_COUNTRY_CODES = 'US+GB+JP+XM+CH+SG+IN+AU+CN+CA+KR+BR'

interface BisCreditEntry {
  countryCode: string
  countryName: string
  creditGdpRatio: number
  previousRatio: number
  date: string
}

function getStartPeriod(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 2)
  const q = Math.floor(d.getMonth() / 3) + 1
  return `${d.getFullYear()}-Q${q}`
}

async function fetchBisCredit(): Promise<BisCreditEntry[]> {
  const start = getStartPeriod()
  const url = `https://stats.bis.org/api/v1/data/WS_TC/Q.${BIS_COUNTRY_CODES}.C.A.M.770.A?startPeriod=${start}&detail=dataonly&format=csv`
  const r = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!r.ok) throw new Error(`BIS credit error: ${r.status}`)
  const text = await r.text()

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('TIME_PERIOD')) { headerIdx = i; break }
  }
  if (headerIdx === -1) throw new Error('BIS credit CSV header not found')

  const headers = lines[headerIdx].split(',').map(h => h.trim().replace(/"/g, ''))
  const refAreaIdx = headers.indexOf('REF_AREA')
  const borrowersIdx = headers.indexOf('BORROWERS_CTY')
  const timePeriodIdx = headers.indexOf('TIME_PERIOD')
  const obsValueIdx = headers.indexOf('OBS_VALUE')
  if (timePeriodIdx === -1 || obsValueIdx === -1) throw new Error('BIS credit CSV missing columns')
  if (refAreaIdx === -1 && borrowersIdx === -1) throw new Error('BIS credit CSV missing country column')

  const countryIdx = borrowersIdx !== -1 ? borrowersIdx : refAreaIdx

  const obs: Record<string, { period: string; value: number }[]> = {}
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''))
    const area = cols[countryIdx]
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
      return {
        countryCode: code,
        countryName: NAME_MAP[code]!,
        creditGdpRatio: parseFloat(last.value.toFixed(1)),
        previousRatio: prev ? parseFloat(prev.value.toFixed(1)) : parseFloat(last.value.toFixed(1)),
        date: last.period,
      }
    })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('bis-credit', 43_200_000, fetchBisCredit)
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch BIS credit data' })
  }
}
