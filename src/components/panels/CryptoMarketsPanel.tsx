import { useCallback, useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { tabCls } from '@/lib/panel-utils'

type Tab = 'prices' | 'dominance' | 'defi' | 'fear'

const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT']

interface CryptoQuote {
  id: string
  symbol: string
  name: string
  price: number
  changePercent24h: number
  marketCap: number
  rank: number
}

interface FearGreedData {
  fearGreed: {
    value: number
    classification: string
    history: { value: number; classification: string; date: string }[]
  }
  dominance: {
    btc: number
    eth: number
    stable: number
    other: number
  }
}

interface DefiProtocol {
  name: string
  tvl: number
  change24h: number | null
  category: string
  chain: string
}

interface DefiData {
  protocols: DefiProtocol[]
  chains: { name: string; tvl: number; pct: number }[]
}

function fmtMcap(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  return `$${v.toFixed(0)}`
}

function fmtPrice(v: number): string {
  if (v >= 1000) return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  if (v >= 1) return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  return v.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
}

function fearLabel(v: number): string {
  if (v <= 25) return 'Extreme Fear'
  if (v <= 45) return 'Fear'
  if (v <= 55) return 'Neutral'
  if (v <= 75) return 'Greed'
  return 'Extreme Greed'
}

function fearColor(v: number): string {
  if (v <= 25) return 'text-red-500'
  if (v <= 45) return 'text-orange-500'
  if (v <= 55) return 'text-yellow-500'
  if (v <= 75) return 'text-emerald-500'
  return 'text-green-400'
}

export default function CryptoMarketsPanel() {
  const [tab, setTab] = useState<Tab>('prices')

  const pricesFetcher = useCallback(async () => {
    const r = await fetch('/api/crypto/prices')
    if (!r.ok) throw new Error('Failed to fetch crypto prices')
    const all: CryptoQuote[] = await r.json()
    return all.filter((c) => CRYPTO_SYMBOLS.includes(c.symbol))
  }, [])

  const fearFetcher = useCallback(async () => {
    const r = await fetch('/api/crypto/fear-greed')
    if (!r.ok) throw new Error('Failed to fetch fear/greed')
    return r.json() as Promise<FearGreedData>
  }, [])

  const defiFetcher = useCallback(async () => {
    const r = await fetch('/api/crypto/defi')
    if (!r.ok) throw new Error('Failed to fetch DeFi data')
    return r.json() as Promise<DefiData>
  }, [])

  const { data: prices, loading: pricesLoading, error: pricesError, refresh: refreshPrices } = usePolling({
    fetcher: pricesFetcher,
    interval: 60_000,
    enabled: tab === 'prices',
  })

  const { data: fearData, loading: fearLoading, error: fearError, refresh: refreshFear } = usePolling({
    fetcher: fearFetcher,
    interval: 300_000,
    enabled: tab === 'fear' || tab === 'dominance',
  })

  const { data: defiData, loading: defiLoading, error: defiError, refresh: refreshDefi } = usePolling({
    fetcher: defiFetcher,
    interval: 300_000,
    enabled: tab === 'defi',
  })

  const loading = tab === 'prices' ? pricesLoading : tab === 'defi' ? defiLoading : fearLoading
  const error = tab === 'prices' ? pricesError : tab === 'defi' ? defiError : fearError
  const refresh = tab === 'prices' ? refreshPrices : tab === 'defi' ? refreshDefi : refreshFear

  const dominance = fearData?.dominance
  const maxDom = dominance ? Math.max(dominance.btc, dominance.eth, dominance.stable, dominance.other) : 100

  const totalTvl = defiData?.protocols.reduce((s, p) => s + p.tvl, 0) ?? 0
  const topProtocols = defiData?.protocols.slice(0, 5) ?? []

  return (
    <PanelWrapper title="Crypto Markets" loading={loading} error={error} onRetry={refresh}>
      <div className="flex flex-wrap gap-1 mb-2">
        <button className={tabCls(tab === 'prices')} onClick={() => setTab('prices')}>Prices</button>
        <button className={tabCls(tab === 'dominance')} onClick={() => setTab('dominance')}>Dominance</button>
        <button className={tabCls(tab === 'defi')} onClick={() => setTab('defi')}>DeFi</button>
        <button className={tabCls(tab === 'fear')} onClick={() => setTab('fear')}>Fear</button>
      </div>

      {tab === 'prices' && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Coin</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">24h%</th>
              <th className="text-right font-medium pb-1.5">Mkt Cap</th>
            </tr>
          </thead>
          <tbody>
            {(prices ?? []).map((coin) => {
              const up = coin.changePercent24h >= 0
              return (
                <tr key={coin.symbol} className="border-t border-border/20">
                  <td className="py-1">
                    <span className="font-medium text-foreground">{coin.symbol}</span>
                    <span className="text-muted-foreground ml-1 text-[10px]">{coin.name}</span>
                  </td>
                  <td className="text-right tabular-nums font-medium">${fmtPrice(coin.price)}</td>
                  <td className={`text-right tabular-nums font-medium ${up ? 'text-green-400' : 'text-red-400'}`}>
                    {up ? '+' : ''}{coin.changePercent24h.toFixed(2)}%
                  </td>
                  <td className="text-right tabular-nums text-muted-foreground">{fmtMcap(coin.marketCap)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'dominance' && dominance && (
        <div className="flex flex-col gap-2">
          {[
            { label: 'Bitcoin (BTC)', value: dominance.btc, color: '#f59e0b' },
            { label: 'Ethereum (ETH)', value: dominance.eth, color: '#6366f1' },
            { label: 'Stablecoins', value: dominance.stable, color: '#10b981' },
            { label: 'Others', value: dominance.other, color: '#6b7280' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[11px] text-foreground">{item.label}</span>
                <span className="text-[11px] tabular-nums font-medium text-foreground">{item.value.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted/40 rounded-sm h-2.5">
                <div
                  className="h-2.5 rounded-sm"
                  style={{ width: `${Math.min((item.value / maxDom) * 100, 100)}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
          {fearData?.fearGreed && (
            <div className="border-t border-border/20 pt-2 mt-1 flex flex-col gap-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">7-Day F&G History</div>
              {fearData.fearGreed.history.slice(0, 5).map((h) => {
                const up = h.value > 50
                return (
                  <div key={h.date} className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">{h.date}</span>
                    <span className={`text-[10px] tabular-nums font-medium ${fearColor(h.value)}`}>
                      {h.value} — {h.classification}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'defi' && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Total TVL</span>
            <span className="text-[13px] tabular-nums font-semibold text-foreground">{fmtMcap(totalTvl)}</span>
          </div>
          <div className="border-t border-border/20 pt-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Top Protocols</div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left font-medium pb-1">Protocol</th>
                  <th className="text-right font-medium pb-1">TVL</th>
                  <th className="text-right font-medium pb-1">24h%</th>
                </tr>
              </thead>
              <tbody>
                {topProtocols.map((p) => {
                  const up = p.change24h != null && p.change24h >= 0
                  return (
                    <tr key={p.name} className="border-t border-border/20">
                      <td className="py-1">
                        <span className="font-medium text-foreground">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">{p.chain}</span>
                      </td>
                      <td className="text-right tabular-nums font-medium">{fmtMcap(p.tvl)}</td>
                      <td className={`text-right tabular-nums font-medium ${p.change24h == null ? 'text-muted-foreground' : up ? 'text-green-400' : 'text-red-400'}`}>
                        {p.change24h == null ? '—' : `${up ? '+' : ''}${p.change24h.toFixed(2)}%`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'fear' && fearData?.fearGreed && (
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <div className={`text-[64px] font-bold tabular-nums leading-none ${fearColor(fearData.fearGreed.value)}`}>
            {fearData.fearGreed.value}
          </div>
          <div className={`text-[14px] font-semibold ${fearColor(fearData.fearGreed.value)}`}>
            {fearLabel(fearData.fearGreed.value)}
          </div>
          <div className="text-[10px] text-muted-foreground">Crypto Fear & Greed Index</div>
          <div className="w-full border-t border-border/20 pt-3 mt-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">7-Day History</div>
            <div className="flex flex-col gap-1">
              {fearData.fearGreed.history.map((h) => (
                <div key={h.date} className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground">{h.date}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-24 bg-muted/40 rounded-sm h-1.5">
                      <div
                        className="h-1.5 rounded-sm"
                        style={{
                          width: `${h.value}%`,
                          backgroundColor: h.value <= 25 ? '#ef4444' : h.value <= 45 ? '#f97316' : h.value <= 55 ? '#eab308' : h.value <= 75 ? '#10b981' : '#4ade80',
                        }}
                      />
                    </div>
                    <span className={`text-[10px] tabular-nums w-6 text-right font-medium ${fearColor(h.value)}`}>{h.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PanelWrapper>
  )
}
