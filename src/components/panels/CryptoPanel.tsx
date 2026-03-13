import { useState, useCallback } from 'react'
import { useCryptoData } from '@/hooks/use-crypto-data'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { usePolling } from '@/hooks/use-polling'

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

export default function CryptoPanel() {
  const [tab, setTab] = useState<'top15' | 'stables'>('top15')
  const { data, loading, error, refresh } = useCryptoData()
  const { data: stableData, loading: stableLoading } = usePolling<Stablecoin[]>({
    fetcher: useCallback(async () => {
      const res = await fetch('/api/crypto/stablecoins')
      if (!res.ok) throw new Error('Failed to fetch stablecoins')
      return res.json()
    }, []),
    interval: 300_000,
    enabled: tab === 'stables',
  })

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Crypto" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'top15')} onClick={() => setTab('top15')}>Top 15</button>
        <button className={tabCls(tab === 'stables')} onClick={() => setTab('stables')}>Stables</button>
      </div>

      {tab === 'top15' && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">#</th>
              <th className="text-left font-medium pb-1.5">Name</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">24h</th>
              <th className="text-right font-medium pb-1.5">MCap</th>
            </tr>
          </thead>
          <tbody>
            {data?.slice(0, 15).map((c) => {
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
    </PanelWrapper>
  )
}
