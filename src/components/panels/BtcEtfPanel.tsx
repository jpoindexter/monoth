import { useState, useCallback, useEffect } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { useCryptoData } from '@/hooks/use-crypto-data'
import { useMarketStore } from '@/stores'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

const ETF_SYMBOLS = ['IBIT', 'FBTC', 'GBTC', 'ARKB', 'BITB']

export default function BtcEtfPanel() {
  const [tab, setTab] = useState<'etfs' | 'news' | 'chart'>('news')
  const [chartData, setChartData] = useState<{ time: string; value: number }[]>([])
  const { data: newsData, loading: newsLoading, error: newsError, refresh } = useNewsData('btcetf')
  useCryptoData()
  const crypto = useMarketStore((s) => s.crypto)
  const btc = crypto.find((c) => c.id === 'bitcoin')

  const { data: etfData, loading: etfLoading } = usePolling({
    fetcher: useCallback(() => fetchQuotes(ETF_SYMBOLS), []),
    interval: 60_000,
    enabled: tab === 'etfs',
  })

  useEffect(() => {
    if (tab === 'chart') {
      fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30')
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
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="BTC ETF" loading={newsLoading && etfLoading} error={newsError} onRetry={refresh}>
      {btc && (
        <div className="border-b border-border/20 pb-1.5 mb-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-muted-foreground">BTC</span>
            <span className="text-sm font-bold tabular-nums">
              ${btc.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
            <span className={`text-[10px] font-medium tabular-nums ${btc.changePercent24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {btc.changePercent24h >= 0 ? '+' : ''}{btc.changePercent24h.toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'etfs')} onClick={() => setTab('etfs')}>ETFs</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
        <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
      </div>

      {tab === 'chart' && (
        <LightweightChart
          type="area"
          data={chartData}
          height={140}
          lineColor="#f59e0b"
          areaTopColor="rgba(245, 158, 11, 0.2)"
          areaBottomColor="rgba(245, 158, 11, 0.02)"
        />
      )}

      {tab === 'etfs' && (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">ETF</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">Chg</th>
              <th className="text-right font-medium pb-1.5">%</th>
            </tr>
          </thead>
          <tbody>
            {etfData?.map((etf) => {
              const isPos = (etf.changePercent ?? 0) >= 0
              return (
                <tr key={etf.symbol} className="border-t border-border/20">
                  <td className="py-0.5 font-medium">{etf.symbol}</td>
                  <td className="text-right tabular-nums">${etf.price.toFixed(2)}</td>
                  <td className={`text-right tabular-nums ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{(etf.change ?? 0).toFixed(2)}
                  </td>
                  <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{(etf.changePercent ?? 0).toFixed(2)}%
                  </td>
                </tr>
              )
            })}
            {(!etfData || etfData.length === 0) && !etfLoading && (
              <tr><td colSpan={4} className="py-2 text-center text-muted-foreground text-[10px]">No ETF data</td></tr>
            )}
          </tbody>
        </table>
      )}

      {tab === 'news' && (
        <div className="space-y-0">
          {newsData?.slice(0, 10).map((item) => {
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
