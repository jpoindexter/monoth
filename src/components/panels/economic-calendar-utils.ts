export type Impact = 'high' | 'medium' | 'low'

export interface EconEvent {
  id: string
  event: string
  country: string
  date: string
  time: string
  actual: string | null
  estimate: string | null
  previous: string | null
  impact: Impact
}

export function buildMockEvents(): EconEvent[] {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  function addDays(base: string, n: number): string {
    const d = new Date(base)
    d.setDate(d.getDate() + n)
    return d.toISOString().slice(0, 10)
  }

  const pastHour = now.getHours() > 9

  return [
    { id: 'cpi-1', event: 'CPI (YoY)', country: 'US', date: today, time: '08:30', actual: pastHour ? '3.2%' : null, estimate: '3.1%', previous: '3.4%', impact: 'high' },
    { id: 'claims-1', event: 'Initial Jobless Claims', country: 'US', date: today, time: '08:30', actual: pastHour ? '218K' : null, estimate: '222K', previous: '225K', impact: 'medium' },
    { id: 'ppi-1', event: 'PPI (MoM)', country: 'US', date: addDays(today, 1), time: '08:30', actual: null, estimate: '0.2%', previous: '0.3%', impact: 'medium' },
    { id: 'retail-1', event: 'Retail Sales (MoM)', country: 'US', date: addDays(today, 2), time: '08:30', actual: null, estimate: '0.4%', previous: '-0.1%', impact: 'high' },
    { id: 'indprod-1', event: 'Industrial Production', country: 'US', date: addDays(today, 2), time: '09:15', actual: null, estimate: '0.1%', previous: '0.0%', impact: 'medium' },
    { id: 'ecb-1', event: 'ECB Interest Rate Decision', country: 'EU', date: addDays(today, 3), time: '07:45', actual: null, estimate: '3.75%', previous: '4.00%', impact: 'high' },
    { id: 'housing-1', event: 'Housing Starts', country: 'US', date: addDays(today, 4), time: '08:30', actual: null, estimate: '1.38M', previous: '1.35M', impact: 'medium' },
    { id: 'fomc-1', event: 'FOMC Meeting Minutes', country: 'US', date: addDays(today, 5), time: '14:00', actual: null, estimate: null, previous: null, impact: 'high' },
    { id: 'nfp-1', event: 'Non-Farm Payrolls', country: 'US', date: addDays(today, 7), time: '08:30', actual: null, estimate: '185K', previous: '199K', impact: 'high' },
    { id: 'unemp-1', event: 'Unemployment Rate', country: 'US', date: addDays(today, 7), time: '08:30', actual: null, estimate: '3.8%', previous: '3.7%', impact: 'high' },
    { id: 'pce-1', event: 'Core PCE Price Index (YoY)', country: 'US', date: addDays(today, 8), time: '08:30', actual: null, estimate: '2.7%', previous: '2.9%', impact: 'high' },
    { id: 'ism-1', event: 'ISM Manufacturing PMI', country: 'US', date: addDays(today, 9), time: '10:00', actual: null, estimate: '49.8', previous: '49.1', impact: 'high' },
    { id: 'gdp-1', event: 'GDP Growth Rate (QoQ)', country: 'US', date: addDays(today, 10), time: '08:30', actual: null, estimate: '2.1%', previous: '2.8%', impact: 'high' },
    { id: 'conf-1', event: 'Consumer Confidence', country: 'US', date: addDays(today, 11), time: '10:00', actual: null, estimate: '102.5', previous: '99.8', impact: 'medium' },
    { id: 'boe-1', event: 'BoE Interest Rate Decision', country: 'UK', date: addDays(today, 12), time: '07:00', actual: null, estimate: '5.00%', previous: '5.25%', impact: 'high' },
    { id: 'fomc-rate', event: 'FOMC Rate Decision', country: 'US', date: addDays(today, 13), time: '14:00', actual: null, estimate: '5.25%', previous: '5.50%', impact: 'high' },
    { id: 'cpi-core', event: 'Core CPI (MoM)', country: 'US', date: addDays(today, 14), time: '08:30', actual: null, estimate: '0.3%', previous: '0.3%', impact: 'high' },
  ]
}

export const IMPACT_COLOR: Record<Impact, string> = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-muted-foreground',
}

export const IMPACT_BG: Record<Impact, string> = {
  high: 'bg-red-500/10',
  medium: 'bg-amber-500/10',
  low: 'bg-foreground/5',
}

export const IMPACT_DOT: Record<Impact, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-muted-foreground/40',
}

export function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10)
}

export function isWithinDays(dateStr: string, days: number): boolean {
  const now = Date.now()
  const target = new Date(dateStr + 'T00:00:00').getTime()
  return target >= now - 86_400_000 && target <= now + days * 86_400_000
}
