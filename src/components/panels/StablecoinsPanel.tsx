import { useState, useEffect } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime } from '@/lib/panel-utils'

function fmtCap(num: number): string {
  if (num >= 1e12) return '$' + (num / 1e12).toFixed(1) + 'T'
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(1) + 'B'
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(1) + 'M'
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function pegColor(deviation: number): string {
  if (deviation < 0.001) return 'text-emerald-600'
  if (deviation < 0.005) return 'text-yellow-500'
  return 'text-red-600'
}

interface Stablecoin {
  id: string
  symbol: string
  name: string
  price: number
  pegDeviation: number
  marketCap: number
  volume24h: number
}

const DOMINANCE_COLORS: Record<string, string> = {
  USDT: '#26a17b',
  USDC: '#2775ca',
  DAI: '#f5ac37',
  FDUSD: '#0052ff',
  USDE: '#6366f1',
  Others: '#94a3b8',
}

const KNOWN_ORDER = ['USDT', 'USDC', 'DAI', 'FDUSD', 'USDE']

// Reserve composition data
interface ReserveSegment {
  type: 'tbills' | 'cash' | 'crypto' | 'rwa' | 'other'
  pct: number
}

interface ReserveEntry {
  symbol: string
  totalBn: number
  segments: ReserveSegment[]
}

const RESERVES: ReserveEntry[] = [
  {
    symbol: 'USDT',
    totalBn: 110,
    segments: [
      { type: 'tbills', pct: 80 },
      { type: 'cash', pct: 10 },
      { type: 'other', pct: 10 },
    ],
  },
  {
    symbol: 'USDC',
    totalBn: 32,
    segments: [
      { type: 'tbills', pct: 85 },
      { type: 'cash', pct: 15 },
    ],
  },
  {
    symbol: 'DAI',
    totalBn: 5,
    segments: [
      { type: 'crypto', pct: 50 },
      { type: 'rwa', pct: 40 },
      { type: 'other', pct: 10 },
    ],
  },
  {
    symbol: 'BUSD',
    totalBn: 2,
    segments: [
      { type: 'tbills', pct: 95 },
      { type: 'cash', pct: 5 },
    ],
  },
]

const RESERVE_COLORS: Record<ReserveSegment['type'], string> = {
  tbills: '#0ea5e9',   // sky
  cash: '#10b981',     // emerald
  crypto: '#f59e0b',   // amber
  rwa: '#8b5cf6',      // violet
  other: '#71717a',    // zinc
}

const RESERVE_LABELS: Record<ReserveSegment['type'], string> = {
  tbills: 'T-Bills',
  cash: 'Cash',
  crypto: 'Crypto',
  rwa: 'RWA',
  other: 'Other',
}

function reserveQualityScore(entry: ReserveEntry): number {
  const tbills = entry.segments.find((s) => s.type === 'tbills')
  return tbills ? tbills.pct : 0
}

function qualityLabel(score: number): { label: string; cls: string } {
  if (score >= 80) return { label: 'AAA', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' }
  if (score >= 50) return { label: 'BBB', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' }
  return { label: 'C', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' }
}

function ReservesTab() {
  const overallScore = Math.round(
    RESERVES.reduce((s, r) => s + reserveQualityScore(r), 0) / RESERVES.length
  )
  const { label: overallLabel, cls: overallCls } = qualityLabel(overallScore)

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Reserve Quality Score</span>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${overallCls}`}>
          {overallLabel} — {overallScore}% T-Bills avg
        </span>
      </div>

      <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1">
        {(Object.keys(RESERVE_LABELS) as ReserveSegment['type'][]).map((type) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: RESERVE_COLORS[type] }} />
            <span className="text-[9px] text-muted-foreground">{RESERVE_LABELS[type]}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {RESERVES.map((entry) => {
          const score = reserveQualityScore(entry)
          const { label, cls } = qualityLabel(score)
          return (
            <div key={entry.symbol}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-foreground w-10">{entry.symbol}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">${entry.totalBn}B</span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-px rounded-full ${cls}`}>
                  {label}
                </span>
              </div>
              <div className="h-3 rounded-sm overflow-hidden flex">
                {entry.segments.map((seg) => (
                  <div
                    key={seg.type}
                    style={{ width: `${seg.pct}%`, backgroundColor: RESERVE_COLORS[seg.type] }}
                    title={`${RESERVE_LABELS[seg.type]}: ${seg.pct}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-2 mt-0.5">
                {entry.segments.map((seg) => (
                  <span key={seg.type} className="text-[9px] text-muted-foreground">
                    {RESERVE_LABELS[seg.type]} {seg.pct}%
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Yield data
type RiskLevel = 'LOW' | 'MED' | 'HIGH'

interface YieldEntry {
  protocol: string
  asset: string
  apy: number
  risk: RiskLevel
}

const YIELDS: YieldEntry[] = [
  { protocol: 'Ethena', asset: 'sUSDe', apy: 12.5, risk: 'HIGH' },
  { protocol: 'MakerDAO', asset: 'DSR', apy: 5.0, risk: 'LOW' },
  { protocol: 'Aave', asset: 'USDT', apy: 4.2, risk: 'LOW' },
  { protocol: 'Aave', asset: 'USDC', apy: 3.8, risk: 'LOW' },
  { protocol: 'Compound', asset: 'USDT', apy: 3.5, risk: 'LOW' },
  { protocol: 'Curve', asset: '3pool', apy: 2.8, risk: 'MED' },
]

const RISK_CLS: Record<RiskLevel, string> = {
  LOW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  MED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

function YieldTab() {
  const maxApy = Math.max(...YIELDS.map((y) => y.apy))

  return (
    <div className="space-y-2">
      {YIELDS.map((entry) => (
        <div key={`${entry.protocol}-${entry.asset}`}>
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-foreground">{entry.protocol}</span>
              <span className="text-[10px] text-muted-foreground">{entry.asset}</span>
              <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm ${RISK_CLS[entry.risk]}`}>
                {entry.risk}
              </span>
            </div>
            <span className="text-[10px] tabular-nums font-medium text-foreground">
              {entry.apy.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(entry.apy / maxApy) * 100}%`,
                backgroundColor: entry.risk === 'HIGH' ? '#ef4444' : entry.risk === 'MED' ? '#eab308' : '#10b981',
              }}
            />
          </div>
        </div>
      ))}
      <p className="text-[9px] text-muted-foreground pt-1">APY sorted descending. Rates indicative, not live.</p>
    </div>
  )
}

function PegMonitor({ data, expanded }: { data: Stablecoin[]; expanded: boolean }) {
  const avgDev = data.reduce((s, c) => s + c.pegDeviation, 0) / data.length
  const healthLabel = avgDev < 0.0005 ? 'STRONG' : avgDev < 0.002 ? 'MODERATE' : 'WEAK'
  const healthCls =
    avgDev < 0.0005
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
      : avgDev < 0.002
      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'

  return (
    <div>
      <div className="mb-3">
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${healthCls}`}>
          Peg Health: {healthLabel}
        </span>
      </div>
      <div className="space-y-2">
        {data.map((coin) => {
          const dev = coin.pegDeviation
          const barColor =
            dev < 0.001 ? '#10b981' : dev < 0.005 ? '#eab308' : '#ef4444'
          const above = coin.price >= 1.0
          const pct = Math.min(dev * 10000, 100)

          return (
            <div key={coin.id} className="flex items-center gap-2">
              <div className="shrink-0 w-10">
                <div className={`${expanded ? 'text-[12px]' : 'text-[10px]'} font-medium text-foreground`}>
                  {coin.symbol.toUpperCase()}
                </div>
                {expanded && <div className="text-[9px] text-muted-foreground">{coin.name}</div>}
              </div>
              <div className="flex items-center gap-px" style={{ width: expanded ? 160 : 100 }}>
                <div className="flex-1 flex justify-end" style={{ height: 8 }}>
                  {!above && (
                    <div
                      style={{
                        width: `${pct}%`,
                        backgroundColor: barColor,
                        borderRadius: '2px 0 0 2px',
                        height: '100%',
                      }}
                    />
                  )}
                </div>
                <div style={{ width: 1, backgroundColor: '#6b7280', height: 10, flexShrink: 0 }} />
                <div className="flex-1" style={{ height: 8 }}>
                  {above && (
                    <div
                      style={{
                        width: `${pct}%`,
                        backgroundColor: barColor,
                        borderRadius: '0 2px 2px 0',
                        height: '100%',
                      }}
                    />
                  )}
                </div>
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                ${coin.price.toFixed(4)}
              </span>
              <span className={`text-[10px] tabular-nums font-medium ${pegColor(dev)}`}>
                {above ? '+' : '-'}{(dev * 100).toFixed(3)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DominanceChart({ data, expanded }: { data: Stablecoin[]; expanded: boolean }) {
  const total = data.reduce((s, c) => s + c.marketCap, 0)
  const known = KNOWN_ORDER.map((sym) => data.find((c) => c.symbol.toUpperCase() === sym)).filter(Boolean) as Stablecoin[]
  const knownCap = known.reduce((s, c) => s + c.marketCap, 0)
  const othersCap = total - knownCap

  const segments = [
    ...known.map((c) => ({ label: c.symbol.toUpperCase(), cap: c.marketCap, pct: c.marketCap / total })),
    ...(othersCap > 0 ? [{ label: 'Others', cap: othersCap, pct: othersCap / total }] : []),
  ]

  return (
    <div>
      <div className={`${expanded ? 'h-6' : 'h-4'} rounded-full overflow-hidden flex mb-3`}>
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{
              width: `${seg.pct * 100}%`,
              backgroundColor: DOMINANCE_COLORS[seg.label] ?? '#94a3b8',
            }}
          />
        ))}
      </div>
      <div className="space-y-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: DOMINANCE_COLORS[seg.label] ?? '#94a3b8' }}
            />
            <span className={`${expanded ? 'text-[12px]' : 'text-[10px]'} font-medium text-foreground w-10`}>{seg.label}</span>
            <span className={`${expanded ? 'text-[12px]' : 'text-[10px]'} tabular-nums text-muted-foreground flex-1`}>{fmtCap(seg.cap)}</span>
            <span className={`${expanded ? 'text-[12px]' : 'text-[10px]'} tabular-nums font-medium text-foreground`}>
              {(seg.pct * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StablecoinsPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'data' | 'peg' | 'dominance' | 'reserves' | 'yield' | 'news'>('data')
  const { data, loading, error, refresh } = usePolling<Stablecoin[]>({
    fetcher: async () => {
      const res = await fetch('/api/crypto/stablecoins')
      if (!res.ok) throw new Error('Failed to fetch stablecoins')
      return res.json()
    },
    interval: 300_000,
  })
  const { data: newsData } = useNewsData('stablecoins')

  useEffect(() => {
    if (!loading && data != null && !data.length && tab === 'data') {
      setTab('news')
    }
  }, [loading, data, tab])

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Stablecoins" loading={loading} error={error} onRetry={refresh}>
      <div className="flex flex-wrap gap-1 mb-2">
        <button className={tabCls(tab === 'data')} onClick={() => setTab('data')}>Data</button>
        <button className={tabCls(tab === 'peg')} onClick={() => setTab('peg')}>Peg</button>
        <button className={tabCls(tab === 'dominance')} onClick={() => setTab('dominance')}>Dominance</button>
        <button className={tabCls(tab === 'reserves')} onClick={() => setTab('reserves')}>Reserves</button>
        <button className={tabCls(tab === 'yield')} onClick={() => setTab('yield')}>Yield</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'data' && !loading && data != null && !data.length && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">
          No data available. Refreshes automatically.
        </div>
      )}

      {tab === 'data' && data && !!data.length && (
        <table className={`w-full ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Name</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">Peg</th>
              <th className="text-right font-medium pb-1.5">MCap</th>
              {expanded && <th className="text-right font-medium pb-1.5">Vol 24h</th>}
            </tr>
          </thead>
          <tbody>
            {data?.map((coin) => (
              <tr key={coin.id} className="border-t border-border/20">
                <td className="py-0.5">
                  <div className="font-medium text-foreground">{coin.symbol.toUpperCase()}</div>
                  {expanded && <div className="text-[10px] text-muted-foreground">{coin.name}</div>}
                </td>
                <td className="text-right tabular-nums">
                  ${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </td>
                <td className={`text-right tabular-nums font-medium ${pegColor(coin.pegDeviation)}`}>
                  {(coin.pegDeviation * 100).toFixed(2)}%
                </td>
                <td className="text-right tabular-nums text-muted-foreground">
                  {fmtCap(coin.marketCap)}
                </td>
                {expanded && (
                  <td className="text-right tabular-nums text-muted-foreground">
                    {fmtCap(coin.volume24h)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'peg' && data && !!data.length && <PegMonitor data={data} expanded={expanded} />}
      {tab === 'peg' && (!data || !data.length) && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">No data available.</div>
      )}

      {tab === 'dominance' && data && !!data.length && <DominanceChart data={data} expanded={expanded} />}
      {tab === 'dominance' && (!data || !data.length) && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">No data available.</div>
      )}

      {tab === 'reserves' && <ReservesTab />}

      {tab === 'yield' && <YieldTab />}

      {tab === 'news' && (
        <div className="space-y-0">
          {newsData?.map((item) => {
            const cls = classifyHeadline(item.title)
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-1 px-1 rounded-sm transition-colors"
              >
                <div className="flex-1 min-w-0">
                  {cls && (
                    <span
                      className="inline-block text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                      style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}
                    >
                      {CATEGORY_LABELS[cls.category]}
                    </span>
                  )}
                  <span className={`text-[11px] font-medium leading-snug text-foreground ${expanded ? '' : 'line-clamp-2'}`}>
                    {item.title}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                  {relTime(item.published)}
                </span>
              </a>
            )
          })}
        </div>
      )}
    </PanelWrapper>
  )
}
