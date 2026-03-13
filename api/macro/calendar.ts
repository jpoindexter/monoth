import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

interface EconEvent {
  event: string
  country: string
  date: string
  time: string
  impact: 'high' | 'medium' | 'low'
  actual: null
  estimate: null
  previous: null
  unit: string
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function firstFridayOfMonth(year: number, month: number): Date {
  const d = new Date(year, month, 1)
  const dow = d.getDay()
  const diff = dow <= 5 ? 5 - dow : 12 - dow
  d.setDate(1 + diff)
  return d
}

function firstBusinessDayOfMonth(year: number, month: number): Date {
  const d = new Date(year, month, 1)
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  return d
}

function nthDayOfMonth(year: number, month: number, targetDow: number, n: number): Date {
  const d = new Date(year, month, 1)
  let count = 0
  while (true) {
    if (d.getDay() === targetDow) {
      count++
      if (count === n) return d
    }
    d.setDate(d.getDate() + 1)
  }
}

function generateEvents(now: Date): EconEvent[] {
  const events: { date: Date; event: string; country: string; time: string; impact: 'high' | 'medium' | 'low'; unit: string }[] = []

  // Generate for this month and next two months to have enough coverage
  for (let mo = -1; mo <= 2; mo++) {
    const base = new Date(now.getFullYear(), now.getMonth() + mo, 1)
    const y = base.getFullYear()
    const m = base.getMonth()

    // NFP - first Friday
    events.push({ date: firstFridayOfMonth(y, m), event: 'Non-Farm Payrolls', country: 'US', time: '08:30', impact: 'high', unit: 'K' })

    // CPI - ~2nd Tuesday
    events.push({ date: nthDayOfMonth(y, m, 2, 2), event: 'CPI (YoY)', country: 'US', time: '08:30', impact: 'high', unit: '%' })

    // PPI - ~2nd Thursday
    events.push({ date: nthDayOfMonth(y, m, 4, 2), event: 'PPI (MoM)', country: 'US', time: '08:30', impact: 'medium', unit: '%' })

    // Retail Sales - ~2nd Wednesday
    events.push({ date: nthDayOfMonth(y, m, 3, 2), event: 'Retail Sales (MoM)', country: 'US', time: '08:30', impact: 'high', unit: '%' })

    // ISM Manufacturing - first business day
    events.push({ date: firstBusinessDayOfMonth(y, m), event: 'ISM Manufacturing PMI', country: 'US', time: '10:00', impact: 'medium', unit: '' })

    // Jobless Claims - every Thursday (first 4)
    for (let n = 1; n <= 4; n++) {
      events.push({ date: nthDayOfMonth(y, m, 4, n), event: 'Initial Jobless Claims', country: 'US', time: '08:30', impact: 'medium', unit: 'K' })
    }

    // PCE - end of month (last Friday)
    const lastDay = new Date(y, m + 1, 0)
    const lastFri = new Date(lastDay)
    while (lastFri.getDay() !== 5) lastFri.setDate(lastFri.getDate() - 1)
    events.push({ date: lastFri, event: 'Core PCE Price Index (YoY)', country: 'US', time: '08:30', impact: 'high', unit: '%' })

    // GDP - quarterly (Q1=Apr, Q2=Jul, Q3=Oct, Q4=Jan advance estimate)
    if ([0, 3, 6, 9].includes(m)) {
      events.push({ date: nthDayOfMonth(y, m, 4, 4), event: 'GDP Growth Rate (QoQ)', country: 'US', time: '08:30', impact: 'high', unit: '%' })
    }

    // FOMC - ~6 per year (Jan, Mar, May, Jun, Sep, Nov)
    if ([0, 2, 4, 5, 8, 10].includes(m)) {
      events.push({ date: nthDayOfMonth(y, m, 3, 3), event: 'FOMC Rate Decision', country: 'US', time: '14:00', impact: 'high', unit: '%' })
    }

    // Fed Chair Speech - ~monthly, 3rd Wednesday
    events.push({ date: nthDayOfMonth(y, m, 3, 3), event: 'Fed Chair Speech', country: 'US', time: '10:00', impact: 'medium', unit: '' })

    // ECB Rate Decision - ~6 per year (Jan, Mar, Apr, Jun, Sep, Oct)
    if ([0, 2, 3, 5, 8, 9].includes(m)) {
      events.push({ date: nthDayOfMonth(y, m, 4, 2), event: 'ECB Interest Rate Decision', country: 'EU', time: '07:45', impact: 'high', unit: '%' })
    }

    // BOE Rate Decision - ~8 per year
    if ([0, 1, 2, 4, 5, 7, 8, 10].includes(m)) {
      events.push({ date: nthDayOfMonth(y, m, 4, 1), event: 'BoE Interest Rate Decision', country: 'GB', time: '07:00', impact: 'high', unit: '%' })
    }

    // UK CPI - 2nd Wednesday
    events.push({ date: nthDayOfMonth(y, m, 3, 2), event: 'UK CPI (YoY)', country: 'GB', time: '07:00', impact: 'medium', unit: '%' })

    // EU CPI - 3rd Friday
    events.push({ date: nthDayOfMonth(y, m, 5, 3), event: 'EU CPI (YoY)', country: 'EU', time: '10:00', impact: 'medium', unit: '%' })
  }

  const todayStr = fmt(now)
  const cutoff = fmt(addDays(now, 14))

  const upcoming = events
    .filter((e) => fmt(e.date) >= todayStr && fmt(e.date) <= cutoff)
    .sort((a, b) => fmt(a.date).localeCompare(fmt(b.date)) || a.time.localeCompare(b.time))

  // Deduplicate by date+event
  const seen = new Set<string>()
  const deduped = upcoming.filter((e) => {
    const key = `${fmt(e.date)}|${e.event}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return deduped.slice(0, 10).map((e) => ({
    event: e.event,
    country: e.country,
    date: fmt(e.date),
    time: e.time,
    impact: e.impact,
    actual: null,
    estimate: null,
    previous: null,
    unit: e.unit,
  }))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const { data, stale } = await cached('macro:calendar', 3_600_000, async () => {
    return generateEvents(new Date())
  })

  if (stale) res.setHeader('X-Cache', 'STALE')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
  res.json(data)
}
