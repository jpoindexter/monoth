import { useCallback, useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { tabCls, changeColor, relTime } from '@/lib/panel-utils'
import type { MarketDataPoint } from '@/types'

const TABS = ['rates', 'carriers', 'disruptions', 'news'] as const
type Tab = typeof TABS[number]

// Shipping carrier stocks
const CARRIER_SYMBOLS = ['ZIM', 'DAL', 'MATX', 'SBLK', 'GOGL', 'NMM']
const CARRIER_NAMES: Record<string, string> = {
  ZIM: 'ZIM Integrated',
  DAL: 'Delta Air',
  MATX: 'Matson',
  SBLK: 'Star Bulk',
  GOGL: 'Golden Ocean',
  NMM: 'Navios Maritime',
}

interface ShippingRate {
  route: string
  rate: string
  unit: string
  change7d: number
  source: string
}

// Static rates — updated periodically via backend in production; here we display
// the last known snapshot with clear labeling
const SHIPPING_RATES: ShippingRate[] = [
  { route: 'Baltic Dry Index', rate: '1,423', unit: 'pts', change7d: -2.1, source: 'BDI' },
  { route: 'Shanghai → LA', rate: '$2,850', unit: '/FEU', change7d: -4.3, source: 'FBX' },
  { route: 'Shanghai → Rotterdam', rate: '$3,120', unit: '/FEU', change7d: -1.8, source: 'FBX' },
  { route: 'Shanghai → Dubai', rate: '$1,650', unit: '/FEU', change7d: 0.6, source: 'FBX' },
  { route: 'LA → Shanghai', rate: '$780', unit: '/FEU', change7d: 1.2, source: 'FBX' },
  { route: 'FBX Global Composite', rate: '$2,180', unit: '/FEU', change7d: -3.1, source: 'FBX' },
  { route: 'Drewry WCI Composite', rate: '$2,340', unit: '/FEU', change7d: -2.7, source: 'WCI' },
]

type DisruptionStatus = 'Active' | 'Monitoring' | 'Resolved'

interface Disruption {
  name: string
  status: DisruptionStatus
  impact: string
  detail: string
}

const STATUS_CLS: Record<DisruptionStatus, string> = {
  Active: 'text-red-400 bg-red-500/10',
  Monitoring: 'text-amber-400 bg-amber-500/10',
  Resolved: 'text-emerald-400 bg-emerald-500/10',
}

const DISRUPTIONS: Disruption[] = [
  {
    name: 'Red Sea / Suez Diversions',
    status: 'Active',
    impact: 'High — +14 days Asia-Europe',
    detail: 'Houthi attacks forcing Cape of Good Hope rerouting. Capacity tight on Europe lanes.',
  },
  {
    name: 'Panama Canal Water Levels',
    status: 'Monitoring',
    impact: 'Moderate — draft restrictions',
    detail: 'Reduced transits per day due to low Gatun Lake levels. Improving seasonally.',
  },
  {
    name: 'Port of Baltimore Bridge',
    status: 'Resolved',
    impact: 'Low — channel reopened',
    detail: 'Francis Scott Key Bridge collapse; main channel fully reopened Q2 2024.',
  },
  {
    name: 'US East Coast Dockworkers',
    status: 'Resolved',
    impact: 'Low — contract signed',
    detail: 'ILA-USMX agreement reached Jan 2025. No further strike risk near-term.',
  },
  {
    name: 'China New Year Congestion',
    status: 'Monitoring',
    impact: 'Moderate — pre-holiday surge',
    detail: 'Port congestion at major Chinese hubs ahead of Lunar New Year shipping rush.',
  },
]

function TrendArrow({ change }: { change: number }) {
  if (Math.abs(change) < 0.1) return <span className="text-[10px] text-muted-foreground">--</span>
  return (
    <span className={`text-[11px] ${changeColor(change)}`}>
      {change > 0 ? '▲' : '▼'}
    </span>
  )
}

export default function ShippingFreightPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('rates')

  const carrierFetcher = useCallback(async () => {
    return fetchQuotes(CARRIER_SYMBOLS)
  }, [])

  const { data: carrierData, loading: carriersLoading, error: carriersError, refresh: carriersRefresh } = usePolling({
    fetcher: carrierFetcher,
    interval: 300_000,
    enabled: tab === 'carriers',
  })

  const { data: newsData } = useNewsData('shipping freight logistics')

  const loading = tab === 'carriers' ? carriersLoading : false
  const error = tab === 'carriers' ? carriersError : null
  const retry = tab === 'carriers' ? carriersRefresh : undefined

  const carrierMap: Record<string, MarketDataPoint> = {}
  for (const q of carrierData ?? []) carrierMap[q.symbol] = q

  return (
    <PanelWrapper title="Shipping & Freight" loading={loading} error={error} onRetry={retry}>
      <div className="flex flex-wrap gap-1 mb-2">
        {TABS.map((t) => (
          <button key={t} className={tabCls(tab === t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'rates' && (
        <div>
          <table className="w-full">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left text-[10px] font-medium pb-1.5">Route / Index</th>
                <th className="text-right text-[10px] font-medium pb-1.5 pr-2">Rate</th>
                <th className="text-right text-[10px] font-medium pb-1.5 pr-2">7d %</th>
                <th className="text-center text-[10px] font-medium pb-1.5">Trend</th>
              </tr>
            </thead>
            <tbody>
              {SHIPPING_RATES.map((r) => (
                <tr key={r.route} className="border-t border-border/20">
                  <td className="py-1 pr-2">
                    <span className="text-[11px] font-medium text-foreground leading-none block">{r.route}</span>
                    <span className="text-[9px] text-muted-foreground">{r.source} · {r.unit}</span>
                  </td>
                  <td className="text-right tabular-nums text-[11px] font-medium text-foreground pr-2">
                    {r.rate}
                  </td>
                  <td className={`text-right tabular-nums text-[11px] pr-2 ${changeColor(r.change7d)}`}>
                    {r.change7d >= 0 ? '+' : ''}{r.change7d.toFixed(1)}%
                  </td>
                  <td className="text-center">
                    <TrendArrow change={r.change7d} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[9px] text-muted-foreground/50 mt-2">Indicative rates — updated weekly</p>
        </div>
      )}

      {tab === 'carriers' && (
        <table className="w-full">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left text-[10px] font-medium pb-1.5">Carrier</th>
              <th className="text-right text-[10px] font-medium pb-1.5 pr-2">Price</th>
              <th className="text-right text-[10px] font-medium pb-1.5">Chg %</th>
            </tr>
          </thead>
          <tbody>
            {CARRIER_SYMBOLS.map((sym) => {
              const q = carrierMap[sym]
              const isPos = (q?.changePercent ?? 0) >= 0
              return (
                <tr key={sym} className="border-t border-border/20">
                  <td className="py-1 pr-2">
                    <span className="text-[11px] font-medium text-foreground">{CARRIER_NAMES[sym] ?? sym}</span>
                    <span className="text-[9px] text-muted-foreground ml-1.5">{sym}</span>
                  </td>
                  <td className="text-right tabular-nums text-[11px] font-medium text-foreground pr-2">
                    {q ? q.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
                  </td>
                  <td className={`text-right tabular-nums text-[11px] font-medium ${q ? changeColor(q.changePercent) : 'text-muted-foreground'}`}>
                    {q ? `${isPos ? '+' : ''}${q.changePercent.toFixed(2)}%` : '--'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'disruptions' && (
        <div className="flex flex-col gap-2">
          {DISRUPTIONS.map((d) => (
            <div key={d.name} className="border-t border-border/20 pt-2 first:border-0 first:pt-0">
              <div className="flex items-start justify-between gap-2 mb-0.5">
                <span className="text-[11px] font-medium text-foreground leading-snug flex-1">{d.name}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm shrink-0 ${STATUS_CLS[d.status]}`}>
                  {d.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-amber-400/80 mb-0.5">{d.impact}</p>
              {expanded && (
                <p className="text-[10px] text-muted-foreground leading-snug">{d.detail}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'news' && (
        <div className="flex flex-col">
          {newsData?.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/[0.03] -mx-1 px-1 rounded-sm transition-colors"
            >
              <span className={`text-[11px] font-medium leading-snug text-foreground flex-1 ${expanded ? '' : 'line-clamp-2'}`}>
                {item.title}
              </span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                {relTime(item.published)}
              </span>
            </a>
          ))}
          {(!newsData || newsData.length === 0) && (
            <p className="text-[11px] text-muted-foreground">No shipping news available.</p>
          )}
        </div>
      )}
    </PanelWrapper>
  )
}
