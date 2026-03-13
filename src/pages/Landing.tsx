import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STATS = [
  { label: '22 Panels', sub: 'dashboard widgets' },
  { label: '7 Data Sources', sub: 'live market feeds' },
  { label: '5 Asset Classes', sub: 'in a single view' },
  { label: 'Free Forever', sub: 'no credit card needed' },
]

const FEATURES = [
  {
    tag: 'CORRELATION',
    title: 'Correlation Engine',
    desc: 'See how CPI prints, rate decisions, and jobs data move markets across asset classes in real time.',
  },
  {
    tag: 'LIVE DATA',
    title: 'Real-Time Data',
    desc: 'Live prices from Finnhub, FRED, CoinGecko, and more. Streams update continuously, no refresh needed.',
  },
  {
    tag: 'EXPORT',
    title: 'Export Pipeline',
    desc: 'CSV, JSON, and API access for your trading bots. Pull exactly the data you need, when you need it.',
  },
  {
    tag: 'MULTI-ASSET',
    title: 'All Asset Classes',
    desc: 'Equities, crypto, forex, commodities, and fixed income all in one view. No tab-switching.',
  },
]

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    note: 'forever',
    highlight: false,
    features: [
      'All 22 panels',
      '5-15 min delayed data',
      'Bring your own AI key',
      '5 watchlist items',
      'CSV export',
    ],
  },
  {
    name: 'Pro',
    price: '$19',
    note: 'per month',
    highlight: true,
    features: [
      'Under 60s refresh',
      'AI included',
      'Unlimited watchlist',
      'Saved layouts',
      'Priority support',
    ],
  },
  {
    name: 'API',
    price: '$29',
    note: 'per month',
    highlight: false,
    features: [
      'REST endpoints',
      '1K-50K req/day',
      'JSON + webhooks',
      'API key management',
      'Usage dashboard',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Contact us',
    note: '',
    highlight: false,
    features: [
      'White-label deploy',
      'SSO / SAML',
      'Custom connectors',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
]

const SOURCES = ['Finnhub', 'FRED', 'CoinGecko', 'Frankfurter', 'Federal Reserve', 'SEC']

export function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 max-w-7xl mx-auto">
        <span className="font-mono text-sm font-semibold tracking-widest text-zinc-300 uppercase">Monoth</span>
        <Link to="/dashboard">
          <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            Dashboard
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20 max-w-4xl mx-auto">
        <div className="inline-block mb-6 px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-400 tracking-wider uppercase">
          Open Access Market Intelligence
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight mb-6">
          Free Market Intelligence<br />for Everyone
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          Real-time data across equities, crypto, forex, commodities, and bonds.
          No paywall.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/dashboard">
            <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-200 font-semibold px-8">
              Launch Dashboard
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 px-8">
              Learn More
            </Button>
          </a>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-zinc-800 bg-zinc-900">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-zinc-800">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center py-8 px-4 gap-1">
              <span className="font-mono text-2xl font-bold text-white">{s.label}</span>
              <span className="text-xs text-zinc-500 uppercase tracking-wide">{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest text-center mb-3">What you get</p>
        <h2 className="text-3xl font-bold text-center mb-14 text-white">Built for serious market watchers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-zinc-600 transition-colors">
              <div className="inline-block mb-4 px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-xs font-mono text-zinc-400 tracking-widest">
                {f.tag}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-zinc-900 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest text-center mb-3">Pricing</p>
          <h2 className="text-3xl font-bold text-center mb-14 text-white">Simple, transparent pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIERS.map((t) => (
              <Card
                key={t.name}
                className={`flex flex-col p-6 rounded-xl border ${
                  t.highlight
                    ? 'border-white bg-white text-zinc-900'
                    : 'border-zinc-700 bg-zinc-950 text-zinc-100'
                }`}
              >
                <div className="mb-4">
                  <p className={`text-xs font-mono uppercase tracking-widest mb-2 ${t.highlight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                    {t.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono">{t.price}</span>
                    {t.note && (
                      <span className={`text-xs ${t.highlight ? 'text-zinc-600' : 'text-zinc-500'}`}>{t.note}</span>
                    )}
                  </div>
                </div>
                <ul className="flex-1 space-y-2 mb-6">
                  {t.features.map((feat) => (
                    <li key={feat} className={`text-sm flex items-center gap-2 ${t.highlight ? 'text-zinc-700' : 'text-zinc-400'}`}>
                      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${t.highlight ? 'bg-zinc-500' : 'bg-zinc-600'}`} />
                      {feat}
                    </li>
                  ))}
                </ul>
                {t.name === 'Enterprise' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    Contact us
                  </Button>
                ) : t.highlight ? (
                  <Link to="/dashboard">
                    <Button size="sm" className="w-full bg-zinc-900 text-white hover:bg-zinc-800">
                      Get started
                    </Button>
                  </Link>
                ) : (
                  <Link to="/dashboard">
                    <Button size="sm" variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                      Get started
                    </Button>
                  </Link>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6">Data powered by</p>
        <div className="flex flex-wrap justify-center gap-3">
          {SOURCES.map((s) => (
            <Badge key={s} variant="outline" className="border-zinc-700 text-zinc-400 bg-zinc-900 font-mono text-xs px-3 py-1">
              {s}
            </Badge>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-zinc-800 bg-zinc-900 text-center px-6 py-20">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to start?</h2>
        <p className="text-zinc-400 mb-8">No account required. Just open the dashboard and go.</p>
        <Link to="/dashboard">
          <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-200 font-semibold px-10">
            Launch Dashboard
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8 text-center">
        <p className="text-xs text-zinc-600 font-mono">Monoth &mdash; Free market intelligence. Not financial advice.</p>
      </footer>
    </div>
  )
}
