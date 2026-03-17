export type Range = '1W' | '1M' | '3M' | '6M' | '1Y'
export type Tab = 'overview' | 'chart' | 'technical' | 'analyst' | 'fundamentals' | 'news'

export const RANGE_DAYS: Record<Range, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }

export const TA_OVERALL: Record<string, { label: string; cls: string }> = {
  strong_buy: { label: 'STRONG BUY', cls: 'text-emerald-400' },
  buy: { label: 'BUY', cls: 'text-emerald-500' },
  neutral: { label: 'NEUTRAL', cls: 'text-amber-400' },
  sell: { label: 'SELL', cls: 'text-red-500' },
  strong_sell: { label: 'STRONG SELL', cls: 'text-red-400' },
}

export const ACTION_LABELS: Record<string, string> = {
  up: 'Upgrade',
  down: 'Downgrade',
  init: 'Initiated',
  reit: 'Reiterated',
}

export const ACTION_CLS: Record<string, string> = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  init: 'text-amber-400',
  reit: 'text-muted-foreground',
}

export function fmtBig(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  return '$' + n.toLocaleString()
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—'
  return (n * 100).toFixed(1) + '%'
}

export function fmtNum(n: number | null | undefined, digits = 2): string {
  if (n == null) return '—'
  return n.toFixed(digits)
}

export const LS_KEY = 'ta-watchlist'

export function loadWatchlist(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}

export function saveWatchlist(list: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}
