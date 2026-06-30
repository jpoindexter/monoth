import type { MarketDataPoint, CryptoAsset, ForexRate, YieldData } from '@/types'

export interface BriefSection {
  title: string
  content: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
}

export function generateBrief(
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
      content: `${bullish} of ${indices.length} indices positive. ${leader?.name || leader?.symbol} leads at ${(leader?.changePercent ?? 0) > 0 ? '+' : ''}${(leader?.changePercent ?? 0).toFixed(2)}%. Broad market ${sentiment === 'bullish' ? 'risk-on' : sentiment === 'bearish' ? 'risk-off' : 'mixed'}.`,
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

  const spy = indices.find((i) => i.symbol === 'SPY' || i.symbol === 'spy')
  const btc = crypto.find((c) => c.symbol === 'btc' || c.symbol === 'bitcoin')
  const gold = commodities.find((c) => c.symbol === 'GC' || c.symbol === 'GOLD' || c.symbol === 'gold' || (c.name || '').toLowerCase().includes('gold'))
  const tenYear = yields.find((y) => y.maturity === '10Y' || y.maturity === '10y')

  const riskOnScore = [spy ? spy.changePercent : null, btc ? btc.changePercent24h : null].filter((v): v is number => v !== null)
  const safeHavenScore = [gold ? gold.changePercent : null, tenYear ? -tenYear.change : null].filter((v): v is number => v !== null)

  if (riskOnScore.length > 0) {
    const riskOnAvg = riskOnScore.reduce((a, b) => a + b, 0) / riskOnScore.length
    const safeHavenAvg = safeHavenScore.length > 0 ? safeHavenScore.reduce((a, b) => a + b, 0) / safeHavenScore.length : 0
    const appSentiment: BriefSection['sentiment'] =
      riskOnAvg > 0.5 && safeHavenAvg <= 0 ? 'bullish' :
      riskOnAvg < -0.5 && safeHavenAvg > 0 ? 'bearish' : 'neutral'
    const desc =
      appSentiment === 'bullish' ? 'Risk assets leading, safe havens lagging. Appetite is elevated.' :
      appSentiment === 'bearish' ? 'Safe havens outperforming. Capital rotating defensive.' :
      'Mixed rotation. No clear risk-on or risk-off conviction.'
    sections.push({ title: 'Risk Appetite', content: desc, sentiment: appSentiment })
  }

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
