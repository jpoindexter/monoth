import { useState, useEffect, useCallback } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useMarketStore } from '@/stores/market-store'
import { useNewsStore } from '@/stores/news-store'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { X, TrendingUp, TrendingDown } from 'lucide-react'

interface SymbolDetailSheetProps {
  ticker: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CandleData {
  time: string
  open: number
  high: number
  low: number
  close: number
}

type Range = '1W' | '1M' | '3M' | '6M' | '1Y'

const RANGE_DAYS: Record<Range, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }

function fmt(n: number, digits = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function fmtVol(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return String(n)
}

function relTime(ts: number) {
  const d = Math.floor((Date.now() - ts) / 1000)
  if (d < 60) return 'now'
  if (d < 3600) return `${Math.floor(d / 60)}m`
  if (d < 86400) return `${Math.floor(d / 3600)}h`
  return `${Math.floor(d / 86400)}d`
}

export function SymbolDetailSheet({ ticker, open, onOpenChange }: SymbolDetailSheetProps) {
  const indices = useMarketStore((s) => s.indices)
  const crypto = useMarketStore((s) => s.crypto)
  const allNews = useNewsStore((s) => s.items)
  const [candles, setCandles] = useState<CandleData[]>([])
  const [candleLoading, setCandleLoading] = useState(true)
  const [range, setRange] = useState<Range>('3M')
  const [tab, setTab] = useState<'overview' | 'chart' | 'news'>('overview')

  const indexMatch = indices.find((i) => i.symbol === ticker)
  const cryptoMatch = crypto.find((c) => c.symbol === ticker)

  const { data: quoteData } = usePolling({
    fetcher: useCallback(() => fetchQuotes([ticker]), [ticker]),
    interval: 60_000,
    enabled: open,
  })

  const quote = quoteData?.[0]
  const price = quote?.price ?? indexMatch?.price ?? cryptoMatch?.price ?? null
  const changePercent = quote?.changePercent ?? indexMatch?.changePercent ?? cryptoMatch?.changePercent24h ?? null
  const name = indexMatch?.name ?? cryptoMatch?.name ?? ticker
  const isPos = (changePercent ?? 0) >= 0

  useEffect(() => {
    if (!open) return
    setCandleLoading(true)
    const days = RANGE_DAYS[range]
    fetch(`/api/market/candles?symbol=${ticker}&resolution=D&days=${days}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) setCandles(data) })
      .catch(() => {})
      .finally(() => setCandleLoading(false))
  }, [ticker, open, range])

  // Compute stats from candles
  const closes = candles.map((c) => c.close)
  const high52 = closes.length ? Math.max(...closes) : null
  const low52 = closes.length ? Math.min(...closes) : null
  const firstClose = closes[0] ?? null
  const rangeChg = firstClose && price ? ((price - firstClose) / firstClose) * 100 : null
  const avgVol = candles.length ? candles.reduce((s, c) => s + ((c as any).volume ?? 0), 0) / candles.length : 0
  const highPct = high52 && price ? ((price - low52!) / (high52 - low52!)) * 100 : null

  // Related news
  const relatedNews = allNews
    .filter((n) => n.title.toLowerCase().includes(ticker.toLowerCase().replace('^', '')) || (name.length > 4 && n.title.toLowerCase().includes(name.toLowerCase().split(' ')[0])))
    .slice(0, 8)

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-2 py-1 font-medium transition-colors ${active ? 'text-foreground border-b border-foreground' : 'text-muted-foreground hover:text-foreground'}`

  const rangeCls = (r: Range) =>
    `text-[9px] px-1.5 py-0.5 rounded-sm font-medium transition-colors ${range === r ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:w-[420px] p-0 overflow-hidden flex flex-col border-l border-border/40 bg-[#0e0e0e]"
      >
        {/* Header */}
        <div className={`px-5 pt-5 pb-4 border-b border-border/20 ${isPos ? 'bg-emerald-950/10' : 'bg-red-950/10'}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[2px] text-muted-foreground mb-0.5">{ticker}</div>
              <div className="text-base font-semibold text-foreground leading-tight">{name}</div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground p-1 -mr-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {price !== null ? (
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold tabular-nums tracking-tight">
                ${fmt(price)}
              </span>
              {changePercent !== null && (
                <div className={`flex items-center gap-1 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span className="text-sm font-semibold tabular-nums">
                    {isPos ? '+' : ''}{changePercent.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-10 w-32 bg-muted/20 rounded animate-pulse" />
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/20 px-5 gap-4">
          <button className={tabCls(tab === 'overview')} onClick={() => setTab('overview')}>Overview</button>
          <button className={tabCls(tab === 'chart')} onClick={() => setTab('chart')}>Chart</button>
          <button className={tabCls(tab === 'news')} onClick={() => setTab('news')}>News {relatedNews.length > 0 && <span className="ml-1 text-[8px] text-muted-foreground">({relatedNews.length})</span>}</button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Overview tab */}
          {tab === 'overview' && (
            <div className="px-5 py-4 space-y-5">
              {/* Range bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Price Range ({range})</span>
                  <div className="flex gap-0.5">
                    {(['1W','1M','3M','6M','1Y'] as Range[]).map((r) => (
                      <button key={r} className={rangeCls(r)} onClick={() => setRange(r)}>{r}</button>
                    ))}
                  </div>
                </div>

                {/* Spark chart */}
                <div className="rounded-sm overflow-hidden border border-border/20">
                  {candleLoading ? (
                    <div className="h-28 flex items-center justify-center">
                      <span className="text-[9px] text-muted-foreground animate-pulse">Loading…</span>
                    </div>
                  ) : candles.length > 0 ? (
                    <LightweightChart
                      type="area"
                      data={candles}
                      height={112}
                      lineColor={isPos ? '#34d399' : '#f87171'}
                      areaTopColor={isPos ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'}
                      areaBottomColor="rgba(0,0,0,0)"
                    />
                  ) : (
                    <div className="h-28 flex items-center justify-center text-[9px] text-muted-foreground">No chart data</div>
                  )}
                </div>

                {/* 52W range indicator */}
                {high52 && low52 && price && highPct !== null && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
                      <span>${fmt(low52)} low</span>
                      <span>${fmt(high52)} high</span>
                    </div>
                    <div className="h-1 bg-border/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isPos ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.max(2, Math.min(100, highPct))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-px bg-border/20 rounded-sm overflow-hidden border border-border/20">
                {[
                  { label: `${range} Change`, value: rangeChg !== null ? `${rangeChg >= 0 ? '+' : ''}${rangeChg.toFixed(2)}%` : '—', colored: true, positive: (rangeChg ?? 0) >= 0 },
                  { label: 'Current Price', value: price !== null ? `$${fmt(price)}` : '—' },
                  { label: `${range} High`, value: high52 !== null ? `$${fmt(high52)}` : '—' },
                  { label: `${range} Low`, value: low52 !== null ? `$${fmt(low52)}` : '—' },
                  { label: 'Avg Volume', value: avgVol > 0 ? fmtVol(avgVol) : '—' },
                  { label: 'Data Points', value: candles.length > 0 ? `${candles.length} days` : '—' },
                ].map(({ label, value, colored, positive }) => (
                  <div key={label} className="bg-[#0e0e0e] px-3 py-2.5">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
                    <div className={`text-[12px] font-semibold tabular-nums ${colored ? (positive ? 'text-emerald-400' : 'text-red-400') : 'text-foreground'}`}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chart tab */}
          {tab === 'chart' && (
            <div className="px-5 py-4">
              <div className="flex justify-end gap-0.5 mb-2">
                {(['1W','1M','3M','6M','1Y'] as Range[]).map((r) => (
                  <button key={r} className={rangeCls(r)} onClick={() => setRange(r)}>{r}</button>
                ))}
              </div>
              <div className="rounded-sm overflow-hidden border border-border/20">
                {candleLoading ? (
                  <div className="h-64 flex items-center justify-center text-[9px] text-muted-foreground animate-pulse">Loading…</div>
                ) : candles.length > 0 ? (
                  <LightweightChart
                    type="area"
                    data={candles}
                    height={280}
                    lineColor={isPos ? '#34d399' : '#f87171'}
                    areaTopColor={isPos ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'}
                    areaBottomColor="rgba(0,0,0,0)"
                    showAxes
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-[9px] text-muted-foreground">No data</div>
                )}
              </div>
              {candles.length > 0 && (
                <div className="mt-3 text-[9px] text-muted-foreground text-center">{candles.length} trading days · Daily close</div>
              )}
            </div>
          )}

          {/* News tab */}
          {tab === 'news' && (
            <div className="px-5 py-4">
              {relatedNews.length === 0 ? (
                <div className="text-[10px] text-muted-foreground text-center py-8">No related news found for {ticker}</div>
              ) : (
                <div className="space-y-3">
                  {relatedNews.map((item, i) => (
                    <a
                      key={i}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border border-border/20 rounded-sm p-3 hover:border-border/50 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="text-[11px] font-medium text-foreground leading-snug mb-1.5">{item.title}</div>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                        <span>{item.source}</span>
                        <span>·</span>
                        <span>{relTime(item.published)}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
