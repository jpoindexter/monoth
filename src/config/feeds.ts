import type { FeedConfig } from '@/types'

const gn = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`

export const FEEDS: Record<string, FeedConfig[]> = {
  markets: [
    { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'markets' },
    { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/rss/topstories', category: 'markets' },
    { name: 'Seeking Alpha', url: 'https://seekingalpha.com/market_currents.xml', category: 'markets' },
    { name: 'Reuters Markets', url: gn('site:reuters.com markets stocks when:1d'), category: 'markets' },
    { name: 'Bloomberg Markets', url: gn('site:bloomberg.com markets when:1d'), category: 'markets' },
  ],
  crypto: [
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'crypto' },
    { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss', category: 'crypto' },
    { name: 'Crypto News', url: gn('bitcoin OR ethereum OR crypto when:1d'), category: 'crypto' },
  ],
  forex: [
    { name: 'Forex News', url: gn('"forex" OR "currency" OR "FX market" trading when:1d'), category: 'forex' },
    { name: 'Central Bank Rates', url: gn('"central bank" OR "interest rate" OR "rate decision" when:2d'), category: 'forex' },
  ],
  bonds: [
    { name: 'Bond Market', url: gn('"bond market" OR "treasury yields" OR "fixed income" when:2d'), category: 'bonds' },
  ],
  commodities: [
    { name: 'Oil & Gas', url: gn('oil price OR OPEC OR "crude oil" OR WTI OR Brent when:1d'), category: 'commodities' },
    { name: 'Gold & Metals', url: gn('gold price OR silver price OR copper OR "precious metals" when:2d'), category: 'commodities' },
  ],
  centralbanks: [
    { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml', category: 'centralbanks' },
    { name: 'ECB Watch', url: gn('"European Central Bank" OR ECB monetary policy when:3d'), category: 'centralbanks' },
    { name: 'Global Central Banks', url: gn('"rate hike" OR "rate cut" OR "interest rate decision" central bank when:3d'), category: 'centralbanks' },
  ],
  economic: [
    { name: 'Economic Data', url: gn('CPI OR inflation OR GDP OR "jobs report" OR PMI when:2d'), category: 'economic' },
    { name: 'Trade & Tariffs', url: gn('tariff OR "trade war" OR sanctions when:2d'), category: 'economic' },
  ],
  ipo: [
    { name: 'IPO News', url: gn('IPO OR "initial public offering" OR SPAC when:3d'), category: 'ipo' },
    { name: 'Earnings Reports', url: gn('"earnings report" OR "quarterly earnings" when:2d'), category: 'ipo' },
    { name: 'M&A News', url: gn('"merger" OR "acquisition" OR "takeover bid" billion when:3d'), category: 'ipo' },
  ],
  derivatives: [
    { name: 'Options Market', url: gn('"options market" OR "options trading" OR VIX when:2d'), category: 'derivatives' },
  ],
  fintech: [
    { name: 'Fintech News', url: gn('fintech OR "digital banking" OR neobank when:3d'), category: 'fintech' },
  ],
  regulation: [
    { name: 'SEC', url: 'https://www.sec.gov/news/pressreleases.rss', category: 'regulation' },
    { name: 'Financial Regulation', url: gn('SEC OR CFTC OR FINRA regulation OR enforcement when:3d'), category: 'regulation' },
  ],
  hedgefunds: [
    { name: 'Hedge Fund News', url: gn('"hedge fund" OR Bridgewater OR Citadel when:7d'), category: 'hedgefunds' },
    { name: 'Private Equity', url: gn('"private equity" OR Blackstone OR KKR when:3d'), category: 'hedgefunds' },
  ],
  analysis: [
    { name: 'Market Outlook', url: gn('"market outlook" OR "stock market forecast" when:3d'), category: 'analysis' },
    { name: 'Bank Research', url: gn('"Goldman Sachs" OR "JPMorgan" OR "Morgan Stanley" forecast when:3d'), category: 'analysis' },
  ],
}
