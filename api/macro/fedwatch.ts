import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const FRED_KEY = process.env.FRED_API_KEY ?? 'REDACTED'

interface MeetingProb {
  date: string
  label: string
  probabilities: { rate: string; prob: number }[]
}

interface FedWatchData {
  currentRate: { lower: number; upper: number }
  meetings: MeetingProb[]
}

async function fetchCurrentRateFRED(): Promise<{ lower: number; upper: number }> {
  const [upperRes, lowerRes] = await Promise.all([
    fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DFEDTARU&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=1`,
      { signal: AbortSignal.timeout(8_000) }
    ),
    fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DFEDTARL&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=1`,
      { signal: AbortSignal.timeout(8_000) }
    ),
  ])
  const upperJson = await upperRes.json() as { observations?: { value?: string }[] }
  const lowerJson = await lowerRes.json() as { observations?: { value?: string }[] }
  const upper = parseFloat(upperJson.observations?.[0]?.value ?? '0')
  const lower = parseFloat(lowerJson.observations?.[0]?.value ?? '0')
  return { upper, lower }
}

async function fetchRateHistoryFRED(): Promise<{ date: string; value: number }[]> {
  const res = await fetch(
    `https://api.stlouisfed.org/fred/series/observations?series_id=DFEDTARU&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=24`,
    { signal: AbortSignal.timeout(8_000) }
  )
  if (!res.ok) return []
  const json = await res.json() as { observations?: { date?: string; value?: string }[] }
  return (json.observations ?? [])
    .filter((o) => o.value && o.value !== '.')
    .map((o) => ({ date: o.date ?? '', value: parseFloat(o.value ?? '0') }))
    .reverse()
}

async function fetchCmeMeetings(): Promise<MeetingProb[]> {
  const res = await fetch('https://www.cmegroup.com/CmeWS/mvc/SFED/Rate', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html',
    },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`CME HTTP ${res.status}`)
  const json = await res.json() as {
    0?: {
      eventDate?: string
      probabilities?: { rate: string; probability: number }[]
    }[]
  }

  const meetings = json[0] ?? []
  return meetings.slice(0, 6).map((m) => {
    const dt = m.eventDate ?? ''
    const d = new Date(dt)
    const label = isNaN(d.getTime())
      ? dt
      : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const probs = (m.probabilities ?? []).map((p) => ({
      rate: p.rate,
      prob: Math.round(p.probability * 100) / 100,
    }))
    return { date: dt, label, probabilities: probs }
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data, stale } = await cached('fedwatch:v1', 3_600_000, async () => {
      const [currentRate, history, meetings] = await Promise.allSettled([
        fetchCurrentRateFRED(),
        fetchRateHistoryFRED(),
        fetchCmeMeetings(),
      ])

      const rate =
        currentRate.status === 'fulfilled'
          ? currentRate.value
          : { lower: 0, upper: 0 }

      const meetingsData =
        meetings.status === 'fulfilled' ? meetings.value : []

      const historyData =
        history.status === 'fulfilled' ? history.value : []

      return {
        currentRate: rate,
        meetings: meetingsData,
        rateHistory: historyData,
      } as FedWatchData & { rateHistory: { date: string; value: number }[] }
    })
    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch FedWatch data' })
  }
}
