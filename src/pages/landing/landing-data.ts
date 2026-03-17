export const MOCK_QUOTES = [
  { sym: 'SPY',  price: '544.23', chg: '+0.82%', up: true  },
  { sym: 'QQQ',  price: '445.67', chg: '+1.31%', up: true  },
  { sym: 'AAPL', price: '198.45', chg: '-0.34%', up: false },
  { sym: 'NVDA', price: '875.20', chg: '+2.18%', up: true  },
  { sym: 'MSFT', price: '412.88', chg: '+0.44%', up: true  },
  { sym: 'BTC',  price: '84,210', chg: '-1.03%', up: false },
]

export const MOCK_PREDICTIONS = [
  { title: 'No rate change in March?',  yes: 92, no: 8,  src: 'POLY'   },
  { title: 'Fed cuts rates in 2025?',   yes: 67, no: 33, src: 'KALSHI' },
  { title: 'BTC above $100K by June?',  yes: 41, no: 59, src: 'POLY'   },
]

export const MOCK_FUTURES = [
  { label: 'S&P 500', price: '5,441', chg: '+0.74%', up: true  },
  { label: 'Nasdaq',  price: '19,102',chg: '+0.91%', up: true  },
  { label: 'Crude',   price: '72.34', chg: '-0.43%', up: false },
  { label: 'Gold',    price: '3,142', chg: '+0.22%', up: true  },
  { label: 'VIX',     price: '18.42', chg: '-4.1%',  up: false },
]

export const DATA_SOURCES = [
  { name: 'Finnhub',       color: 'text-blue-400   border-blue-900   bg-blue-950/40'   },
  { name: 'CoinGecko',     color: 'text-green-400  border-green-900  bg-green-950/40'  },
  { name: 'FRED',          color: 'text-amber-400  border-amber-900  bg-amber-950/40'  },
  { name: 'Frankfurter',   color: 'text-purple-400 border-purple-900 bg-purple-950/40' },
  { name: 'Polymarket',    color: 'text-pink-400   border-pink-900   bg-pink-950/40'   },
  { name: 'Kalshi',        color: 'text-sky-400    border-sky-900    bg-sky-950/40'    },
  { name: 'Yahoo Finance', color: 'text-violet-400 border-violet-900 bg-violet-950/40' },
  { name: 'Google News',   color: 'text-red-400    border-red-900    bg-red-950/40'    },
  { name: 'Claude AI',     color: 'text-orange-400 border-orange-900 bg-orange-950/40' },
]

export const SETUP_STEPS = [
  { step: '01', cmd: 'git clone github.com/jpoindexter/monoth', label: 'Clone the repo'      },
  { step: '02', cmd: 'cp .env.example .env  # add your API keys',  label: 'Configure env vars' },
  { step: '03', cmd: 'npm install && npm run dev',                  label: 'Start the dashboard'},
]
