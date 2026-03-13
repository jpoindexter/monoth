const REGION_PARAMS: Record<string, { hl: string; gl: string; ceid: string }> = {
  global: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
  americas: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
  europe: { hl: 'en-GB', gl: 'GB', ceid: 'GB:en' },
  asia: { hl: 'en-SG', gl: 'SG', ceid: 'SG:en' },
  mena: { hl: 'en-AE', gl: 'AE', ceid: 'AE:en' },
  latam: { hl: 'es-MX', gl: 'MX', ceid: 'MX:es' },
  africa: { hl: 'en-ZA', gl: 'ZA', ceid: 'ZA:en' },
  oceania: { hl: 'en-AU', gl: 'AU', ceid: 'AU:en' },
}

const gn = (query: string, region = 'global') => {
  const p = REGION_PARAMS[region] ?? REGION_PARAMS.global
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${p.hl}&gl=${p.gl}&ceid=${p.ceid}`
}

export function getFeedUrls(category: string, region = 'global'): { name: string; url: string }[] {
  const r = region
  const feeds: Record<string, { name: string; url: string }[]> = {
    markets: [
      { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
      { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/rss/topstories' },
      { name: 'Reuters Markets', url: gn('site:reuters.com markets stocks when:1d', r) },
      { name: 'Bloomberg Markets', url: gn('site:bloomberg.com markets when:1d', r) },
      { name: 'MarketWatch', url: gn('site:marketwatch.com when:1d', r) },
      { name: 'WSJ Markets', url: gn('site:wsj.com markets when:1d', r) },
      { name: 'FT Markets', url: gn('site:ft.com markets when:1d', r) },
    ],
    crypto: [
      { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
      { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
      { name: 'The Block', url: gn('site:theblock.co crypto when:1d', r) },
      { name: 'Crypto News', url: gn('bitcoin OR ethereum OR crypto when:1d', r) },
      { name: 'DeFi', url: gn('DeFi OR "decentralized finance" when:2d', r) },
    ],
    forex: [
      { name: 'Forex News', url: gn('"forex" OR "currency" OR "FX market" when:1d', r) },
      { name: 'Dollar', url: gn('"US dollar" OR "dollar index" OR DXY when:1d', r) },
      { name: 'Yen', url: gn('"Japanese yen" OR USDJPY when:2d', r) },
    ],
    bonds: [
      { name: 'Bond Market', url: gn('"bond market" OR "treasury yields" OR "fixed income" when:2d', r) },
      { name: 'Credit Markets', url: gn('"credit spread" OR "corporate bonds" OR "high yield" when:3d', r) },
    ],
    commodities: [
      { name: 'Oil & Gas', url: gn('oil price OR OPEC OR "crude oil" when:1d', r) },
      { name: 'Gold & Metals', url: gn('gold price OR silver price OR "precious metals" when:2d', r) },
      { name: 'Agriculture', url: gn('"wheat price" OR "corn price" OR "agriculture commodities" when:3d', r) },
    ],
    centralbanks: [
      { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml' },
      { name: 'ECB', url: gn('site:ecb.europa.eu OR "European Central Bank" when:7d', r) },
      { name: 'BOJ', url: gn('"Bank of Japan" OR BOJ when:7d', r) },
      { name: 'Global Central Banks', url: gn('"rate hike" OR "rate cut" OR "interest rate decision" when:3d', r) },
    ],
    economic: [
      { name: 'Economic Data', url: gn('CPI OR inflation OR GDP OR "jobs report" OR PMI when:2d', r) },
      { name: 'Labor Market', url: gn('"unemployment rate" OR "nonfarm payrolls" OR "jobless claims" when:3d', r) },
    ],
    ipo: [
      { name: 'IPO News', url: gn('IPO OR "initial public offering" OR SPAC when:3d', r) },
      { name: 'Earnings', url: gn('"earnings report" OR "quarterly earnings" when:2d', r) },
      { name: 'M&A', url: gn('"merger" OR "acquisition" OR "takeover" billion when:3d', r) },
    ],
    derivatives: [
      { name: 'Options Market', url: gn('"options market" OR "options trading" OR VIX when:2d', r) },
      { name: 'Futures', url: gn('"futures market" OR "futures trading" when:3d', r) },
    ],
    fintech: [
      { name: 'Fintech News', url: gn('fintech OR "digital banking" OR neobank when:3d', r) },
      { name: 'Trading Tech', url: gn('"algorithmic trading" OR "high frequency trading" OR "trading platform" when:7d', r) },
    ],
    regulation: [
      { name: 'SEC', url: 'https://www.sec.gov/news/pressreleases.rss' },
      { name: 'Financial Regulation', url: gn('SEC OR CFTC OR FINRA regulation when:3d', r) },
      { name: 'Trade Policy', url: gn('"trade policy" OR tariff OR "trade war" when:3d', r) },
    ],
    hedgefunds: [
      { name: 'Hedge Fund News', url: gn('"hedge fund" OR Bridgewater OR Citadel when:7d', r) },
      { name: 'Private Equity', url: gn('"private equity" OR Blackstone OR KKR when:7d', r) },
    ],
    analysis: [
      { name: 'Market Outlook', url: gn('"market outlook" OR "stock market forecast" when:3d', r) },
      { name: 'Research', url: gn('"bank research" OR "market research" OR "equity research" analyst when:3d', r) },
    ],
    btcetf: [
      { name: 'BTC ETF', url: gn('"bitcoin ETF" OR IBIT OR FBTC OR "spot bitcoin" when:3d', r) },
      { name: 'Crypto ETF', url: gn('"crypto ETF" OR "ethereum ETF" when:7d', r) },
    ],
    stablecoins: [
      { name: 'Stablecoin News', url: gn('USDT OR USDC OR stablecoin OR Tether when:7d', r) },
    ],
    geopolitics: [
      { name: 'Geopolitics', url: gn('"geopolitical risk" OR sanctions OR "trade tensions" when:3d', r) },
      { name: 'Middle East', url: gn('"Middle East" conflict OR Iran OR "oil supply" when:2d', r) },
      { name: 'China', url: gn('China economy OR "US China" OR trade when:2d', r) },
    ],
    realestate: [
      { name: 'Real Estate', url: gn('"real estate" OR "housing market" OR REIT OR mortgage when:3d', r) },
    ],
    energy: [
      { name: 'Energy', url: gn('"energy market" OR "natural gas" OR "renewable energy" OR nuclear when:3d', r) },
    ],
    supplychain: [
      { name: 'Supply Chain', url: gn('"supply chain" OR "shipping" OR "freight" when:3d', r) },
      { name: 'Semiconductors', url: gn('"chip shortage" OR semiconductor OR TSMC OR NVIDIA when:3d', r) },
      { name: 'Critical Minerals', url: gn('"rare earth" OR lithium OR "critical minerals" when:7d', r) },
    ],
  }
  return feeds[category] ?? []
}

export const CATEGORIES = [
  'markets', 'crypto', 'forex', 'bonds', 'commodities', 'centralbanks',
  'economic', 'ipo', 'derivatives', 'fintech', 'regulation', 'hedgefunds',
  'analysis', 'btcetf', 'stablecoins', 'geopolitics', 'realestate', 'energy', 'supplychain',
]
