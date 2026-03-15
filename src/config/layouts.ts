// All layouts use a fixed 3-column grid.
// Every consecutive group of panels must sum to exactly 3 columns to avoid gaps.
// Valid row patterns: [3], [2+1], [1+2], [1+1+1]
// Row heights: row:1 = ~180px, row:2 = ~360px
// Panels with matching row spans should be grouped together.

export interface LayoutPanel {
  id: string
  col: number  // 1, 2, or 3 (must sum to 3 per visual row)
  row: number  // 1 or 2
}

export interface LayoutConfig {
  id: string
  name: string
  panels: LayoutPanel[]
}

export const LAYOUTS: LayoutConfig[] = [
  {
    id: 'overview',
    name: 'Overview',
    panels: [
      // Row 1-2: video(2) + live markets(1)
      { id: 'market-video',        col: 2, row: 2 },
      { id: 'live-markets',        col: 1, row: 2 },
      // Row 3-4: headlines(2) + market radar(1)
      { id: 'headlines',           col: 2, row: 2 },
      { id: 'market-radar',        col: 1, row: 2 },
      // Row 5-6: sector heatmap(2) + central banks(1)
      { id: 'sector-heatmap',      col: 2, row: 2 },
      { id: 'central-banks',       col: 1, row: 2 },
      // Row 7: forex(2) + fixed income(1)
      { id: 'forex',               col: 2, row: 1 },
      { id: 'fixed-income',        col: 1, row: 1 },
      // Row 8: crypto(2) + commodities(1)
      { id: 'crypto',              col: 2, row: 1 },
      { id: 'commodities',         col: 1, row: 1 },
      // Row 9-10: economic data(2) + macro signals(1)
      { id: 'economic-data',       col: 2, row: 2 },
      { id: 'macro-signals',       col: 1, row: 2 },
      // Row 11-12: correlation engine(2) + world clock(1)
      { id: 'correlation-engine',  col: 2, row: 2 },
      { id: 'world-clock',         col: 1, row: 2 },
      // Row 13: daily brief(2) + geopolitics(1)
      { id: 'daily-brief',         col: 2, row: 1 },
      { id: 'geopolitics',         col: 1, row: 1 },
    ],
  },
  {
    id: 'markets',
    name: 'Markets',
    panels: [
      // Row 1-2: full-width live markets
      { id: 'live-markets',        col: 3, row: 2 },
      // Row 3-4: sector heatmap(2) + market radar(1)
      { id: 'sector-heatmap',      col: 2, row: 2 },
      { id: 'market-radar',        col: 1, row: 2 },
      // Row 5-6: forex(2) + fixed income(1)
      { id: 'forex',               col: 2, row: 2 },
      { id: 'fixed-income',        col: 1, row: 2 },
      // Row 7-8: crypto(2) + volatility(1)
      { id: 'crypto',              col: 2, row: 2 },
      { id: 'volatility',          col: 1, row: 2 },
      // Row 9-10: correlation engine(2) + commodities(1)
      { id: 'correlation-engine',  col: 2, row: 2 },
      { id: 'commodities',         col: 1, row: 2 },
      // Row 11: earnings calendar(2) + analyst ratings(1)
      { id: 'earnings-calendar',   col: 2, row: 1 },
      { id: 'analyst-ratings',     col: 1, row: 1 },
      // Row 12: ipos earnings(2) + insider trading(1)
      { id: 'ipos-earnings',       col: 2, row: 1 },
      { id: 'insider-trading',     col: 1, row: 1 },
      // Row 13-14: full-width stock screener
      { id: 'stock-screener',      col: 3, row: 2 },
      // Row 15-16: full-width options chain
      { id: 'options-chain',       col: 3, row: 2 },
    ],
  },
  {
    id: 'macro',
    name: 'Macro',
    panels: [
      // Row 1-2: full-width economic data
      { id: 'economic-data',       col: 3, row: 2 },
      // Row 3-4: central banks(2) + macro signals(1)
      { id: 'central-banks',       col: 2, row: 2 },
      { id: 'macro-signals',       col: 1, row: 2 },
      // Row 5-6: correlation engine(2) + market radar(1)
      { id: 'correlation-engine',  col: 2, row: 2 },
      { id: 'market-radar',        col: 1, row: 2 },
      // Row 7-8: fixed income(2) + forex(1)
      { id: 'fixed-income',        col: 2, row: 2 },
      { id: 'forex',               col: 1, row: 2 },
      // Row 9-10: world clock(2) + geopolitics(1)
      { id: 'world-clock',         col: 2, row: 2 },
      { id: 'geopolitics',         col: 1, row: 2 },
      // Row 11: daily brief(2) + regulation(1)
      { id: 'daily-brief',         col: 2, row: 1 },
      { id: 'regulation',          col: 1, row: 1 },
      // Row 12: commodities(2) + trade policy(1)
      { id: 'commodities',         col: 2, row: 1 },
      { id: 'trade-policy',        col: 1, row: 1 },
    ],
  },
  {
    id: 'crypto',
    name: 'Crypto',
    panels: [
      // Row 1-2: full-width crypto
      { id: 'crypto',              col: 3, row: 2 },
      // Row 3-4: btc etf(2) + stablecoins(1)
      { id: 'btc-etf',             col: 2, row: 2 },
      { id: 'stablecoins',         col: 1, row: 2 },
      // Row 5-6: ai insights(2) + market radar(1)
      { id: 'ai-insights',         col: 2, row: 2 },
      { id: 'market-radar',        col: 1, row: 2 },
      // Row 7: live markets(2) + fintech(1)
      { id: 'live-markets',        col: 2, row: 1 },
      { id: 'fintech-news',        col: 1, row: 1 },
      // Row 8: headlines(2) + geopolitics(1)
      { id: 'headlines',           col: 2, row: 1 },
      { id: 'geopolitics',         col: 1, row: 1 },
      // Row 9: daily brief(2) + regulation(1)
      { id: 'daily-brief',         col: 2, row: 1 },
      { id: 'regulation',          col: 1, row: 1 },
    ],
  },
  {
    id: 'news',
    name: 'News',
    panels: [
      // Row 1-2: full-width headlines
      { id: 'headlines',           col: 3, row: 2 },
      // Row 3-4: daily brief(2) + geopolitics(1)
      { id: 'daily-brief',         col: 2, row: 2 },
      { id: 'geopolitics',         col: 1, row: 2 },
      // Row 5-6: regulation(2) + market analysis(1)
      { id: 'regulation',          col: 2, row: 2 },
      { id: 'market-analysis-news', col: 1, row: 2 },
      // Row 7: trade policy(2) + supply chain(1)
      { id: 'trade-policy',        col: 2, row: 1 },
      { id: 'supply-chain',        col: 1, row: 1 },
      // Row 8: hedge funds(2) + derivatives(1)
      { id: 'hedge-funds-news',    col: 2, row: 1 },
      { id: 'derivatives-news',    col: 1, row: 1 },
      // Row 9: energy(2) + real estate(1)
      { id: 'energy',              col: 2, row: 1 },
      { id: 'real-estate',         col: 1, row: 1 },
      // Row 10: fintech(2) + bond markets(1)
      { id: 'fintech-news',        col: 2, row: 1 },
      { id: 'bond-news',           col: 1, row: 1 },
    ],
  },
  {
    id: 'video',
    name: 'Video',
    panels: [
      // Row 1-2: video(2) + headlines(1)
      { id: 'market-video',        col: 2, row: 2 },
      { id: 'headlines',           col: 1, row: 2 },
      // Row 3-4: live markets(2) + sector heatmap(1)
      { id: 'live-markets',        col: 2, row: 2 },
      { id: 'sector-heatmap',      col: 1, row: 2 },
      // Row 5: crypto(2) + daily brief(1)
      { id: 'crypto',              col: 2, row: 1 },
      { id: 'daily-brief',         col: 1, row: 1 },
    ],
  },
]
