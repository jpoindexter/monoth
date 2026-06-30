export interface CbRate {
  name: string
  currency: string
  rate: number | null
  prev: number | null
  next: string | null
}

export const FALLBACK_CENTRAL_BANKS: CbRate[] = [
  { name: 'Fed (US)', rate: 4.25, prev: 4.50, currency: 'USD', next: 'May 7' },
  { name: 'ECB (EU)', rate: 2.50, prev: 2.75, currency: 'EUR', next: 'Apr 17' },
  { name: 'BoE (UK)', rate: 4.50, prev: 4.75, currency: 'GBP', next: 'May 8' },
  { name: 'BoJ (Japan)', rate: 0.50, prev: 0.25, currency: 'JPY', next: 'Apr 30' },
  { name: 'PBoC (China)', rate: 3.10, prev: 3.10, currency: 'CNY', next: 'Apr 20' },
  { name: 'RBA (Australia)', rate: 4.10, prev: 4.35, currency: 'AUD', next: 'Apr 1' },
  { name: 'BoC (Canada)', rate: 2.75, prev: 3.00, currency: 'CAD', next: 'Apr 16' },
  { name: 'SNB (Swiss)', rate: 0.25, prev: 0.50, currency: 'CHF', next: 'Jun 19' },
]

export function daysUntil(dateStr: string): number {
  const now = new Date()
  const year = now.getFullYear()
  const target = new Date(`${dateStr} ${year}`)
  if (target < now) target.setFullYear(year + 1)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

export function direction(rate: number, prev: number): 'cut' | 'hold' | 'hike' {
  if (rate < prev) return 'cut'
  if (rate > prev) return 'hike'
  return 'hold'
}
