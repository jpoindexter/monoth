import { useState, useCallback, useEffect } from 'react'
import { useCryptoData } from '@/hooks/use-crypto-data'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { Sparkline } from '@/components/charts/Sparkline'

function fmtCap(num: number): string {
  if (num >= 1e12) return '$' + (num / 1e12).toFixed(1) + 'T'
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(1) + 'B'
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(1) + 'M'
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function getPegColor(deviation: number): string {
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

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: 'bg-blue-500', BSC: 'bg-yellow-500', Arbitrum: 'bg-sky-400',
  Solana: 'bg-purple-500', Polygon: 'bg-violet-500', Avalanche: 'bg-red-500',
  Optimism: 'bg-red-400', Base: 'bg-blue-400',
}

export default function CryptoPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'top15' | 'stables' | 'chart' | 'defi' | 'dominance'>('top15')
  const [chartData, setChartData] = useState<{ time: string; value: number }[]>([])
  const { data, loading, error, refresh } = useCryptoData()
  const { data: defiData, loading: defiLoading } = usePolling<{
    protocols: { name: string; tvl: number; change24h: number | null; category: string }[]
    chains: { name: string; tvl: number; pct: number }[]
  }>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/crypto/defi')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 300_000,
    enabled: tab === 'defi',
  })

  const { data: fearGreedData } = usePolling<{
    fearGreed: { value: number; classification: string; history: { value: number; classification: string; date: string }[] }
    dominance: { btc: number; eth: number; stable: number; other: number }
  }>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/crypto/fear-greed')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }, []),
    interval: 300_000,
    enabled: tab === 'dominance',
  })

  const { data: stableData, loading: stableLoading } = usePolling<Stablecoin[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/crypto/stablecoins')
      if (!res.ok) throw new Error('Failed to fetch stablecoins')
      return res.json()
    }, []),
    interval: 300_000,
    enabled: tab === 'stables',
  })

  useEffect(() => {
    if (tab === 'chart') {
      fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=90')
        .then(r => r.json())
        .then(json => {
          const points = json.prices?.map(([ts, price]: [number, number]) => ({
            time: new Date(ts).toISOString().slice(0, 10),
            value: price,
          })) ?? []
          const seen = new Map<string, { time: string; value: number }>()
          for (const p of points) seen.set(p.time, p)
          setChartData(Array.from(seen.values()))
        })
        .catch(() => {})
    }
  }, [tab])

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Crypto" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'top15')} onClick={() => setTab('top15')}>Top 15</button>
        <button className={tabCls(tab === 'stables')} onClick={() => setTab('stables')}>Stables</button>
        <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
        <button className={tabCls(tab === 'defi')} onClick={() => setTab('defi')}>DeFi</button>
        <button className={tabCls(tab === 'dominance')} onClick={() => setTab('dominance')}>Dominance</button>
      </div>

      {tab === 'chart' && (
        <LightweightChart
          type="area"
          data={chartData}
          height={expanded ? 300 : 160}
          lineColor="#f59e0b"
          areaTopColor="rgba(245, 158, 11, 0.2)"
          areaBottomColor="rgba(245, 158, 11, 0.02)"
        />
      )}

      {tab === 'top15' && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">#</th>
              <th className="text-left font-medium pb-1.5">Name</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">7d</th>
              <th className="text-right font-medium pb-1.5">24h</th>
              <th className="text-right font-medium pb-1.5">MCap</th>
            </tr>
          </thead>
          <tbody>
            {data?.slice(0, expanded ? undefined : 15).map((c) => {
              const isPositive = c.changePercent24h >= 0
              return (
                <tr key={c.id} className="border-t border-border/20">
                  <td className="py-0.5 text-muted-foreground">{c.rank}</td>
                  <td className="py-0.5">
                    <span className="font-medium text-foreground">{c.symbol.toUpperCase()}</span>
                  </td>
                  <td className="text-right tabular-nums">
                    ${c.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end">
                      <Sparkline data={c.sparkline ?? []} />
                    </div>
                  </td>
                  <td className={`text-right tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{c.changePercent24h.toFixed(2)}%
                  </td>
                  <td className="text-right tabular-nums text-muted-foreground">
                    {fmtCap(c.marketCap)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'stables' && stableLoading && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
      )}

      {tab === 'stables' && stableData && (
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
            {stableData.map((coin) => (
              <tr key={coin.id} className="border-t border-border/20">
                <td className="py-0.5">
                  <span className="font-medium text-foreground">{coin.symbol}</span>
                </td>
                <td className="text-right tabular-nums">
                  ${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </td>
                <td className={`text-right tabular-nums font-medium ${getPegColor(coin.pegDeviation)}`}>
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
      {tab === 'defi' && defiLoading && (
        <div className="py-4 text-center text-[10px] text-muted-foreground">Loading...</div>
      )}
      {tab === 'defi' && !defiLoading && defiData && (() => {
        const protocols = defiData.protocols
        const chains = defiData.chains.slice(0, 5)
        const maxTvl = Math.max(...protocols.map(p => p.tvl), 1)
        const totalTvl = protocols.reduce((s, p) => s + p.tvl, 0)
        return (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total DeFi TVL</span>
              <span className="text-[11px] font-semibold tabular-nums">${(totalTvl / 1e9).toFixed(1)}B</span>
            </div>

            <div className="space-y-0.5">
              <div className="flex gap-1 text-[10px] text-muted-foreground mb-1 flex-wrap">
                {chains.map(c => (
                  <span key={c.name} className="flex items-center gap-0.5">
                    <span className={`inline-block w-1.5 h-1.5 rounded-sm ${CHAIN_COLORS[c.name] ?? 'bg-zinc-500'}`} />
                    {c.name} {c.pct}%
                  </span>
                ))}
              </div>
              <div className="flex h-1.5 w-full rounded-sm overflow-hidden">
                {chains.map(c => (
                  <div key={c.name} className={`${CHAIN_COLORS[c.name] ?? 'bg-zinc-500'} h-full`} style={{ width: `${c.pct}%` }} />
                ))}
              </div>
            </div>

            <div className="space-y-0.5 pt-1">
              {protocols.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="text-[10px] w-20 shrink-0 text-foreground truncate">{p.name}</span>
                  <div className="flex-1 h-1 bg-border/30 rounded-sm overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-sm" style={{ width: `${(p.tvl / maxTvl) * 100}%` }} />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground w-14 text-right">
                    ${(p.tvl / 1e9).toFixed(1)}B
                    {p.change24h != null && (
                      <span className={p.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}> {p.change24h >= 0 ? '+' : ''}{p.change24h.toFixed(1)}%</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {tab === 'dominance' && (() => {
        const dom = fearGreedData?.dominance
        const fg = fearGreedData?.fearGreed
        const btcPct    = dom?.btc    ?? 0
        const ethPct    = dom?.eth    ?? 0
        const stablePct = dom?.stable ?? 0
        const otherPct  = dom?.other  ?? 0

        const fgValue = fg?.value ?? null
        const fgLabel = fg?.classification?.toUpperCase() ?? '—'
        const fgColor = fgLabel === 'FEAR' || fgLabel === 'EXTREME FEAR'
          ? 'text-red-500'
          : fgLabel === 'GREED' || fgLabel === 'EXTREME GREED'
            ? 'text-emerald-500'
            : 'text-yellow-500'

        const segments = [
          { label: 'BTC',    pct: btcPct,    color: 'bg-orange-500' },
          { label: 'ETH',    pct: ethPct,    color: 'bg-blue-500'   },
          { label: 'Stable', pct: stablePct, color: 'bg-emerald-500'},
          { label: 'Other',  pct: otherPct,  color: 'bg-zinc-500'   },
        ]

        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Fear &amp; Greed Index</span>
              <span className={`text-[11px] font-bold ${fgColor}`}>
                {fgValue !== null ? `${fgValue} ` : ''}{fgLabel}
              </span>
            </div>

            <div className="flex h-3 w-full rounded-sm overflow-hidden">
              {segments.map(s => (
                <div key={s.label} className={`${s.color} h-full`} style={{ width: `${s.pct}%` }} />
              ))}
            </div>

            <div className="space-y-1">
              {segments.map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block w-2 h-2 rounded-sm ${s.color}`} />
                    <span className="text-[10px] text-foreground">{s.label}</span>
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{s.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-muted-foreground">BTC dominance</span>
              <span className={`font-medium ${btcPct > 50 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                {btcPct.toFixed(1)}%
              </span>
              <span className={btcPct > 50 ? 'text-orange-500' : 'text-muted-foreground'}>
                {btcPct > 50 ? '▲' : '▼'}
              </span>
            </div>
          </div>
        )
      })()}
    </PanelWrapper>
  )
}
