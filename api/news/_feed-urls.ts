const gn = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`

export const FEED_URLS: Record<string, { name: string; url: string }[]> = {
  markets: [
    { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
    { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/rss/topstories' },
    { name: 'Reuters Markets', url: gn('site:reuters.com markets stocks when:1d') },
    { name: 'Bloomberg Markets', url: gn('site:bloomberg.com markets when:1d') },
  ],
  crypto: [
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
    { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
    { name: 'Crypto News', url: gn('bitcoin OR ethereum OR crypto when:1d') },
  ],
  forex: [
    { name: 'Forex News', url: gn('"forex" OR "currency" OR "FX market" when:1d') },
  ],
  bonds: [
    { name: 'Bond Market', url: gn('"bond market" OR "treasury yields" OR "fixed income" when:2d') },
  ],
  commodities: [
    { name: 'Oil & Gas', url: gn('oil price OR OPEC OR "crude oil" when:1d') },
    { name: 'Gold & Metals', url: gn('gold price OR silver price OR "precious metals" when:2d') },
  ],
  centralbanks: [
    { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml' },
    { name: 'Global Central Banks', url: gn('"rate hike" OR "rate cut" OR "interest rate decision" when:3d') },
  ],
  economic: [
    { name: 'Economic Data', url: gn('CPI OR inflation OR GDP OR "jobs report" OR PMI when:2d') },
  ],
  ipo: [
    { name: 'IPO News', url: gn('IPO OR "initial public offering" OR SPAC when:3d') },
    { name: 'Earnings', url: gn('"earnings report" OR "quarterly earnings" when:2d') },
    { name: 'M&A', url: gn('"merger" OR "acquisition" OR "takeover" billion when:3d') },
  ],
  derivatives: [
    { name: 'Options Market', url: gn('"options market" OR "options trading" OR VIX when:2d') },
  ],
  fintech: [
    { name: 'Fintech News', url: gn('fintech OR "digital banking" OR neobank when:3d') },
  ],
  regulation: [
    { name: 'SEC', url: 'https://www.sec.gov/news/pressreleases.rss' },
    { name: 'Financial Regulation', url: gn('SEC OR CFTC OR FINRA regulation when:3d') },
  ],
  hedgefunds: [
    { name: 'Hedge Fund News', url: gn('"hedge fund" OR Bridgewater OR Citadel when:7d') },
  ],
  analysis: [
    { name: 'Market Outlook', url: gn('"market outlook" OR "stock market forecast" when:3d') },
  ],
}
