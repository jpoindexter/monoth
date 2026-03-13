import { useState, useEffect } from 'react'
import { useMarketStore } from '@/stores'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import type { MarketDataPoint, CryptoAsset, ForexRate, YieldData } from '@/types'

interface BriefSection {
  title: string
  content: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
}

function generateBrief(
  indices: MarketDataPoint[],
  crypto: CryptoAsset[],
  forex: ForexRate[],
  commodities: MarketDataPoint[],
  yields: YieldData[],
): BriefSection[] {
  const sections: BriefSection[] = []

  if (indices.length > 0) {
    const avg = indices.reduce((sum, i) => sum + i.changePercent, 0) / indices.length
    const bullish = indices.filter((i) => i.changePercent > 0).length
    const sentiment = avg > 0.5 ? 'bullish' : avg < -0.5 ? 'bearish' : 'neutral'
    const leader = [...indices].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))[0]

    sections.push({
      title: 'Equities',
      content: `${bullish} of ${indices.length} indices positive. ${leader?.name || leader?.symbol} leads at ${leader?.changePercent > 0 ? '+' : ''}${leader?.changePercent.toFixed(2)}%. Broad market ${sentiment === 'bullish' ? 'risk-on' : sentiment === 'bearish' ? 'risk-off' : 'mixed'}.`,
      sentiment,
    })
  }

  if (crypto.length > 0) {
    const btc = crypto.find((c) => c.symbol === 'btc' || c.symbol === 'bitcoin')
    const eth = crypto.find((c) => c.symbol === 'eth' || c.symbol === 'ethereum')
    const avg = crypto.slice(0, 10).reduce((sum, c) => sum + c.changePercent24h, 0) / Math.min(crypto.length, 10)
    const sentiment = avg > 2 ? 'bullish' : avg < -2 ? 'bearish' : 'neutral'

    let content = ''
    if (btc) content += `BTC $${btc.price.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${btc.changePercent24h > 0 ? '+' : ''}${btc.changePercent24h.toFixed(1)}%)`
    if (eth) content += `, ETH $${eth.price.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${eth.changePercent24h > 0 ? '+' : ''}${eth.changePercent24h.toFixed(1)}%)`
    content += `. Top 10 avg ${avg > 0 ? '+' : ''}${avg.toFixed(1)}%.`

    sections.push({ title: 'Crypto', content, sentiment })
  }

  if (forex.length > 0) {
    const bigMoves = forex.filter((f) => Math.abs(f.changePercent) > 0.3)
    const sentiment = bigMoves.length > 2 ? 'bearish' : 'neutral'
    const content = bigMoves.length > 0
      ? `Notable moves: ${bigMoves.slice(0, 3).map((f) => `${f.pair} ${f.changePercent > 0 ? '+' : ''}${f.changePercent.toFixed(2)}%`).join(', ')}.`
      : 'Currency markets relatively stable. No major moves in major pairs.'

    sections.push({ title: 'Forex', content, sentiment })
  }

  // Risk Appetite
  const spy = indices.find((i) => i.symbol === 'SPY' || i.symbol === 'spy')
  const btc = crypto.find((c) => c.symbol === 'btc' || c.symbol === 'bitcoin')
  const gold = commodities.find((c) => c.symbol === 'GC' || c.symbol === 'GOLD' || c.symbol === 'gold' || (c.name || '').toLowerCase().includes('gold'))
  const tenYear = yields.find((y) => y.maturity === '10Y' || y.maturity === '10y')

  const riskOnScore = [
    spy ? spy.changePercent : null,
    btc ? btc.changePercent24h : null,
  ].filter((v): v is number => v !== null)

  const safeHavenScore = [
    gold ? gold.changePercent : null,
    tenYear ? -tenYear.change : null,
  ].filter((v): v is number => v !== null)

  if (riskOnScore.length > 0) {
    const riskOnAvg = riskOnScore.reduce((a, b) => a + b, 0) / riskOnScore.length
    const safeHavenAvg = safeHavenScore.length > 0
      ? safeHavenScore.reduce((a, b) => a + b, 0) / safeHavenScore.length
      : 0

    const appSentiment: BriefSection['sentiment'] =
      riskOnAvg > 0.5 && safeHavenAvg <= 0 ? 'bullish' :
      riskOnAvg < -0.5 && safeHavenAvg > 0 ? 'bearish' : 'neutral'

    const desc =
      appSentiment === 'bullish' ? 'Risk assets leading, safe havens lagging. Appetite is elevated.' :
      appSentiment === 'bearish' ? 'Safe havens outperforming. Capital rotating defensive.' :
      'Mixed rotation. No clear risk-on or risk-off conviction.'

    sections.push({ title: 'Risk Appetite', content: desc, sentiment: appSentiment })
  }

  // Key Levels
  if (spy && spy.price > 0) {
    const roundTo = (n: number, step: number) => Math.round(n / step) * step
    const nearest50 = roundTo(spy.price, 50)
    const nearest100 = roundTo(spy.price, 100)
    const distTo50 = ((spy.price - nearest50) / nearest50 * 100).toFixed(2)
    const distTo100 = ((spy.price - nearest100) / nearest100 * 100).toFixed(2)
    const above50 = spy.price >= nearest50
    const above100 = spy.price >= nearest100

    sections.push({
      title: 'Key Levels',
      content: `SPY $${spy.price.toFixed(2)}. ${above50 ? '+' : ''}${distTo50}% from $${nearest50} (50-level), ${above100 ? '+' : ''}${distTo100}% from $${nearest100} (100-level).`,
      sentiment: 'neutral',
    })
  }

  const overallSentiments = sections.map((s) => s.sentiment)
  const bullishCount = overallSentiments.filter((s) => s === 'bullish').length
  const bearishCount = overallSentiments.filter((s) => s === 'bearish').length
  const overall = bullishCount > bearishCount ? 'bullish' : bearishCount > bullishCount ? 'bearish' : 'neutral'

  sections.push({
    title: 'Outlook',
    content: overall === 'bullish'
      ? 'Risk appetite elevated across asset classes. Watch for overextension signals.'
      : overall === 'bearish'
        ? 'Defensive positioning warranted. Monitor safe-haven flows and credit spreads.'
        : 'Mixed signals across markets. Await catalyst for directional conviction.',
    sentiment: overall,
  })

  return sections
}

type SignalLevel = 'BULLISH' | 'BULL' | 'NEUTRAL' | 'BEAR' | 'BEARISH'

function getSignal(change: number): SignalLevel {
  if (change > 1) return 'BULLISH'
  if (change > 0.3) return 'BULL'
  if (change < -1) return 'BEARISH'
  if (change < -0.3) return 'BEAR'
  return 'NEUTRAL'
}

function signalCls(sig: SignalLevel) {
  switch (sig) {
    case 'BULLISH': return 'bg-emerald-500/20 text-emerald-500'
    case 'BULL':    return 'bg-emerald-500/10 text-emerald-600'
    case 'BEARISH': return 'bg-red-500/20 text-red-500'
    case 'BEAR':    return 'bg-red-500/10 text-red-400'
    default:        return 'bg-yellow-500/10 text-yellow-500'
  }
}

function vixLabel(vix: number): { label: string; cls: string } {
  if (vix < 15)  return { label: 'LOW',      cls: 'bg-emerald-500/20 text-emerald-500' }
  if (vix < 20)  return { label: 'NORMAL',   cls: 'bg-yellow-500/10 text-yellow-500' }
  if (vix < 30)  return { label: 'ELEVATED', cls: 'bg-orange-500/10 text-orange-400' }
  return               { label: 'HIGH',      cls: 'bg-red-500/20 text-red-500' }
}

interface ScorecardRow {
  asset: string
  value: string
  change: number | null
  vix?: number
}

function Scorecard({
  indices,
  crypto,
  forex,
  commodities,
  yields,
}: {
  indices: MarketDataPoint[]
  crypto: CryptoAsset[]
  forex: ForexRate[]
  commodities: MarketDataPoint[]
  yields: YieldData[]
}) {
  const spy   = indices.find((i) => i.symbol === 'SPY'  || i.symbol === 'spy')
  const efa   = indices.find((i) => i.symbol === 'EFA'  || i.symbol === 'efa')
  const btc   = crypto.find((c)  => c.symbol === 'btc'  || c.symbol === 'bitcoin')
  const dxy   = forex.find((f)   => f.pair   === 'DXY'  || f.pair === 'USD' || f.pair.startsWith('DXY'))
  const gold  = commodities.find((c) => c.symbol === 'GC' || c.symbol === 'GOLD' || c.symbol === 'gold' || (c.name || '').toLowerCase().includes('gold'))
  const tnote = yields.find((y)  => y.maturity === '10Y' || y.maturity === '10y')
  const vix   = indices.find((i) => i.symbol === 'VIX'  || i.symbol === 'vix')

  const fmt = (v: number, decimals = 2) => `${v > 0 ? '+' : ''}${v.toFixed(decimals)}%`

  const rows: ScorecardRow[] = [
    spy   ? { asset: 'US Equities',   value: `$${spy.price.toFixed(2)}`,                                     change: spy.changePercent }              : { asset: 'US Equities',   value: '—', change: null },
    efa   ? { asset: 'Intl Equities', value: `$${efa.price.toFixed(2)}`,                                     change: efa.changePercent }              : { asset: 'Intl Equities', value: '—', change: null },
    btc   ? { asset: 'Crypto',        value: `$${btc.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, change: btc.changePercent24h }    : { asset: 'Crypto',        value: '—', change: null },
    dxy   ? { asset: 'Forex (DXY)',   value: dxy.rate.toFixed(2),                                            change: dxy.changePercent }              : { asset: 'Forex (DXY)',   value: '—', change: null },
    gold  ? { asset: 'Commodities',   value: `$${gold.price.toFixed(0)}`,                                    change: gold.changePercent }             : { asset: 'Commodities',   value: '—', change: null },
    tnote ? { asset: 'Fixed Income',  value: `${tnote.yield.toFixed(2)}%`,                                   change: tnote.change }                   : { asset: 'Fixed Income',  value: '—', change: null },
    vix   ? { asset: 'Volatility',    value: vix.price.toFixed(1),                                           change: null, vix: vix.price }           : { asset: 'Volatility',    value: '—', change: null },
  ]

  return (
    <table className="w-full text-[11px] border-collapse">
      <thead>
        <tr className="text-[9px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
          <th className="text-left pb-1 font-medium">Asset Class</th>
          <th className="text-right pb-1 font-medium">Value</th>
          <th className="text-right pb-1 font-medium pl-2">Signal</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const hasChange = row.change !== null
          const isVix = row.vix !== undefined
          const sig = hasChange ? getSignal(row.change!) : null
          const vixInfo = isVix ? vixLabel(row.vix!) : null

          return (
            <tr key={row.asset} className="border-b border-border/20 last:border-0">
              <td className="py-1 text-foreground/80">{row.asset}</td>
              <td className="py-1 text-right tabular-nums text-foreground/60">
                {hasChange ? (
                  <span className={row.change! > 0 ? 'text-emerald-500' : row.change! < 0 ? 'text-red-400' : 'text-foreground/60'}>
                    {row.change! > 0 ? '▲' : row.change! < 0 ? '▼' : '─'} {Math.abs(row.change!).toFixed(2)}%
                  </span>
                ) : isVix ? (
                  <span className="text-foreground/60">─ {row.value}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-1 text-right pl-2">
                {sig && (
                  <span className={`text-[8px] font-bold uppercase px-1 py-px rounded-sm ${signalCls(sig)}`}>
                    {sig}
                  </span>
                )}
                {vixInfo && (
                  <span className={`text-[8px] font-bold uppercase px-1 py-px rounded-sm ${vixInfo.cls}`}>
                    {vixInfo.label}
                  </span>
                )}
                {!sig && !vixInfo && <span className="text-muted-foreground text-[9px]">—</span>}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default function DailyBriefPanel() {
  const expanded = useIsExpanded()
  const indices     = useMarketStore((s) => s.indices)
  const crypto      = useMarketStore((s) => s.crypto)
  const forex       = useMarketStore((s) => s.forex)
  const commodities = useMarketStore((s) => s.commodities)
  const yields      = useMarketStore((s) => s.yields)
  const [brief, setBrief] = useState<BriefSection[]>([])
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [tab, setTab] = useState<'rules' | 'scorecard' | 'ai'>('rules')

  useEffect(() => {
    if (indices.length > 0 || crypto.length > 0 || forex.length > 0) {
      setBrief(generateBrief(indices, crypto, forex, commodities, yields))
    }
  }, [indices, crypto, forex, commodities, yields])

  useEffect(() => {
    if (tab === 'ai' && !aiSummary) {
      fetch('/api/ai/summary')
        .then(r => r.json())
        .then(data => {
          if (data.summary) setAiSummary(data.summary)
        })
        .catch(() => {})
    }
  }, [tab, aiSummary])

  const hasData = indices.length > 0 || crypto.length > 0 || forex.length > 0

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Daily Brief">
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'rules')}     onClick={() => setTab('rules')}>Analysis</button>
        <button className={tabCls(tab === 'scorecard')} onClick={() => setTab('scorecard')}>Scorecard</button>
        <button className={tabCls(tab === 'ai')}        onClick={() => setTab('ai')}>AI Summary</button>
      </div>

      {tab === 'rules' && !hasData && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Waiting for market data...</div>
      )}

      {tab === 'rules' && hasData && (
        <div className={`space-y-${expanded ? '3' : '2'}`}>
          {brief.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`font-semibold uppercase tracking-wider text-muted-foreground ${expanded ? 'text-[12px]' : 'text-[10px]'}`}>{section.title}</span>
                <span className={`font-bold uppercase tracking-wider px-1 py-px rounded-sm ${expanded ? 'text-[10px]' : 'text-[8px]'} ${
                  section.sentiment === 'bullish' ? 'bg-emerald-500/10 text-emerald-600' :
                  section.sentiment === 'bearish' ? 'bg-red-500/10 text-red-500' :
                  'bg-yellow-500/10 text-yellow-600'
                }`}>
                  {section.sentiment}
                </span>
              </div>
              <p className={`leading-relaxed text-foreground/80 ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>{section.content}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'scorecard' && !hasData && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">Waiting for market data...</div>
      )}

      {tab === 'scorecard' && hasData && (
        <Scorecard
          indices={indices}
          crypto={crypto}
          forex={forex}
          commodities={commodities}
          yields={yields}
        />
      )}

      {tab === 'ai' && !aiSummary && (
        <div className="py-4 text-center text-muted-foreground text-[10px]">
          Loading AI summary...
        </div>
      )}

      {tab === 'ai' && aiSummary && (
        <div className={`leading-relaxed text-foreground/80 whitespace-pre-line ${expanded ? 'text-[13px]' : 'text-[11px]'}`}>
          {aiSummary}
        </div>
      )}
    </PanelWrapper>
  )
}
