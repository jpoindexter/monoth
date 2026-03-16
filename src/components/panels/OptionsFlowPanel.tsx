import { useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { tabCls } from '@/lib/panel-utils'

type Sentiment = 'bullish' | 'bearish' | 'neutral'
type Tab = 'flow' | 'sweeps' | 'putcall'

interface FlowRow {
  ticker: string
  exp: string
  strike: string
  type: 'C' | 'P'
  size: number
  premium: number
  oi: number
  sentiment: Sentiment
}

interface SweepRow {
  ticker: string
  exp: string
  strike: string
  type: 'C' | 'P'
  size: number
  premium: number
  aggressor: 'Buy' | 'Sell'
}

interface PCRow {
  symbol: string
  ratio: number
  trend: 'up' | 'down'
  note: string
}

interface OptionsFlowData {
  flow: FlowRow[]
  sweeps: SweepRow[]
  putcall: { overall: number; rows: PCRow[] }
  updatedAt: string
}

const MOCK: OptionsFlowData = {
  flow: [
    { ticker: 'NVDA',  exp: '3/21', strike: '900C',  type: 'C', size: 5200,  premium: 4800000,  oi: 18200, sentiment: 'bullish'  },
    { ticker: 'SPY',   exp: '3/28', strike: '510P',  type: 'P', size: 9800,  premium: 3900000,  oi: 42100, sentiment: 'bearish'  },
    { ticker: 'TSLA',  exp: '4/4',  strike: '200C',  type: 'C', size: 7400,  premium: 3200000,  oi: 29400, sentiment: 'bullish'  },
    { ticker: 'QQQ',   exp: '3/21', strike: '440P',  type: 'P', size: 11200, premium: 2900000,  oi: 55800, sentiment: 'bearish'  },
    { ticker: 'AAPL',  exp: '4/18', strike: '185C',  type: 'C', size: 4100,  premium: 2600000,  oi: 22300, sentiment: 'bullish'  },
    { ticker: 'META',  exp: '3/28', strike: '520C',  type: 'C', size: 3300,  premium: 2100000,  oi: 14700, sentiment: 'bullish'  },
    { ticker: 'AMZN',  exp: '4/4',  strike: '180P',  type: 'P', size: 6800,  premium: 1800000,  oi: 31200, sentiment: 'neutral'  },
    { ticker: 'MSFT',  exp: '3/21', strike: '400C',  type: 'C', size: 2900,  premium: 1600000,  oi: 19800, sentiment: 'bullish'  },
    { ticker: 'SPY',   exp: '4/18', strike: '500C',  type: 'C', size: 8200,  premium: 1400000,  oi: 67300, sentiment: 'bullish'  },
    { ticker: 'IWM',   exp: '3/28', strike: '200P',  type: 'P', size: 5500,  premium: 1100000,  oi: 28400, sentiment: 'bearish'  },
    { ticker: 'GOOGL', exp: '4/4',  strike: '155C',  type: 'C', size: 2100,  premium:  920000,  oi:  9800, sentiment: 'bullish'  },
    { ticker: 'COIN',  exp: '3/21', strike: '250C',  type: 'C', size: 3800,  premium:  840000,  oi: 17200, sentiment: 'bullish'  },
    { ticker: 'NVDA',  exp: '3/28', strike: '850P',  type: 'P', size: 4400,  premium:  760000,  oi: 24600, sentiment: 'bearish'  },
    { ticker: 'PLTR',  exp: '4/18', strike: '25C',   type: 'C', size: 9100,  premium:  680000,  oi: 41700, sentiment: 'bullish'  },
    { ticker: 'XLF',   exp: '3/21', strike: '40P',   type: 'P', size: 7300,  premium:  540000,  oi: 33900, sentiment: 'neutral'  },
  ],
  sweeps: [
    { ticker: 'NVDA',  exp: '3/21', strike: '900C',  type: 'C', size: 5200,  premium: 4800000,  aggressor: 'Buy'  },
    { ticker: 'SPY',   exp: '3/28', strike: '510P',  type: 'P', size: 9800,  premium: 3900000,  aggressor: 'Sell' },
    { ticker: 'TSLA',  exp: '4/4',  strike: '200C',  type: 'C', size: 7400,  premium: 3200000,  aggressor: 'Buy'  },
    { ticker: 'META',  exp: '3/28', strike: '520C',  type: 'C', size: 3300,  premium: 2100000,  aggressor: 'Buy'  },
    { ticker: 'AAPL',  exp: '4/18', strike: '185C',  type: 'C', size: 4100,  premium: 2600000,  aggressor: 'Buy'  },
    { ticker: 'QQQ',   exp: '3/21', strike: '440P',  type: 'P', size: 11200, premium: 2900000,  aggressor: 'Sell' },
    { ticker: 'MSFT',  exp: '3/21', strike: '400C',  type: 'C', size: 2900,  premium: 1600000,  aggressor: 'Buy'  },
    { ticker: 'COIN',  exp: '3/21', strike: '250C',  type: 'C', size: 3800,  premium:  840000,  aggressor: 'Buy'  },
    { ticker: 'IWM',   exp: '3/28', strike: '200P',  type: 'P', size: 5500,  premium: 1100000,  aggressor: 'Sell' },
    { ticker: 'PLTR',  exp: '4/18', strike: '25C',   type: 'C', size: 9100,  premium:  680000,  aggressor: 'Buy'  },
  ],
  putcall: {
    overall: 0.72,
    rows: [
      { symbol: 'TSLA',  ratio: 0.38, trend: 'down', note: 'Heavy call buying'   },
      { symbol: 'NVDA',  ratio: 0.44, trend: 'down', note: 'Bullish positioning' },
      { symbol: 'COIN',  ratio: 0.51, trend: 'down', note: 'Calls dominant'      },
      { symbol: 'META',  ratio: 0.55, trend: 'down', note: 'Bullish flow'        },
      { symbol: 'AAPL',  ratio: 0.62, trend: 'down', note: 'Mild call bias'      },
      { symbol: 'SPY',   ratio: 0.72, trend: 'up',   note: 'Near neutral'        },
      { symbol: 'QQQ',   ratio: 0.88, trend: 'up',   note: 'Mild put bias'       },
      { symbol: 'XLF',   ratio: 1.14, trend: 'up',   note: 'Put heavy'           },
      { symbol: 'IWM',   ratio: 1.32, trend: 'up',   note: 'Bearish positioning' },
      { symbol: 'AMZN',  ratio: 1.58, trend: 'up',   note: 'Heavy put buying'    },
    ],
  },
  updatedAt: new Date().toISOString(),
}

function fmtPremium(n: number) {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
  return '$' + (n / 1e3).toFixed(0) + 'K'
}

function fmtSize(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

function fmtOI(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

function SentimentBadge({ s }: { s: Sentiment }) {
  const cls =
    s === 'bullish' ? 'bg-emerald-500/15 text-emerald-400' :
    s === 'bearish' ? 'bg-red-500/15 text-red-400' :
    'bg-muted text-muted-foreground'
  return (
    <span className={`text-[9px] font-medium px-1 py-0.5 rounded-sm uppercase tracking-wide ${cls}`}>
      {s}
    </span>
  )
}

const hdrCls = 'text-[10px] uppercase tracking-wider text-muted-foreground'

interface FlowTableProps {
  rows: (FlowRow | SweepRow)[]
  showAggressor?: boolean
  expanded: boolean
}

function FlowTable({ rows, showAggressor, expanded }: FlowTableProps) {
  const displayRows = !showAggressor && !expanded ? rows.slice(0, 10) : rows
  return (
    <div className="space-y-0">
      <div className="flex items-center gap-1 pb-1">
        <span className={`${hdrCls} w-[38px]`}>Ticker</span>
        <span className={`${hdrCls} w-[28px]`}>Exp</span>
        <span className={`${hdrCls} w-[34px]`}>Strike</span>
        <span className={`${hdrCls} w-[16px] text-center`}>T</span>
        <span className={`${hdrCls} w-[36px] text-right`}>Size</span>
        <span className={`${hdrCls} w-[44px] text-right`}>Prem</span>
        {!showAggressor && <span className={`${hdrCls} w-[32px] text-right`}>OI</span>}
        {showAggressor
          ? <span className={`${hdrCls} flex-1`}>Aggr</span>
          : expanded && <span className={`${hdrCls} flex-1`}>Sent</span>
        }
      </div>
      {displayRows.map((r, i) => (
        <div key={i} className="flex items-center gap-1 border-t border-border/15 pt-1">
          <span className="text-[11px] font-bold w-[38px] shrink-0">{r.ticker}</span>
          <span className="text-[10px] text-muted-foreground w-[28px] shrink-0">{r.exp}</span>
          <span className="text-[10px] w-[34px] shrink-0">{r.strike}</span>
          <span className={`text-[10px] font-bold w-[16px] text-center shrink-0 ${r.type === 'C' ? 'text-emerald-500' : 'text-red-500'}`}>
            {r.type}
          </span>
          <span className="text-[10px] tabular-nums w-[36px] text-right shrink-0">{fmtSize(r.size)}</span>
          <span className="text-[10px] tabular-nums font-medium w-[44px] text-right shrink-0">{fmtPremium(r.premium)}</span>
          {!showAggressor && (
            <span className="text-[10px] tabular-nums text-muted-foreground w-[32px] text-right shrink-0">
              {fmtOI((r as FlowRow).oi)}
            </span>
          )}
          {showAggressor
            ? (
              <span className={`text-[10px] font-medium flex-1 ${(r as SweepRow).aggressor === 'Buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                {(r as SweepRow).aggressor}
              </span>
            )
            : expanded && (
              <div className="flex-1 min-w-0 ml-1">
                <SentimentBadge s={(r as FlowRow).sentiment} />
              </div>
            )
          }
        </div>
      ))}
      {!showAggressor && !expanded && rows.length > 10 && (
        <div className="text-[10px] text-muted-foreground pt-1">{rows.length - 10} more — expand panel</div>
      )}
    </div>
  )
}

export default function OptionsFlowPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('flow')

  const { data, loading, error, refresh } = usePolling<OptionsFlowData>({
    fetcher: async () => MOCK,
    interval: 60_000,
  })

  return (
    <PanelWrapper title="Options Flow" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'flow')}    onClick={() => setTab('flow')}>Flow</button>
        <button className={tabCls(tab === 'sweeps')}  onClick={() => setTab('sweeps')}>Sweeps</button>
        <button className={tabCls(tab === 'putcall')} onClick={() => setTab('putcall')}>Put/Call</button>
      </div>

      {tab === 'flow' && data && (
        <FlowTable rows={data.flow} expanded={expanded} />
      )}

      {tab === 'sweeps' && data && (
        <FlowTable rows={data.sweeps} showAggressor expanded={expanded} />
      )}

      {tab === 'putcall' && data && (
        <div>
          <div className="flex items-center gap-3 mb-3 p-2 rounded-sm bg-muted/30">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Overall P/C Ratio</div>
              <div className={`text-[20px] font-bold tabular-nums ${data.putcall.overall < 0.7 ? 'text-emerald-400' : data.putcall.overall > 1 ? 'text-red-400' : 'text-foreground'}`}>
                {data.putcall.overall.toFixed(2)}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                {data.putcall.overall < 0.7 ? 'Bullish positioning' : data.putcall.overall > 1 ? 'Bearish positioning' : 'Near neutral'}
              </div>
            </div>
          </div>
          <div className="space-y-0">
            <div className="flex items-center gap-1 pb-1">
              <span className={`${hdrCls} w-[42px]`}>Symbol</span>
              <span className={`${hdrCls} w-[36px] text-right`}>P/C</span>
              <span className={`${hdrCls} w-[16px] text-center`}>Dir</span>
              <span className={`${hdrCls} flex-1`}>Note</span>
            </div>
            {data.putcall.rows.map((r, i) => (
              <div key={i} className="flex items-center gap-1 border-t border-border/15 pt-1">
                <span className="text-[11px] font-bold w-[42px] shrink-0">{r.symbol}</span>
                <span className={`text-[10px] tabular-nums font-medium w-[36px] text-right shrink-0 ${r.ratio < 0.65 ? 'text-emerald-400' : r.ratio > 1.1 ? 'text-red-400' : 'text-foreground'}`}>
                  {r.ratio.toFixed(2)}
                </span>
                <span className={`text-[10px] w-[16px] text-center shrink-0 ${r.trend === 'up' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {r.trend === 'up' ? '↑' : '↓'}
                </span>
                <span className="text-[10px] text-muted-foreground flex-1 truncate">{r.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 pt-1.5 border-t border-border/15 flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground/50">Live options flow coming soon</span>
        {data && (
          <span className="text-[9px] tabular-nums text-muted-foreground/40">
            {new Date(data.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
      </div>
    </PanelWrapper>
  )
}
