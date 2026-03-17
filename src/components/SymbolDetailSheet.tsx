import { useState, useEffect, useCallback } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useMarketStore } from '@/stores/market-store'
import { useNewsStore } from '@/stores/news-store'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { fmt, tabCls } from '@/lib/panel-utils'
import { X, TrendingUp, TrendingDown, Star, ExternalLink } from 'lucide-react'
import { SymbolDetailOverview } from './symbol-detail/SymbolDetailOverview'
import { SymbolDetailChart } from './symbol-detail/SymbolDetailChart'
import { SymbolDetailTechnical } from './symbol-detail/SymbolDetailTechnical'
import { SymbolDetailAnalyst } from './symbol-detail/SymbolDetailAnalyst'
import { SymbolDetailFundamentals } from './symbol-detail/SymbolDetailFundamentals'
import { SymbolDetailNews } from './symbol-detail/SymbolDetailNews'
import { RANGE_DAYS, loadWatchlist, saveWatchlist, type Range, type Tab } from './symbol-detail/helpers'

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

export function SymbolDetailSheet({ ticker, open, onOpenChange }: SymbolDetailSheetProps) {
  const indices = useMarketStore((s) => s.indices)
  const crypto = useMarketStore((s) => s.crypto)
  const allNews = useNewsStore((s) => s.items)
  const [candles, setCandles] = useState<CandleData[]>([])
  const [candleLoading, setCandleLoading] = useState(true)
  const [range, setRange] = useState<Range>('3M')
  const [fundamentals, setFundamentals] = useState<Record<string, number | string | null> | null>(null)
  const [fundsLoading, setFundsLoading] = useState(false)
  const [taData, setTaData] = useState<Record<string, unknown> | null>(null)
  const [taLoading, setTaLoading] = useState(false)
  const [analystData, setAnalystData] = useState<unknown[] | null>(null)
  const [analystLoading, setAnalystLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [watchlisted, setWatchlisted] = useState(false)

  const indexMatch = indices.find((i) => i.symbol === ticker)
  const cryptoMatch = crypto.find((c) => c.symbol === ticker)

  useEffect(() => {
    if (open) setWatchlisted(loadWatchlist().includes(ticker))
  }, [ticker, open])

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
    if (!open || tab !== 'fundamentals') return
    setFundsLoading(true)
    fetch(`/api/market/fundamentals?symbol=${ticker}`)
      .then((r) => r.json())
      .then((d) => setFundamentals(d))
      .catch(() => {})
      .finally(() => setFundsLoading(false))
  }, [ticker, open, tab])

  useEffect(() => {
    if (!open || tab !== 'technical') return
    setTaLoading(true)
    fetch(`/api/market/tech-analysis?symbol=${ticker}`)
      .then((r) => r.json())
      .then((d) => setTaData(d))
      .catch(() => {})
      .finally(() => setTaLoading(false))
  }, [ticker, open, tab])

  useEffect(() => {
    if (!open || tab !== 'analyst') return
    setAnalystLoading(true)
    fetch('/api/market/analyst')
      .then((r) => r.json())
      .then((d: unknown[]) => setAnalystData(d.filter((r: any) => r.ticker === ticker)))
      .catch(() => {})
      .finally(() => setAnalystLoading(false))
  }, [ticker, open, tab])

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

  const closes = candles.map((c) => c.close)
  const high52 = closes.length ? Math.max(...closes) : null
  const low52 = closes.length ? Math.min(...closes) : null
  const firstClose = closes[0] ?? null
  const rangeChg = firstClose && price ? ((price - firstClose) / firstClose) * 100 : null
  const avgVol = candles.length ? candles.reduce((s, c) => s + ((c as any).volume ?? 0), 0) / candles.length : 0
  const highPct = high52 && low52 && price ? ((price - low52) / (high52 - low52)) * 100 : null

  const relatedNews = allNews
    .filter((n) => n.title.toLowerCase().includes(ticker.toLowerCase().replace('^', '')) || (name.length > 4 && n.title.toLowerCase().includes(name.toLowerCase().split(' ')[0] ?? '')))
    .slice(0, 8)

  const rangeCls = (r: Range) =>
    `text-[10px] px-1.5 py-0.5 rounded-sm font-medium transition-colors ${range === r ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  function toggleWatchlist() {
    const list = loadWatchlist()
    const next = list.includes(ticker) ? list.filter((s) => s !== ticker) : [...list, ticker].slice(0, 10)
    saveWatchlist(next)
    setWatchlisted(next.includes(ticker))
  }

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
            <div className="flex items-center gap-1">
              <button
                onClick={toggleWatchlist}
                title={watchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                className={`p-1.5 rounded transition-colors ${watchlisted ? 'text-amber-400 hover:text-amber-300' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Star className="w-3.5 h-3.5" fill={watchlisted ? 'currentColor' : 'none'} />
              </button>
              <a
                href={`https://finance.yahoo.com/quote/${ticker}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Yahoo Finance"
                className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground hover:text-foreground p-1 -mr-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
        <div className="flex border-b border-border/20 px-5 gap-4 overflow-x-auto scrollbar-none">
          {(['overview', 'chart', 'technical', 'analyst', 'fundamentals', 'news'] as Tab[]).map((t) => (
            <button key={t} className={tabCls(tab === t)} onClick={() => setTab(t)}>
              {t === 'news' && relatedNews.length > 0
                ? `News (${relatedNews.length})`
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'overview' && (
            <SymbolDetailOverview
              range={range}
              setRange={setRange}
              candles={candles}
              candleLoading={candleLoading}
              price={price}
              isPos={isPos}
              rangeChg={rangeChg}
              high52={high52}
              low52={low52}
              highPct={highPct}
              avgVol={avgVol}
              rangeCls={rangeCls}
            />
          )}
          {tab === 'chart' && (
            <SymbolDetailChart
              range={range}
              setRange={setRange}
              candles={candles}
              candleLoading={candleLoading}
              isPos={isPos}
              rangeCls={rangeCls}
            />
          )}
          {tab === 'technical' && (
            <SymbolDetailTechnical
              taLoading={taLoading}
              taData={taData}
              onClose={() => onOpenChange(false)}
            />
          )}
          {tab === 'analyst' && (
            <SymbolDetailAnalyst
              analystLoading={analystLoading}
              analystData={analystData}
            />
          )}
          {tab === 'fundamentals' && (
            <SymbolDetailFundamentals
              fundsLoading={fundsLoading}
              fundamentals={fundamentals}
            />
          )}
          {tab === 'news' && (
            <SymbolDetailNews
              ticker={ticker}
              relatedNews={relatedNews}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
