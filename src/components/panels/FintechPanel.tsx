import { useState, useCallback, useEffect } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { fetchCandles, type CandleData } from '@/services/api/candles'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { relTime, tabCls } from '@/lib/panel-utils'

const FINTECH_SYMBOLS = ['ARKF', 'FINX', 'AFRM', 'SQ', 'PYPL', 'COIN']
const FINTECH_NAMES: Record<string, string> = {
  ARKF: 'ARK Fintech', FINX: 'Global Fintech', AFRM: 'Affirm Holdings',
  SQ: 'Block Inc', PYPL: 'PayPal', COIN: 'Coinbase',
}

const PAYMENT_SYMBOLS = ['V', 'MA', 'PYPL', 'SQ', 'ADYEN.AS']
const PAYMENT_NAMES: Record<string, string> = {
  V: 'Visa', MA: 'Mastercard', PYPL: 'PayPal', SQ: 'Block (Square)', 'ADYEN.AS': 'Adyen',
}

const NETWORK_LOGO: Record<string, string> = { V: 'V', MA: 'M', PYPL: 'P', SQ: 'S', 'ADYEN.AS': 'A' }
const NETWORK_COLOR: Record<string, string> = {
  V: 'bg-blue-600', MA: 'bg-orange-500', PYPL: 'bg-sky-500', SQ: 'bg-emerald-600', 'ADYEN.AS': 'bg-violet-500',
}
const MARKET_SHARE: Record<string, number> = { V: 40, MA: 25, PYPL: 15, SQ: 10, 'ADYEN.AS': 5 }
const SHARE_COLOR: Record<string, string> = {
  V: 'bg-blue-500', MA: 'bg-orange-400', PYPL: 'bg-sky-400', SQ: 'bg-emerald-500', 'ADYEN.AS': 'bg-violet-400',
}

const CHART_SYMBOLS = ['ARKF', 'FINX', 'IPAY']

const TRENDS = [
  { name: 'BNPL', label: 'Buy Now Pay Later', size: '$350B market', growth: 22 },
  { name: 'Neobanks', label: 'Neobanks', size: '400M users globally', growth: 35 },
  { name: 'Embedded Finance', label: 'Embedded Finance', size: '$138B market', growth: 28 },
  { name: 'RegTech', label: 'RegTech', size: '$12B market', growth: 19 },
  { name: 'InsurTech', label: 'InsurTech', size: '$32B market', growth: 15 },
  { name: 'Crypto Payments', label: 'Crypto Payments', size: '$45B volume', growth: 40 },
]

// Composite innovation index: weighted avg of growth rates, normalized to 0-100
const INNOVATION_INDEX = Math.round(
  TRENDS.reduce((sum, t) => sum + t.growth, 0) / TRENDS.length / 0.5
)

// Map growth % to a green shade: lower growth = muted, higher = saturated
function growthBarColor(growth: number): string {
  if (growth >= 35) return 'bg-emerald-500'
  if (growth >= 28) return 'bg-emerald-400'
  if (growth >= 22) return 'bg-emerald-300'
  if (growth >= 19) return 'bg-green-300'
  return 'bg-green-200'
}

// Industry reference figures (Nilson Report / World Bank / McKinsey estimates)
const TXN_VOLUME = {
  card: '1.2B/day',
  wallet: '800M/day',
  crossBorder: '$13.1T',
}

export default function FintechPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'prices' | 'networks' | 'trends' | 'chart' | 'news'>('prices')
  const [chartSymbol, setChartSymbol] = useState('ARKF')
  const [chartData, setChartData] = useState<CandleData[]>([])

  const { data: newsData, loading: newsLoading, error, refresh } = useNewsData('fintech')
  const { data: priceData, loading: priceLoading } = usePolling({
    fetcher: useCallback(() => fetchQuotes(FINTECH_SYMBOLS), []),
    interval: 300_000,
    enabled: tab === 'prices',
  })
  const { data: networkData } = usePolling({
    fetcher: useCallback(() => fetchQuotes(PAYMENT_SYMBOLS), []),
    interval: 300_000,
    enabled: tab === 'networks',
  })

  useEffect(() => {
    if (tab === 'chart') {
      fetchCandles(chartSymbol).then(setChartData).catch(() => {})
    }
  }, [tab, chartSymbol])

  const maxGrowth = Math.max(...TRENDS.map((t) => t.growth))

  return (
    <PanelWrapper title="Fintech & Payments" loading={newsLoading && priceLoading} error={error} onRetry={refresh}>
      <div className="flex flex-wrap gap-1 mb-2">
        <button className={tabCls(tab === 'prices')} onClick={() => setTab('prices')}>Stocks</button>
        <button className={tabCls(tab === 'networks')} onClick={() => setTab('networks')}>Networks</button>
        <button className={tabCls(tab === 'trends')} onClick={() => setTab('trends')}>Trends</button>
        <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'prices' && (
        <table className={`w-full ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5">Name</th>
              <th className="text-right font-medium pb-1.5">Price</th>
              <th className="text-right font-medium pb-1.5">Chg%</th>
            </tr>
          </thead>
          <tbody>
            {priceData?.map((p) => {
              const isPos = p.changePercent >= 0
              return (
                <tr key={p.symbol} className="border-t border-border/20">
                  <td className="py-0.5">
                    <div className="font-medium">{FINTECH_NAMES[p.symbol] || p.symbol}</div>
                    {expanded && <div className="text-[10px] text-muted-foreground">{p.symbol}</div>}
                    {!expanded && <span className="text-muted-foreground ml-1 text-[10px]">{p.symbol}</span>}
                  </td>
                  <td className="text-right tabular-nums">${p.price != null ? p.price.toFixed(2) : '--'}</td>
                  <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{p.changePercent != null ? p.changePercent.toFixed(2) : '--'}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'networks' && (
        <div>
          <div className="space-y-1.5">
            {(networkData ?? []).map((p) => {
              const isPos = p.changePercent >= 0
              const share = MARKET_SHARE[p.symbol] ?? 0
              return (
                <div key={p.symbol} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${NETWORK_COLOR[p.symbol] ?? 'bg-zinc-500'}`}>
                    {NETWORK_LOGO[p.symbol] ?? p.symbol[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium truncate">{PAYMENT_NAMES[p.symbol] || p.symbol}</span>
                      <span className="text-[10px] text-muted-foreground ml-1 shrink-0">{p.symbol}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${SHARE_COLOR[p.symbol] ?? 'bg-zinc-400'}`}
                          style={{ width: `${share}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{share}%</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] tabular-nums">${p.price != null ? p.price.toFixed(2) : '--'}</div>
                    <div className={`text-[10px] tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isPos ? '+' : ''}{p.changePercent != null ? p.changePercent.toFixed(2) : '--'}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-3 border-t border-border/20 pt-2 space-y-1">
            <div className="mb-1 px-1.5 py-0.5 rounded-sm bg-border/20 border border-border/30">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Reference · Nilson / World Bank estimates</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground">Card transactions</span>
              <span className="text-[12px] font-bold tabular-nums">{TXN_VOLUME.card}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground">Digital wallets</span>
              <span className="text-[12px] font-bold tabular-nums">{TXN_VOLUME.wallet}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground">Cross-border (annual)</span>
              <span className="text-[12px] font-bold tabular-nums">{TXN_VOLUME.crossBorder}</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'trends' && (
        <div>
          <div className="flex items-center justify-between mb-3 p-2 bg-muted/40 rounded-md">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Innovation Index</div>
              <div className="text-[18px] font-bold tabular-nums leading-tight">{INNOVATION_INDEX}<span className="text-[10px] text-muted-foreground font-normal">/100</span></div>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center">
              <span className="text-[11px] font-bold text-emerald-600">{INNOVATION_INDEX}</span>
            </div>
          </div>

          <div className="space-y-2">
            {TRENDS.map((t) => (
              <div key={t.name}>
                <div className="flex items-center justify-between mb-0.5">
                  <div>
                    <span className={`${expanded ? 'text-[13px]' : 'text-[11px]'} font-medium`}>{t.label}</span>
                    <span className={`${expanded ? 'text-[11px]' : 'text-[10px]'} text-muted-foreground ml-1.5`}>{t.size}</span>
                  </div>
                  <span className={`${expanded ? 'text-[13px]' : 'text-[11px]'} font-bold tabular-nums text-emerald-600`}>+{t.growth}%</span>
                </div>
                <div className={`${expanded ? 'h-2.5' : 'h-1.5'} bg-muted rounded-full overflow-hidden`}>
                  <div
                    className={`h-full rounded-full transition-all ${growthBarColor(t.growth)}`}
                    style={{ width: `${(t.growth / maxGrowth) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-border/20">
            <div className="text-[10px] text-muted-foreground">YoY growth rates. Bar width relative to highest growth vertical.</div>
          </div>
        </div>
      )}

      {tab === 'chart' && (
        <div>
          <div className="flex gap-1 mb-1">
            {CHART_SYMBOLS.map((sym) => (
              <button
                key={sym}
                className={`text-[9px] px-1 rounded-sm ${chartSymbol === sym ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
                onClick={() => setChartSymbol(sym)}
              >
                {sym}
              </button>
            ))}
          </div>
          <LightweightChart
            type="candlestick"
            data={chartData}
            height={expanded ? 300 : 140}
          />
        </div>
      )}

      {tab === 'news' && (
        <div className="space-y-0">
          {newsData?.map((item) => {
            const cls = classifyHeadline(item.title)
            return (
              <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-1 px-1 rounded-sm transition-colors">
                <div className="flex-1 min-w-0">
                  {cls && (
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
                      style={{ backgroundColor: THREAT_COLORS[cls.level], color: '#fff' }}>
                      {CATEGORY_LABELS[cls.category]}
                    </span>
                  )}
                  <span className={`text-[11px] font-medium leading-snug text-foreground ${expanded ? '' : 'line-clamp-2'}`}>{item.title}</span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">{relTime(item.published)}</span>
              </a>
            )
          })}
        </div>
      )}
    </PanelWrapper>
  )
}
