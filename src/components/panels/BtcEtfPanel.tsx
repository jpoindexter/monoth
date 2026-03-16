import { useState, useCallback, useEffect } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { useCryptoData } from '@/hooks/use-crypto-data'
import { useMarketStore } from '@/stores'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime, tabCls } from '@/lib/panel-utils'

const ETF_SYMBOLS = ['IBIT', 'FBTC', 'GBTC', 'ARKB', 'BITB']

const ETF_META: Record<string, { fee: number; aum: number; fullName: string }> = {
  IBIT:  { fee: 0.25, aum: 50, fullName: 'iShares Bitcoin Trust' },
  FBTC:  { fee: 0.25, aum: 18, fullName: 'Fidelity Wise Origin BTC' },
  GBTC:  { fee: 1.50, aum: 22, fullName: 'Grayscale Bitcoin Trust' },
  ARKB:  { fee: 0.21, aum: 5,  fullName: 'ARK 21Shares Bitcoin ETF' },
  BITB:  { fee: 0.20, aum: 3,  fullName: 'Bitwise Bitcoin ETF' },
}

const maxAUM = Math.max(...ETF_SYMBOLS.map((t) => ETF_META[t]?.aum ?? 0))
const minFee = Math.min(...ETF_SYMBOLS.map((t) => ETF_META[t]?.fee ?? Infinity))

function fmtVol(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  return `${(v / 1e3).toFixed(0)}K`
}

function fmtFlow(v: number): string {
  const abs = Math.abs(v)
  const sign = v >= 0 ? '+' : '-'
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`
  return `${sign}$${(abs / 1e3).toFixed(0)}K`
}

type FlowsData = {
  timestamp: string
  summary: {
    etfCount: number
    totalVolume: number
    totalEstFlow: number
    netDirection: 'NET INFLOW' | 'NET OUTFLOW' | 'NEUTRAL' | 'UNAVAILABLE'
    inflowCount: number
    outflowCount: number
  }
  etfs: Array<{
    ticker: string
    issuer: string
    price: number
    priceChange: number
    volume: number
    avgVolume: number
    volumeRatio: number
    direction: 'inflow' | 'outflow' | 'neutral'
    estFlow: number
  }>
  rateLimited: boolean
}

export default function BtcEtfPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'etfs' | 'flows' | 'news' | 'chart' | 'compare'>('news')
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

  const { data: flowsData, loading: flowsLoading } = usePolling<FlowsData>({
    fetcher: useCallback(() => fetch('/api/market/etf-flows').then(r => r.json()), []),
    interval: 600_000,
    enabled: tab === 'flows',
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

  const directionDot = (dir: 'inflow' | 'outflow' | 'neutral') => {
    if (dir === 'inflow') return 'bg-emerald-500'
    if (dir === 'outflow') return 'bg-red-500'
    return 'bg-muted-foreground'
  }

  const directionText = (dir: 'inflow' | 'outflow' | 'neutral') => {
    if (dir === 'inflow') return 'text-emerald-500'
    if (dir === 'outflow') return 'text-red-500'
    return 'text-muted-foreground'
  }

  return (
    <PanelWrapper title="BTC ETF" loading={newsLoading && etfLoading} error={newsError} onRetry={refresh}>
      {btc && (
        <div className="border-b border-border/20 pb-1.5 mb-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-muted-foreground">BTC</span>
            <span className={`${expanded ? 'text-xl' : 'text-sm'} font-bold tabular-nums`}>
              ${btc.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
            <span className={`text-[10px] font-medium tabular-nums ${btc.changePercent24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {btc.changePercent24h >= 0 ? '+' : ''}{btc.changePercent24h.toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'etfs')} onClick={() => setTab('etfs')}>ETFs</button>
        <button className={tabCls(tab === 'flows')} onClick={() => setTab('flows')}>Flows</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
        <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
        <button className={tabCls(tab === 'compare')} onClick={() => setTab('compare')}>Compare</button>
      </div>

      {tab === 'chart' && (
        <LightweightChart
          type="area"
          data={chartData}
          height={expanded ? 300 : 140}
          lineColor="#f59e0b"
          areaTopColor="rgba(245, 158, 11, 0.2)"
          areaBottomColor="rgba(245, 158, 11, 0.02)"
        />
      )}

      {tab === 'etfs' && (
        <table className={`w-full ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>
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
              const meta = ETF_META[etf.symbol]
              return (
                <tr key={etf.symbol} className="border-t border-border/20">
                  <td className="py-0.5">
                    <div className="font-medium">{etf.symbol}</div>
                    {expanded && meta && (
                      <div className="text-[10px] text-muted-foreground">{meta.fullName}</div>
                    )}
                  </td>
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

      {tab === 'flows' && (
        <div className="space-y-2">
          {flowsLoading && !flowsData && (
            <div className="py-4 text-center text-muted-foreground text-[10px]">Loading...</div>
          )}

          {!flowsLoading && !flowsData && (
            <div className="py-4 text-center text-muted-foreground text-[10px]">No data available</div>
          )}

          {flowsData && (
            <>
              {flowsData.rateLimited && (
                <div className="text-[10px] text-amber-500 border border-amber-500/20 bg-amber-500/10 rounded px-2 py-1">
                  Rate limited — showing cached data
                </div>
              )}

              <div className="border-b border-border/20 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-px rounded-sm ${
                      flowsData.summary.netDirection === 'NET INFLOW'
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : flowsData.summary.netDirection === 'NET OUTFLOW'
                        ? 'bg-red-500/20 text-red-500'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {flowsData.summary.netDirection}
                    </span>
                    <span className={`text-[12px] font-bold tabular-nums ${
                      flowsData.summary.totalEstFlow >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {fmtFlow(flowsData.summary.totalEstFlow)}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground tabular-nums">
                    <span className="text-emerald-500">{flowsData.summary.inflowCount} in</span>
                    {' / '}
                    <span className="text-red-500">{flowsData.summary.outflowCount} out</span>
                  </div>
                </div>
              </div>

              <table className={`w-full ${expanded ? 'text-[12px]' : 'text-[11px]'}`}>
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left font-medium pb-1.5">Ticker</th>
                    <th className="text-left font-medium pb-1.5 hidden sm:table-cell">Issuer</th>
                    <th className="text-right font-medium pb-1.5">Chg%</th>
                    <th className="text-right font-medium pb-1.5">Volume</th>
                    <th className="text-right font-medium pb-1.5">Dir</th>
                  </tr>
                </thead>
                <tbody>
                  {flowsData.etfs.map((etf) => {
                    const isPos = etf.priceChange >= 0
                    return (
                      <tr key={etf.ticker} className="border-t border-border/20">
                        <td className="py-1 font-medium">{etf.ticker}</td>
                        <td className="py-1 text-muted-foreground hidden sm:table-cell">{etf.issuer}</td>
                        <td className={`py-1 text-right tabular-nums ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isPos ? '+' : ''}{etf.priceChange.toFixed(2)}%
                        </td>
                        <td className="py-1 text-right tabular-nums">
                          <div>{fmtVol(etf.volume)}</div>
                          <div className="text-[9px] text-muted-foreground">{etf.volumeRatio.toFixed(1)}x avg</div>
                        </td>
                        <td className="py-1 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${directionDot(etf.direction)}`} />
                            <span className={`text-[10px] ${directionText(etf.direction)}`}>
                              {etf.direction}
                            </span>
                          </div>
                          {expanded && (
                            <div className={`text-[9px] tabular-nums ${etf.estFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {fmtFlow(etf.estFlow)}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {flowsData.etfs.length === 0 && (
                    <tr><td colSpan={5} className="py-2 text-center text-muted-foreground text-[10px]">No data available</td></tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {tab === 'news' && (
        <div className="space-y-0">
          {newsData?.slice(0, expanded ? undefined : 10).map((item) => {
            const cls = classifyHeadline(item.title)
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-muted/30 -mx-1 px-1 rounded-sm transition-colors"
              >
                <div className="flex-1 min-w-0">
                  {cls && (
                    <span
                      className="inline-block text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
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

      {tab === 'compare' && (
        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">AUM ($B)</div>
            <div className="space-y-1.5">
              {ETF_SYMBOLS.map((ticker) => {
                const meta = ETF_META[ticker]
                const aum = meta?.aum ?? 0
                const barPct = (aum / maxAUM) * 100
                const isLargest = aum === maxAUM
                return (
                  <div key={ticker}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-medium">{ticker}</span>
                        {isLargest && (
                          <span className="text-[7px] font-bold uppercase tracking-wider px-1 py-px rounded-sm bg-amber-500/20 text-amber-500">
                            LARGEST
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] tabular-nums text-foreground">${aum}B</span>
                    </div>
                    <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t border-border/20 pt-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Expense Ratio</div>
            <div className="space-y-0.5">
              {ETF_SYMBOLS.map((ticker) => {
                const meta2 = ETF_META[ticker]
                const fee = meta2?.fee ?? 0
                const isCheapest = fee === minFee
                return (
                  <div key={ticker} className="flex items-center justify-between py-0.5 border-b border-border/10 last:border-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-medium">{ticker}</span>
                      {isCheapest && (
                        <span className="text-[7px] font-bold uppercase tracking-wider px-1 py-px rounded-sm bg-emerald-500/20 text-emerald-500">
                          CHEAPEST
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] tabular-nums font-medium ${fee >= 1 ? 'text-red-500' : 'text-foreground'}`}>
                      {fee.toFixed(2)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </PanelWrapper>
  )
}
