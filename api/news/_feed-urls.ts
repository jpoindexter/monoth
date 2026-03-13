const gn = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`

export const FEED_URLS: Record<string, { name: string; url: string }[]> = {
  markets: [
    { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
    { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/rss/topstories' },
    { name: 'Reuters Markets', url: gn('site:reuters.com markets stocks when:1d') },
    { name: 'Bloomberg Markets', url: gn('site:bloomberg.com markets when:1d') },
    { name: 'MarketWatch', url: gn('site:marketwatch.com when:1d') },
    { name: 'WSJ Markets', url: gn('site:wsj.com markets when:1d') },
    { name: 'FT Markets', url: gn('site:ft.com markets when:1d') },
  ],
  crypto: [
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
    { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
    { name: 'The Block', url: gn('site:theblock.co crypto when:1d') },
    { name: 'Crypto News', url: gn('bitcoin OR ethereum OR crypto when:1d') },
    { name: 'DeFi', url: gn('DeFi OR "decentralized finance" when:2d') },
  ],
  forex: [
    { name: 'Forex News', url: gn('"forex" OR "currency" OR "FX market" when:1d') },
    { name: 'Dollar', url: gn('"US dollar" OR "dollar index" OR DXY when:1d') },
    { name: 'Yen', url: gn('"Japanese yen" OR USDJPY when:2d') },
  ],
  bonds: [
    { name: 'Bond Market', url: gn('"bond market" OR "treasury yields" OR "fixed income" when:2d') },
    { name: 'Credit Markets', url: gn('"credit spread" OR "corporate bonds" OR "high yield" when:3d') },
  ],
  commodities: [
    { name: 'Oil & Gas', url: gn('oil price OR OPEC OR "crude oil" when:1d') },
    { name: 'Gold & Metals', url: gn('gold price OR silver price OR "precious metals" when:2d') },
    { name: 'Agriculture', url: gn('"wheat price" OR "corn price" OR "agriculture commodities" when:3d') },
  ],
  centralbanks: [
    { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml' },
    { name: 'ECB', url: gn('site:ecb.europa.eu OR "European Central Bank" when:7d') },
    { name: 'BOJ', url: gn('"Bank of Japan" OR BOJ when:7d') },
    { name: 'Global Central Banks', url: gn('"rate hike" OR "rate cut" OR "interest rate decision" when:3d') },
  ],
  economic: [
    { name: 'Economic Data', url: gn('CPI OR inflation OR GDP OR "jobs report" OR PMI when:2d') },
    { name: 'Labor Market', url: gn('"unemployment rate" OR "nonfarm payrolls" OR "jobless claims" when:3d') },
  ],
  ipo: [
    { name: 'IPO News', url: gn('IPO OR "initial public offering" OR SPAC when:3d') },
    { name: 'Earnings', url: gn('"earnings report" OR "quarterly earnings" when:2d') },
    { name: 'M&A', url: gn('"merger" OR "acquisition" OR "takeover" billion when:3d') },
  ],
  derivatives: [
    { name: 'Options Market', url: gn('"options market" OR "options trading" OR VIX when:2d') },
    { name: 'Futures', url: gn('"futures market" OR "futures trading" when:3d') },
  ],
  fintech: [
    { name: 'Fintech News', url: gn('fintech OR "digital banking" OR neobank when:3d') },
    { name: 'Trading Tech', url: gn('"algorithmic trading" OR "high frequency trading" OR "trading platform" when:7d') },
  ],
  regulation: [
    { name: 'SEC', url: 'https://www.sec.gov/news/pressreleases.rss' },
    { name: 'Financial Regulation', url: gn('SEC OR CFTC OR FINRA regulation when:3d') },
    { name: 'Trade Policy', url: gn('"trade policy" OR tariff OR "trade war" when:3d') },
  ],
  hedgefunds: [
    { name: 'Hedge Fund News', url: gn('"hedge fund" OR Bridgewater OR Citadel when:7d') },
    { name: 'Private Equity', url: gn('"private equity" OR Blackstone OR KKR when:7d') },
  ],
  analysis: [
    { name: 'Market Outlook', url: gn('"market outlook" OR "stock market forecast" when:3d') },
    { name: 'Research', url: gn('"bank research" OR "market research" OR "equity research" analyst when:3d') },
  ],
  btcetf: [
    { name: 'BTC ETF', url: gn('"bitcoin ETF" OR IBIT OR FBTC OR "spot bitcoin" when:3d') },
    { name: 'Crypto ETF', url: gn('"crypto ETF" OR "ethereum ETF" when:7d') },
  ],
  stablecoins: [
    { name: 'Stablecoin News', url: gn('USDT OR USDC OR stablecoin OR Tether when:7d') },
  ],
  geopolitics: [
    { name: 'Geopolitics', url: gn('"geopolitical risk" OR sanctions OR "trade tensions" when:3d') },
    { name: 'Middle East', url: gn('"Middle East" conflict OR Iran OR "oil supply" when:2d') },
    { name: 'China', url: gn('China economy OR "US China" OR trade when:2d') },
  ],
  realestate: [
    { name: 'Real Estate', url: gn('"real estate" OR "housing market" OR REIT OR mortgage when:3d') },
  ],
  energy: [
    { name: 'Energy', url: gn('"energy market" OR "natural gas" OR "renewable energy" OR nuclear when:3d') },
  ],
}
