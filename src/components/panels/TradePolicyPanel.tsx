import { useState } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { relTime } from '@/lib/panel-utils'

const TARIFFS = [
  { pair: 'US → China', rate: 145, sector: 'Most Goods', status: 'Active', impact: 'Supply chain disruption, consumer prices' },
  { pair: 'China → US', rate: 125, sector: 'Most Goods', status: 'Active', impact: 'US ag exports, LNG, autos' },
  { pair: 'US → EU', rate: 20, sector: 'General', status: 'Paused', impact: 'Under negotiation, 90-day pause' },
  { pair: 'US Steel/Al', rate: 25, sector: 'Metals', status: 'Active', impact: 'Auto, construction cost inflation' },
  { pair: 'US → Canada', rate: 25, sector: 'General', status: 'Active', impact: 'USMCA renegotiation ongoing' },
  { pair: 'US → Mexico', rate: 25, sector: 'General', status: 'Active', impact: 'Auto supply chain, USMCA talks' },
  { pair: 'US → Japan', rate: 24, sector: 'General', status: 'Paused', impact: '90-day pause, bilateral talks' },
  { pair: 'US → Vietnam', rate: 46, sector: 'Electronics', status: 'Paused', impact: '90-day pause, supply chain shift' },
]

const RESTRICTIONS = [
  {
    measure: 'Semiconductor Export Controls',
    countries: 'US → China',
    sector: 'Technology',
    status: 'Active',
    detail: 'Advanced chips, EDA tools, chip manufacturing equipment. Entity list expanded 2024.',
  },
  {
    measure: 'Russian Energy Sanctions',
    countries: 'US/EU → Russia',
    sector: 'Energy',
    status: 'Active',
    detail: 'Oil price cap $60/bbl, gas import ban EU. SWIFT exclusions on major banks.',
  },
  {
    measure: 'China Rare Earth Controls',
    countries: 'China → Global',
    sector: 'Critical Minerals',
    status: 'Active',
    detail: 'Export licenses required for Ge, Ga, graphite, rare earths. 2023-2025 escalation.',
  },
  {
    measure: 'CHIPS Act Restrictions',
    countries: 'US → China',
    sector: 'Semiconductors',
    status: 'Active',
    detail: 'Recipients of CHIPS funding prohibited from expanding advanced capacity in China for 10 years.',
  },
  {
    measure: 'Huawei / ZTE Ban',
    countries: 'US → China',
    sector: 'Telecom',
    status: 'Active',
    detail: 'FCC ban on US networks. Export privileges revoked. Allied countries pressure ongoing.',
  },
  {
    measure: 'Russian Fin. Sanctions',
    countries: 'US/EU/UK → Russia',
    sector: 'Finance',
    status: 'Active',
    detail: 'SWIFT ban, asset freeze on central bank reserves (~$300B frozen).',
  },
]

function seededRand(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function dailySeed(): number {
  const d = new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

function jitter(base: number, range: number, seedOffset: number): number {
  const s = dailySeed() + seedOffset
  return base + (seededRand(s) - 0.5) * 2 * range
}

const FLOWS = [
  {
    label: 'US-China Trade Deficit',
    value: () => `$${(279 + jitter(0, 8, 1)).toFixed(0)}B`,
    sub: 'TTM',
    trend: 'up' as const,
    detail: 'Deficit widening despite tariffs; imports via Vietnam/Mexico up',
  },
  {
    label: 'US Total Exports',
    value: () => `$${(3.1 + jitter(0, 0.15, 2)).toFixed(2)}T`,
    sub: 'Ann.',
    trend: 'flat' as const,
    detail: 'Services +4% YoY; goods exports flat amid tariff uncertainty',
  },
  {
    label: 'US Total Imports',
    value: () => `$${(3.8 + jitter(0, 0.15, 3)).toFixed(2)}T`,
    sub: 'Ann.',
    trend: 'up' as const,
    detail: 'Pre-tariff frontloading drove Q1 surge; Q2 slowdown expected',
  },
  {
    label: 'US-Mexico Trade',
    value: () => `$${(803 + jitter(0, 20, 4)).toFixed(0)}B`,
    sub: 'Ann.',
    trend: 'up' as const,
    detail: 'Mexico surpassed China as top partner; nearshoring accelerating',
  },
  {
    label: 'US-Canada Trade',
    value: () => `$${(762 + jitter(0, 18, 5)).toFixed(0)}B`,
    sub: 'Ann.',
    trend: 'down' as const,
    detail: 'Tariffs dampening bilateral flows; energy still dominant',
  },
  {
    label: 'Global Trade Growth',
    value: () => `${(2.3 + jitter(0, 0.4, 6)).toFixed(1)}%`,
    sub: 'WTO Est.',
    trend: 'down' as const,
    detail: 'WTO revised down from 3.3%; tariff shock primary factor',
  },
]

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  Active:    { bg: '#ef4444', text: '#fff' },
  Paused:    { bg: '#f59e0b', text: '#000' },
  Proposed:  { bg: '#6366f1', text: '#fff' },
  Expired:   { bg: '#6b7280', text: '#fff' },
}

const TREND_COLOR = { up: '#ef4444', down: '#22c55e', flat: '#f59e0b' }
const TREND_ARROW = { up: '▲', down: '▼', flat: '→' }

export default function TradePolicyPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'tariffs' | 'restrictions' | 'flows' | 'news'>('tariffs')
  const { data: newsData, loading, error, refresh } = useNewsData('trade')

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const tariffRows = expanded ? TARIFFS : TARIFFS.slice(0, 5)
  const newsItems = expanded ? newsData : newsData?.slice(0, 8)

  return (
    <PanelWrapper title="Trade Policy" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'tariffs')} onClick={() => setTab('tariffs')}>Tariffs</button>
        <button className={tabCls(tab === 'restrictions')} onClick={() => setTab('restrictions')}>Restrictions</button>
        <button className={tabCls(tab === 'flows')} onClick={() => setTab('flows')}>Flows</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'tariffs' && (
        <div className="space-y-0">
          {expanded && (
            <div className="grid grid-cols-[auto_2rem_auto_3rem_auto] gap-x-2 pb-1 border-b border-border/30 mb-0.5">
              <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Pair</span>
              <span className="text-[8px] uppercase tracking-wider text-muted-foreground text-right tabular-nums">Rate</span>
              <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Sector</span>
              <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Status</span>
              <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Impact</span>
            </div>
          )}
          {tariffRows.map((t) => {
            const badge = STATUS_STYLE[t.status] ?? { bg: '#888', text: '#fff' }
            return (
              <div key={t.pair} className="py-1 border-b border-border/20 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-foreground w-28 shrink-0">{t.pair}</span>
                  <span className={`font-bold tabular-nums shrink-0 ${t.rate >= 100 ? 'text-red-500 text-[11px]' : t.rate >= 25 ? 'text-amber-500 text-[10px]' : 'text-yellow-400 text-[10px]'}`}>
                    {t.rate}%
                  </span>
                  <span className="text-[9px] text-muted-foreground shrink-0">{t.sector}</span>
                  <span className="ml-auto shrink-0">
                    <span className="text-[8px] font-bold uppercase px-1 py-px rounded-sm leading-none"
                      style={{ backgroundColor: badge.bg, color: badge.text }}>
                      {t.status}
                    </span>
                  </span>
                </div>
                {expanded && (
                  <div className="text-[9px] text-muted-foreground mt-0.5 pl-0">{t.impact}</div>
                )}
              </div>
            )
          })}
          {!expanded && (
            <div className="text-[9px] text-muted-foreground pt-1">{TARIFFS.length - tariffRows.length} more rows — expand panel</div>
          )}
        </div>
      )}

      {tab === 'restrictions' && (
        <div className="space-y-0">
          {RESTRICTIONS.map((r) => {
            const badge = STATUS_STYLE[r.status] ?? { bg: '#888', text: '#fff' }
            return (
              <div key={r.measure} className="py-1 border-b border-border/20 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-foreground">{r.measure}</span>
                      <span className="text-[8px] font-bold uppercase px-1 py-px rounded-sm leading-none shrink-0"
                        style={{ backgroundColor: badge.bg, color: badge.text }}>
                        {r.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-muted-foreground">{r.countries}</span>
                      <span className="text-[8px] text-muted-foreground/60">·</span>
                      <span className="text-[9px] text-muted-foreground">{r.sector}</span>
                    </div>
                    {expanded && (
                      <div className="text-[9px] text-muted-foreground/80 mt-0.5 italic">{r.detail}</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'flows' && (
        <div className="space-y-0">
          {FLOWS.map((f) => {
            const arrow = TREND_ARROW[f.trend]
            const color = TREND_COLOR[f.trend]
            const val = f.value()
            return (
              <div key={f.label} className="py-1 border-b border-border/20 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-foreground font-medium">{f.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold tabular-nums text-foreground">{val}</span>
                    <span className="text-[9px] text-muted-foreground">{f.sub}</span>
                    <span className="text-[10px] font-bold" style={{ color }}>{arrow}</span>
                  </div>
                </div>
                {expanded && (
                  <div className="text-[9px] text-muted-foreground mt-0.5">{f.detail}</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'news' && (
        <div className="space-y-0">
          {newsItems?.map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-1 px-1 rounded-sm transition-colors">
              <div className="flex-1 min-w-0">
                <span className={`font-medium leading-snug text-foreground ${expanded ? 'text-[13px]' : 'text-[11px] line-clamp-2'}`}>{item.title}</span>
                {item.source && (
                  <div className="text-[9px] text-muted-foreground mt-0.5">{item.source}</div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">{relTime(item.published)}</span>
            </a>
          ))}
          {!newsItems?.length && !loading && (
            <div className="text-[10px] text-muted-foreground py-2">No trade news available.</div>
          )}
        </div>
      )}
    </PanelWrapper>
  )
}
