export type PanelId =
  | 'live-markets' | 'headlines' | 'forex' | 'fixed-income'
  | 'commodities' | 'crypto' | 'central-banks' | 'economic-data'
  | 'sector-heatmap' | 'market-radar' | 'correlation-engine'
  | 'ipos-earnings' | 'derivatives-news' | 'fintech-news'
  | 'regulation' | 'hedge-funds-news' | 'market-analysis-news'
  | 'btc-etf' | 'stablecoins'
  | 'geopolitics' | 'real-estate' | 'energy'
  | 'volatility' | 'bond-news' | 'predictions'
  | 'macro-signals' | 'world-clock'
  | 'daily-brief' | 'supply-chain'
  | 'watchlist' | 'ai-insights' | 'export'
  | 'market-video'
  | 'options-flow' | 'insider-trading' | 'earnings-calendar'
  | 'analyst-ratings' | 'fund-flows' | 'short-interest' | 'economic-calendar'
  | 'stock-analysis' | 'trade-policy'
  | 'fundamentals' | 'stock-screener'

export type PanelTier = 1 | 2 | 3

export interface PanelConfig {
  id: PanelId
  name: string
  tier: PanelTier
  enabled: boolean
  defaultWidth: number
  defaultHeight: number
  minWidth?: number
  minHeight?: number
}
