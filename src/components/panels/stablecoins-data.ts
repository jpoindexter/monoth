export interface Stablecoin {
  id: string
  symbol: string
  name: string
  price: number
  pegDeviation: number
  marketCap: number
  volume24h: number
}

export const DOMINANCE_COLORS: Record<string, string> = {
  USDT: '#26a17b',
  USDC: '#2775ca',
  DAI: '#f5ac37',
  FDUSD: '#0052ff',
  USDE: '#6366f1',
  Others: '#94a3b8',
}

export const KNOWN_ORDER = ['USDT', 'USDC', 'DAI', 'FDUSD', 'USDE']

export type ReserveSegmentType = 'tbills' | 'cash' | 'crypto' | 'rwa' | 'other'

export interface ReserveSegment {
  type: ReserveSegmentType
  pct: number
}

export interface ReserveEntry {
  symbol: string
  totalBn: number
  segments: ReserveSegment[]
}

export const RESERVES: ReserveEntry[] = [
  {
    symbol: 'USDT',
    totalBn: 110,
    segments: [
      { type: 'tbills', pct: 80 },
      { type: 'cash', pct: 10 },
      { type: 'other', pct: 10 },
    ],
  },
  {
    symbol: 'USDC',
    totalBn: 32,
    segments: [
      { type: 'tbills', pct: 85 },
      { type: 'cash', pct: 15 },
    ],
  },
  {
    symbol: 'DAI',
    totalBn: 5,
    segments: [
      { type: 'crypto', pct: 50 },
      { type: 'rwa', pct: 40 },
      { type: 'other', pct: 10 },
    ],
  },
  {
    symbol: 'BUSD',
    totalBn: 2,
    segments: [
      { type: 'tbills', pct: 95 },
      { type: 'cash', pct: 5 },
    ],
  },
]

export const RESERVE_COLORS: Record<ReserveSegmentType, string> = {
  tbills: '#0ea5e9',
  cash: '#10b981',
  crypto: '#f59e0b',
  rwa: '#8b5cf6',
  other: '#71717a',
}

export const RESERVE_LABELS: Record<ReserveSegmentType, string> = {
  tbills: 'T-Bills',
  cash: 'Cash',
  crypto: 'Crypto',
  rwa: 'RWA',
  other: 'Other',
}

export type RiskLevel = 'LOW' | 'MED' | 'HIGH'

export interface YieldEntry {
  protocol: string
  asset: string
  apy: number
  risk: RiskLevel
}

export const YIELDS: YieldEntry[] = [
  { protocol: 'Ethena', asset: 'sUSDe', apy: 12.5, risk: 'HIGH' },
  { protocol: 'MakerDAO', asset: 'DSR', apy: 5.0, risk: 'LOW' },
  { protocol: 'Aave', asset: 'USDT', apy: 4.2, risk: 'LOW' },
  { protocol: 'Aave', asset: 'USDC', apy: 3.8, risk: 'LOW' },
  { protocol: 'Compound', asset: 'USDT', apy: 3.5, risk: 'LOW' },
  { protocol: 'Curve', asset: '3pool', apy: 2.8, risk: 'MED' },
]

export const RISK_CLS: Record<RiskLevel, string> = {
  LOW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  MED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

export function fmtCap(num: number): string {
  if (num >= 1e12) return '$' + (num / 1e12).toFixed(1) + 'T'
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(1) + 'B'
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(1) + 'M'
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function pegColor(deviation: number): string {
  if (deviation < 0.001) return 'text-emerald-600'
  if (deviation < 0.005) return 'text-amber-500'
  return 'text-red-600'
}

export function reserveQualityScore(entry: ReserveEntry): number {
  const tbills = entry.segments.find((s) => s.type === 'tbills')
  return tbills ? tbills.pct : 0
}

export function qualityLabel(score: number): { label: string; cls: string } {
  if (score >= 80) return { label: 'AAA', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' }
  if (score >= 50) return { label: 'BBB', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' }
  return { label: 'C', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' }
}
