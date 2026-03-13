export interface MarketDataPoint {
  symbol: string
  name?: string
  price: number
  change: number
  changePercent: number
  volume?: number
  timestamp: number
  source: string
}

export interface ForexRate {
  pair: string
  rate: number
  change: number
  changePercent: number
  timestamp: number
}

export interface CryptoAsset {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
  marketCap: number
  volume24h: number
  rank: number
}

export interface MacroSignal {
  indicator: string
  value: number
  previous: number
  expected?: number
  surprise?: number
  impact: 'high' | 'medium' | 'low'
  timestamp: number
  correlatedAssets?: string[]
}

export interface YieldData {
  maturity: string
  yield: number
  change: number
  timestamp: number
}
