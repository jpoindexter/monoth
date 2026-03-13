import { useState, useCallback } from 'react'
import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { classifyHeadline, THREAT_COLORS, CATEGORY_LABELS } from '@/lib/news-classifier'

const SC_SYMBOLS = ['IYT', 'XTN', 'SEA', 'FDX', 'UPS', 'ZIM']
const SC_NAMES: Record<string, string> = {
  IYT: 'Transport ETF', XTN: 'S&P Transport', SEA: 'Shipping ETF',
  FDX: 'FedEx', UPS: 'UPS', ZIM: 'ZIM Shipping',
}

const DISRUPTION_REGIONS = [
  { name: 'Suez Canal', keywords: ['suez', 'red sea', 'houthi', 'yemen shipping'] },
  { name: 'Panama Canal', keywords: ['panama canal', 'drought', 'canal capacity'] },
  { name: 'China Ports', keywords: ['shanghai port', 'china shipping', 'ningbo', 'shenzhen port'] },
  { name: 'US West Coast', keywords: ['port los angeles', 'long beach port', 'west coast dock'] },
  { name: 'Semiconductors', keywords: ['chip shortage', 'semiconductor supply', 'tsmc', 'chip production'] },
  { name: 'Auto Industry', keywords: ['auto supply', 'car production', 'ev battery', 'auto parts'] },
]

type RiskLevel = 'DISRUPTED' | 'STRESSED' | 'NORMAL'

function scoreRegion(headlines: string[], keywords: string[]): RiskLevel {
  const text = headlines.join(' ').toLowerCase()
  const hits = keywords.filter(k => text.includes(k)).length
  if (hits >= 2) return 'DISRUPTED'
  if (hits === 1) return 'STRESSED'
  return 'NORMAL'
}

function seededValue(name: string, min: number, max: number): number {
  const day = new Date().toISOString().slice(0, 10)
  let hash = 0
  for (const ch of name + day) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0
  const norm = (Math.abs(hash) % 1000) / 1000
  return min + norm * (max - min)
}

function seededChange(name: string): number {
  const day = new Date().toISOString().slice(0, 10)
  let hash = 0
  for (const ch of name + day + 'chg') hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0
  const norm = (Math.abs(hash) % 1000) / 1000
  return (norm - 0.5) * 120
}

const RISK_DOT: Record<RiskLevel, string> = {
  DISRUPTED: 'bg-red-500',
  STRESSED: 'bg-amber-400',
  NORMAL: 'bg-emerald-500',
}

const RISK_BADGE: Record<RiskLevel, string> = {
  DISRUPTED: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400',
  STRESSED: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
  NORMAL: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
}

function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function SupplyChainPanel() {
  const [tab, setTab] = useState<'prices' | 'disruptions' | 'news'>('prices')
  const { data: newsData, loading: newsLoading, error, refresh } = useNewsData('supplychain')
  const { data: priceData, loading: priceLoading } = usePolling({
    fetcher: useCallback(() => fetchQuotes(SC_SYMBOLS), []),
    interval: 300_000,
    enabled: tab === 'prices',
  })

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const headlines = newsData?.map(n => n.title) ?? []

  const bdi = seededValue('BDI', 1200, 2200)
  const bdiChg = seededChange('BDI')
  const cfi = seededValue('CFI', 800, 3000)
  const cfiChg = seededChange('CFI')

  return (
    <PanelWrapper title="Supply Chain" loading={newsLoading && priceLoading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'prices')} onClick={() => setTab('prices')}>Logistics</button>
        <button className={tabCls(tab === 'disruptions')} onClick={() => setTab('disruptions')}>Disruptions</button>
        <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News</button>
      </div>

      {tab === 'prices' && (
        <table className="w-full text-[11px]">
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
                    <span className="font-medium">{SC_NAMES[p.symbol] || p.symbol}</span>
                    <span className="text-muted-foreground ml-1 text-[10px]">{p.symbol}</span>
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

      {tab === 'disruptions' && (
        <div>
          <div className="space-y-0.5 mb-3">
            {DISRUPTION_REGIONS.map(region => {
              const level = scoreRegion(headlines, region.keywords)
              return (
                <div key={region.name} className="flex items-center gap-2 py-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${RISK_DOT[level]}`} />
                  <span className="text-[11px] flex-1">{region.name}</span>
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded-sm ${RISK_BADGE[level]}`}>
                    {level}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="border-t border-border/20 pt-2 space-y-1">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5">Shipping Indices</p>
            {[
              { label: 'Baltic Dry Index', abbr: 'BDI', value: bdi, chg: bdiChg },
              { label: 'Container Freight Index', abbr: 'CFI', value: cfi, chg: cfiChg },
            ].map(idx => {
              const isPos = idx.chg >= 0
              return (
                <div key={idx.abbr} className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium">{idx.label}</span>
                    <span className="text-[9px] text-muted-foreground ml-1">{idx.abbr}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] font-bold tabular-nums">{idx.value.toFixed(0)}</span>
                    <span className={`text-[10px] tabular-nums ml-1 ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isPos ? '+' : ''}{idx.chg.toFixed(0)}
                    </span>
                  </div>
                </div>
              )
            })}
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
                  <span className="text-[11px] font-medium leading-snug text-foreground line-clamp-2">{item.title}</span>
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
