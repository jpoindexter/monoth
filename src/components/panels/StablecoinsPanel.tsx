import { useState, useEffect } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { useNewsData } from '@/hooks/use-news-data'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'

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

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
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

function PegMonitor({ data }: { data: Stablecoin[] }) {
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
              <span className="text-[10px] font-medium text-foreground w-10 shrink-0">
                {coin.symbol.toUpperCase()}
              </span>
              <div className="flex items-center gap-px" style={{ width: 100 }}>
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

function DominanceChart({ data }: { data: Stablecoin[] }) {
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
      <div className="h-4 rounded-full overflow-hidden flex mb-3">
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
            <span className="text-[10px] font-medium text-foreground w-10">{seg.label}</span>
            <span className="text-[10px] tabular-nums text-muted-foreground flex-1">{fmtCap(seg.cap)}</span>
            <span className="text-[10px] tabular-nums font-medium text-foreground">
              {(seg.pct * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StablecoinsPanel() {
  const [tab, setTab] = useState<'data' | 'peg' | 'dominance' | 'news'>('data')
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
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'data')} onClick={() => setTab('data')}>Data</button>
        <button className={tabCls(tab === 'peg')} onClick={() => setTab('peg')}>Peg</button>
        <button className={tabCls(tab === 'dominance')} onClick={() => setTab('dominance')}>Dominance</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'data' && !loading && data != null && !data.length && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">
          No data available. Refreshes automatically.
        </div>
      )}

      {tab === 'data' && data && !!data.length && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Name</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">Peg</th>
              <th className="text-right font-medium pb-1.5">MCap</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((coin) => (
              <tr key={coin.id} className="border-t border-border/20">
                <td className="py-0.5">
                  <span className="font-medium text-foreground">{coin.symbol.toUpperCase()}</span>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'peg' && data && !!data.length && <PegMonitor data={data} />}
      {tab === 'peg' && (!data || !data.length) && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">No data available.</div>
      )}

      {tab === 'dominance' && data && !!data.length && <DominanceChart data={data} />}
      {tab === 'dominance' && (!data || !data.length) && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">No data available.</div>
      )}

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
                  <span className="text-[11px] font-medium leading-snug text-foreground line-clamp-2">
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
