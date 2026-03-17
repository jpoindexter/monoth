import { useState, useEffect, useCallback } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useMarketStore } from '@/stores/market-store'
import { useNewsStore } from '@/stores/news-store'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { X, TrendingUp, TrendingDown, Star, ExternalLink } from 'lucide-react'

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
type Tab = 'overview' | 'chart' | 'technical' | 'analyst' | 'fundamentals' | 'news'

const RANGE_DAYS: Record<Range, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }

const TA_OVERALL: Record<string, { label: string; cls: string }> = {
  strong_buy: { label: 'STRONG BUY', cls: 'text-emerald-400' },
  buy: { label: 'BUY', cls: 'text-emerald-500' },
  neutral: { label: 'NEUTRAL', cls: 'text-amber-400' },
  sell: { label: 'SELL', cls: 'text-red-500' },
  strong_sell: { label: 'STRONG SELL', cls: 'text-red-400' },
}

const ACTION_LABELS: Record<string, string> = { up: 'Upgrade', down: 'Downgrade', init: 'Initiated', reit: 'Reiterated' }
const ACTION_CLS: Record<string, string> = { up: 'text-emerald-400', down: 'text-red-400', init: 'text-amber-400', reit: 'text-muted-foreground' }

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

function signalBadge(signal: string) {
  const bullish = ['oversold', 'bullish'].includes(signal)
  const bearish = ['overbought', 'bearish'].includes(signal)
  const cls = bullish ? 'bg-emerald-500/10 text-emerald-400' : bearish ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
  return <span className={`text-[9px] px-1 py-0.5 rounded-sm font-medium uppercase ${cls}`}>{signal.replace('_', ' ')}</span>
}

const LS_KEY = 'ta-watchlist'
function loadWatchlist(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}
function saveWatchlist(list: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
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

  // Compute stats from candles
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

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-2 py-1 font-medium transition-colors ${active ? 'text-foreground border-b border-foreground' : 'text-muted-foreground hover:text-foreground'}`
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

        <div className="flex-1 overflow-y-auto">

          {/* Overview tab */}
          {tab === 'overview' && (
            <div className="px-5 py-4 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Price Range ({range})</span>
                  <div className="flex gap-0.5">
                    {(['1W','1M','3M','6M','1Y'] as Range[]).map((r) => (
                      <button key={r} className={rangeCls(r)} onClick={() => setRange(r)}>{r}</button>
                    ))}
                  </div>
                </div>
                <div className="rounded-sm overflow-hidden border border-border/20">
                  {candleLoading ? (
                    <div className="h-28 flex items-center justify-center">
                      <span className="text-[10px] text-muted-foreground animate-pulse">Loading…</span>
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
                    <div className="h-28 flex items-center justify-center text-[10px] text-muted-foreground">No chart data</div>
                  )}
                </div>
                {high52 && low52 && price && highPct !== null && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
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
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
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
                  <div className="h-64 flex items-center justify-center text-[10px] text-muted-foreground animate-pulse">Loading…</div>
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
                  <div className="h-64 flex items-center justify-center text-[10px] text-muted-foreground">No data</div>
                )}
              </div>
              {candles.length > 0 && (
                <div className="mt-3 text-[10px] text-muted-foreground text-center">{candles.length} trading days · Daily close</div>
              )}
            </div>
          )}

          {/* Technical tab */}
          {tab === 'technical' && (
            <div className="px-5 py-4">
              {taLoading && <div className="h-20 flex items-center justify-center text-[10px] text-muted-foreground animate-pulse">Loading…</div>}
              {!taLoading && !taData && <div className="text-[10px] text-muted-foreground text-center py-8">No technical data available</div>}
              {!taLoading && taData && (() => {
                const d = taData as any
                const overall = TA_OVERALL[d.overall] ?? { label: d.overall, cls: 'text-muted-foreground' }
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-1">Overall Signal</div>
                        <span className={`text-lg font-bold ${overall.cls}`}>{overall.label}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-[10px] ${d.bullishCount > d.bearishCount ? 'text-emerald-400' : 'text-red-400'}`}>{d.bullishCount} Bullish</div>
                        <div className="text-[10px] text-amber-400">{4 - d.bullishCount - d.bearishCount} Neutral</div>
                        <div className={`text-[10px] ${d.bearishCount > d.bullishCount ? 'text-red-400' : 'text-muted-foreground'}`}>{d.bearishCount} Bearish</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">RSI (14)</div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="relative h-2.5 flex-1 rounded-full overflow-hidden bg-zinc-800 mr-3">
                          <div className="absolute inset-y-0 left-[30%] right-[30%] bg-amber-500/20" />
                          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${d.rsi}%`, background: d.rsi < 30 ? '#34d399' : d.rsi > 70 ? '#f87171' : '#a1a1aa' }} />
                        </div>
                        <span className="text-[11px] tabular-nums font-medium shrink-0">{fmt(d.rsi, 1)}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>Oversold &lt;30</span><span>{signalBadge(d.rsiSignal)}</span><span>&gt;70 Overbought</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">MACD (12,26,9)</div>
                      {[['Line', fmt(d.macd.line, 3)], ['Signal', fmt(d.macd.signal, 3)], ['Histogram', (d.macd.histogram >= 0 ? '+' : '') + fmt(d.macd.histogram, 3)]].map(([k, v]) => (
                        <div key={k} className="flex justify-between py-1 border-t border-border/15 text-[11px]">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="tabular-nums">{v}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Moving Averages</div>
                      {([['SMA 20', d.sma20], ['SMA 50', d.sma50], ['SMA 200', d.sma200]] as [string, number][]).map(([label, val]) => (
                        <div key={label} className="flex justify-between py-1 border-t border-border/15 text-[11px]">
                          <span className="text-muted-foreground">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="tabular-nums">{fmt(val, 2)}</span>
                            <span className={`text-[9px] ${d.price >= val ? 'text-emerald-400' : 'text-red-400'}`}>{d.price >= val ? 'Above' : 'Below'}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Bollinger Bands (20,2)</div>
                      {([['Upper', d.bb.upper], ['Middle', d.bb.middle], ['Lower', d.bb.lower], ['Price', d.price]] as [string, number][]).map(([label, val]) => (
                        <div key={label} className="flex justify-between py-1 border-t border-border/15 text-[11px]">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="tabular-nums">{fmt(val, 2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[9px] text-muted-foreground/50 pt-1 text-center">
                      <button className="hover:text-muted-foreground transition-colors" onClick={() => { onOpenChange(false) }}>
                        Open in Tech Analysis panel for more
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Analyst tab */}
          {tab === 'analyst' && (
            <div className="px-5 py-4">
              {analystLoading && <div className="h-20 flex items-center justify-center text-[10px] text-muted-foreground animate-pulse">Loading…</div>}
              {!analystLoading && (!analystData || analystData.length === 0) && (
                <div className="text-[10px] text-muted-foreground text-center py-8">No analyst ratings in the last 90 days</div>
              )}
              {!analystLoading && analystData && analystData.length > 0 && (
                <div className="space-y-0">
                  {analystData.map((r: any, i) => (
                    <div key={i} className="flex items-start gap-2 border-t border-border/15 py-2">
                      <span className={`text-[9px] font-bold uppercase w-14 shrink-0 mt-0.5 ${ACTION_CLS[r.action] ?? 'text-muted-foreground'}`}>
                        {ACTION_LABELS[r.action] ?? r.action}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium truncate">{r.firm}</div>
                        {(r.fromGrade || r.toGrade) && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {r.fromGrade && <span>{r.fromGrade}</span>}
                            {r.fromGrade && r.toGrade && <span className="mx-1">→</span>}
                            {r.toGrade && <span className={ACTION_CLS[r.action] ?? ''}>{r.toGrade}</span>}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">{r.date?.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fundamentals tab */}
          {tab === 'fundamentals' && (
            <div className="px-5 py-4">
              {fundsLoading && <div className="h-20 flex items-center justify-center text-[10px] text-muted-foreground animate-pulse">Loading…</div>}
              {!fundsLoading && !fundamentals && <div className="text-[10px] text-muted-foreground text-center py-8">No fundamental data available</div>}
              {!fundsLoading && fundamentals && (() => {
                function fmtBig(n: number | null | undefined) {
                  if (n == null) return '—'
                  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T'
                  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
                  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
                  return '$' + n.toLocaleString()
                }
                function fmtPct(n: number | null | undefined) {
                  if (n == null) return '—'
                  return (n * 100).toFixed(1) + '%'
                }
                function fmtNum(n: number | null | undefined, digits = 2) {
                  if (n == null) return '—'
                  return n.toFixed(digits)
                }
                function Row({ label, value }: { label: string; value: string }) {
                  return (
                    <div className="flex justify-between py-1.5 border-b border-border/15">
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                      <span className="text-[11px] font-medium tabular-nums text-foreground">{value}</span>
                    </div>
                  )
                }
                const f = fundamentals as Record<string, number | null | undefined>
                return (
                  <div className="space-y-4">
                    {(fundamentals.sector || fundamentals.industry) && (
                      <div className="text-[10px] text-muted-foreground">
                        {fundamentals.sector as string}{fundamentals.industry ? ` · ${fundamentals.industry as string}` : ''}
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Valuation</div>
                      <Row label="P/E (TTM)" value={fmtNum(f.peRatio)} />
                      <Row label="Forward P/E" value={fmtNum(f.forwardPE)} />
                      <Row label="P/B" value={fmtNum(f.pbRatio)} />
                      <Row label="P/S (TTM)" value={fmtNum(f.priceToSales)} />
                      <Row label="EV/EBITDA" value={fmtNum(f.evToEbitda)} />
                      <Row label="PEG Ratio" value={fmtNum(f.pegRatio)} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Profitability</div>
                      <Row label="Net Margin" value={fmtPct(f.profitMargin)} />
                      <Row label="Operating Margin" value={fmtPct(f.operatingMargin)} />
                      <Row label="ROE" value={fmtPct(f.roe)} />
                      <Row label="ROA" value={fmtPct(f.roa)} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Growth</div>
                      <Row label="Revenue Growth" value={fmtPct(f.revenueGrowth)} />
                      <Row label="Earnings Growth" value={fmtPct(f.earningsGrowth)} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Balance Sheet</div>
                      <Row label="Market Cap" value={fmtBig(f.marketCap)} />
                      <Row label="Revenue (TTM)" value={fmtBig(f.revenue)} />
                      <Row label="EBITDA" value={fmtBig(f.ebitda)} />
                      <Row label="Debt/Equity" value={fmtNum(f.debtToEquity)} />
                      <Row label="Current Ratio" value={fmtNum(f.currentRatio)} />
                      <Row label="Beta" value={fmtNum(f.beta)} />
                    </div>
                  </div>
                )
              })()}
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
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border border-border/20 rounded-sm p-3 hover:border-border/50 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="text-[11px] font-medium text-foreground leading-snug mb-1.5">{item.title}</div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
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
