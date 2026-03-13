import { useState, useCallback, useMemo } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'
import { useMarketStore } from '@/stores/market-store'
import { relTime } from '@/lib/panel-utils'

const VOL_SYMBOLS = ['VIXY', 'UVXY', 'SVXY', 'SQQQ', 'TQQQ', 'SPXS']
const VOL_NAMES: Record<string, string> = {
  VIXY: 'VIX Short-Term', UVXY: 'Ultra VIX', SVXY: 'Short VIX',
  SQQQ: '3x Short QQQ', TQQQ: '3x Long QQQ', SPXS: '3x Short SPX',
}

const MONTH_LABELS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8']

function buildTermStructure(spot: number) {
  // Typical contango: each month adds 0.5-1.5pts, with slight mean reversion flattening
  const steps = [0, 0.8, 1.5, 2.1, 2.6, 3.0, 3.3, 3.5]
  return steps.map((delta, i) => ({ month: MONTH_LABELS[i], value: +(spot + delta).toFixed(2) }))
}

function termStructureChartData(structure: { month: string; value: number }[]) {
  // LightweightChart needs 'YYYY-MM-DD' time keys — use sequential placeholder dates
  const base = new Date('2025-01-01')
  return structure.map((pt, i) => {
    const d = new Date(base)
    d.setMonth(base.getMonth() + i)
    return { time: d.toISOString().slice(0, 10), value: pt.value }
  })
}

const GREEKS_DATA = [
  { symbol: 'SPY', type: 'CALL', strike: 580, expiry: 'Mar21', delta: 0.62, gamma: 0.018, theta: -0.14, vega: 0.31 },
  { symbol: 'SPY', type: 'CALL', strike: 590, expiry: 'Mar21', delta: 0.41, gamma: 0.022, theta: -0.18, vega: 0.38 },
  { symbol: 'SPY', type: 'CALL', strike: 600, expiry: 'Apr18', delta: 0.34, gamma: 0.015, theta: -0.11, vega: 0.44 },
  { symbol: 'SPY', type: 'PUT',  strike: 560, expiry: 'Mar21', delta: -0.38, gamma: 0.019, theta: -0.15, vega: 0.33 },
  { symbol: 'SPY', type: 'PUT',  strike: 550, expiry: 'Apr18', delta: -0.27, gamma: 0.013, theta: -0.09, vega: 0.41 },
  { symbol: 'SPY', type: 'PUT',  strike: 540, expiry: 'May16', delta: -0.19, gamma: 0.009, theta: -0.07, vega: 0.36 },
]

const NET_GREEKS = {
  delta: GREEKS_DATA.reduce((s, r) => s + r.delta, 0),
  gamma: GREEKS_DATA.reduce((s, r) => s + r.gamma, 0),
  theta: GREEKS_DATA.reduce((s, r) => s + r.theta, 0),
  vega:  GREEKS_DATA.reduce((s, r) => s + r.vega,  0),
}

const FLOW_DATA = [
  { symbol: 'SPY',  type: 'CALL', strike: 595, expiry: 'Mar21', volume: 42800, premium: 8.42, tag: 'SWEEP' },
  { symbol: 'QQQ',  type: 'CALL', strike: 510, expiry: 'Apr18', volume: 31200, premium: 6.15, tag: 'BLOCK' },
  { symbol: 'AAPL', type: 'PUT',  strike: 210, expiry: 'Mar21', volume: 28900, premium: 5.83, tag: 'SWEEP' },
  { symbol: 'SPY',  type: 'PUT',  strike: 565, expiry: 'Mar28', volume: 24100, premium: 4.97, tag: 'SWEEP' },
  { symbol: 'TSLA', type: 'CALL', strike: 290, expiry: 'Apr18', volume: 19700, premium: 4.31, tag: 'BLOCK' },
  { symbol: 'NVDA', type: 'CALL', strike: 950, expiry: 'Mar21', volume: 17400, premium: 3.88, tag: 'SWEEP' },
  { symbol: 'IWM',  type: 'PUT',  strike: 215, expiry: 'Apr18', volume: 15600, premium: 2.74, tag: 'BLOCK' },
  { symbol: 'QQQ',  type: 'PUT',  strike: 490, expiry: 'May16', volume: 13200, premium: 2.41, tag: 'SWEEP' },
  { symbol: 'META', type: 'CALL', strike: 620, expiry: 'Mar28', volume: 11800, premium: 2.19, tag: 'BLOCK' },
  { symbol: 'SPX',  type: 'CALL', strike: 5900, expiry: 'Apr18', volume: 9400, premium: 1.96, tag: 'SWEEP' },
].sort((a, b) => b.premium - a.premium)

const CALL_PREMIUM = FLOW_DATA.filter(r => r.type === 'CALL').reduce((s, r) => s + r.premium, 0)
const PUT_PREMIUM  = FLOW_DATA.filter(r => r.type === 'PUT').reduce((s, r) => s + r.premium, 0)
const CALL_VOL     = FLOW_DATA.filter(r => r.type === 'CALL').reduce((s, r) => s + r.volume, 0)
const PUT_VOL      = FLOW_DATA.filter(r => r.type === 'PUT').reduce((s, r) => s + r.volume, 0)
const FLOW_PC_RATIO = +(PUT_VOL / CALL_VOL).toFixed(2)
const FLOW_PUTS_WIDTH = Math.min(Math.max((PUT_PREMIUM / (CALL_PREMIUM + PUT_PREMIUM)) * 100, 10), 90)

export default function DerivativesPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<'prices' | 'term' | 'news' | 'greeks' | 'flow'>('prices')
  const { data: newsData, loading: newsLoading, error, refresh } = useNewsData('derivatives')
  const { data: priceData, loading: priceLoading } = usePolling({
    fetcher: useCallback(() => fetchQuotes(VOL_SYMBOLS), []),
    interval: 300_000,
    enabled: tab === 'prices',
  })

  const indices = useMarketStore((s) => s.indices)
  const vixEntry = indices.find((d) => d.symbol === 'VIX' || d.symbol === 'VIXY')
  const vixSpot = vixEntry?.price ?? 18

  const termStructure = useMemo(() => buildTermStructure(vixSpot), [vixSpot])
  const chartData = useMemo(() => termStructureChartData(termStructure), [termStructure])

  const isBackwardation = termStructure[0].value > termStructure[termStructure.length - 1].value

  // P/C ratio derived from VIX level
  const pcRatio = vixSpot > 25 ? 1.28 : vixSpot > 20 ? 1.05 : vixSpot > 15 ? 0.92 : 0.76
  const putsWidth = Math.min(Math.max((pcRatio / (pcRatio + 1)) * 100, 20), 80)

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Derivatives & Vol" loading={newsLoading && priceLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'prices')} onClick={() => setTab('prices')}>Vol ETFs</button>
        <button className={tabCls(tab === 'term')} onClick={() => setTab('term')}>Term Structure</button>
        <button className={tabCls(tab === 'greeks')} onClick={() => setTab('greeks')}>Greeks</button>
        <button className={tabCls(tab === 'flow')} onClick={() => setTab('flow')}>Flow</button>
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
                    <div className="font-medium">{VOL_NAMES[p.symbol] || p.symbol}</div>
                    <div className="text-muted-foreground text-[10px]">{p.symbol}</div>
                  </td>
                  <td className="text-right tabular-nums">${p.price.toFixed(2)}</td>
                  <td className={`text-right tabular-nums font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{p.changePercent.toFixed(2)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'term' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">VIX Futures Term Structure</span>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-px rounded-sm ${isBackwardation ? 'text-red-500 bg-red-500/10' : 'text-amber-500 bg-amber-500/10'}`}>
              {isBackwardation ? 'Backwardation' : 'Contango'}
            </span>
          </div>

          <LightweightChart
            type="area"
            data={chartData}
            height={expanded ? 300 : 120}
            lineColor="#f59e0b"
            areaTopColor="rgba(245,158,11,0.18)"
            areaBottomColor="rgba(245,158,11,0.02)"
          />

          <div className="grid grid-cols-8 gap-0.5 mt-1">
            {termStructure.map((pt) => (
              <div key={pt.month} className="text-center">
                <div className="text-[9px] text-muted-foreground">{pt.month}</div>
                <div className="text-[10px] tabular-nums font-medium">{pt.value.toFixed(1)}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/20 pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">Put/Call Ratio</span>
              <span className={`text-[10px] font-medium tabular-nums ${pcRatio > 1.1 ? 'text-red-500' : pcRatio < 0.85 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {pcRatio.toFixed(2)}
              </span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden gap-px">
              <div className="bg-red-500 rounded-l-full" style={{ width: `${putsWidth}%` }} />
              <div className="bg-emerald-500 rounded-r-full flex-1" />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[9px] text-muted-foreground">Puts</span>
              <span className="text-[9px] text-muted-foreground">Calls</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'greeks' && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1 p-1.5 rounded-sm bg-zinc-100 dark:bg-zinc-800/60 mb-2">
            <div className="text-center">
              <div className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Net Delta</div>
              <div className={`text-[11px] font-bold tabular-nums ${NET_GREEKS.delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {NET_GREEKS.delta.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Net Gamma</div>
              <div className="text-[11px] font-bold tabular-nums text-amber-500">{NET_GREEKS.gamma.toFixed(3)}</div>
            </div>
            <div className="text-center">
              <div className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Net Theta</div>
              <div className="text-[11px] font-bold tabular-nums text-red-500">{NET_GREEKS.theta.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Net Vega</div>
              <div className="text-[11px] font-bold tabular-nums text-violet-500">{NET_GREEKS.vega.toFixed(2)}</div>
            </div>
          </div>

          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-muted-foreground text-[9px]">
                <th className="text-left font-medium pb-1">Position</th>
                <th className="text-right font-medium pb-1">Delta</th>
                <th className="text-right font-medium pb-1">Gamma</th>
                <th className="text-right font-medium pb-1">Theta</th>
                <th className="text-right font-medium pb-1">Vega</th>
              </tr>
            </thead>
            <tbody>
              {GREEKS_DATA.map((r, i) => (
                <tr key={i} className="border-t border-border/20">
                  <td className="py-0.5">
                    <span className="font-medium">{r.symbol}</span>
                    <span className={`ml-1 text-[9px] font-bold ${r.type === 'CALL' ? 'text-emerald-600' : 'text-red-500'}`}>{r.type}</span>
                    <span className="text-muted-foreground ml-1">{r.strike} {r.expiry}</span>
                  </td>
                  <td className={`text-right tabular-nums font-medium ${r.delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{r.delta.toFixed(2)}</td>
                  <td className="text-right tabular-nums text-amber-500">{r.gamma.toFixed(3)}</td>
                  <td className="text-right tabular-nums text-red-500">{r.theta.toFixed(2)}</td>
                  <td className="text-right tabular-nums text-violet-500">{r.vega.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'flow' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">P/C Ratio</span>
              <span className={`text-[10px] font-bold tabular-nums ${FLOW_PC_RATIO > 1.1 ? 'text-red-500' : FLOW_PC_RATIO < 0.85 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {FLOW_PC_RATIO}
              </span>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-px rounded-sm ${CALL_PREMIUM >= PUT_PREMIUM ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
              {CALL_PREMIUM >= PUT_PREMIUM ? 'Bullish' : 'Bearish'} Signal
            </span>
          </div>

          <div className="flex h-1.5 rounded-full overflow-hidden gap-px mb-2">
            <div className="bg-red-500 rounded-l-full" style={{ width: `${FLOW_PUTS_WIDTH}%` }} />
            <div className="bg-emerald-500 rounded-r-full flex-1" />
          </div>
          <div className="flex justify-between -mt-1.5 mb-2">
            <span className="text-[9px] text-muted-foreground">Puts ${PUT_PREMIUM.toFixed(1)}M</span>
            <span className="text-[9px] text-muted-foreground">Calls ${CALL_PREMIUM.toFixed(1)}M</span>
          </div>

          <div className="space-y-0">
            {FLOW_DATA.map((r, i) => (
              <div key={i} className={`flex items-center gap-1 py-0.5 border-b border-border/20 last:border-0 rounded-sm px-0.5 ${r.type === 'CALL' ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                <span className={`font-bold ${expanded ? 'text-[12px]' : 'text-[10px]'} w-10 shrink-0`}>{r.symbol}</span>
                <span className={`${expanded ? 'text-[11px]' : 'text-[9px]'} font-bold w-8 shrink-0 ${r.type === 'CALL' ? 'text-emerald-600' : 'text-red-500'}`}>{r.type}</span>
                <span className={`${expanded ? 'text-[11px]' : 'text-[9px]'} text-muted-foreground w-10 shrink-0`}>${r.strike}</span>
                <span className={`${expanded ? 'text-[11px]' : 'text-[9px]'} text-muted-foreground w-10 shrink-0`}>{r.expiry}</span>
                <span className={`${expanded ? 'text-[11px]' : 'text-[9px]'} tabular-nums text-muted-foreground flex-1 text-right`}>{(r.volume / 1000).toFixed(1)}K</span>
                <span className={`${expanded ? 'text-[11px]' : 'text-[9px]'} tabular-nums font-medium flex-1 text-right`}>${r.premium}M</span>
                <span className={`text-[8px] font-bold px-1 py-px rounded-sm shrink-0 ${r.tag === 'SWEEP' ? 'text-amber-600 bg-amber-500/15' : 'text-violet-600 bg-violet-500/15'}`}>
                  {r.tag}
                </span>
              </div>
            ))}
          </div>
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
                    <span className="inline-block text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm mr-1 align-middle"
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
