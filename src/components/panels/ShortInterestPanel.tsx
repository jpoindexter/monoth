import { useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'

type Tab = 'most-shorted' | 'squeeze' | 'changes'

interface ShortedRow {
  symbol: string
  name: string
  shortPct: number
  shortShares: number
  daysToCover: number
  borrowRate: number
}

interface SqueezeRow {
  symbol: string
  shortPct: number
  siChange7d: number
  priceChange7d: number
  squeezeScore: number
}

interface ChangeRow {
  symbol: string
  prevPct: number
  currPct: number
  change: number
  direction: 'Increasing' | 'Decreasing'
}

interface ShortInterestData {
  mostShorted: ShortedRow[]
  squeeze: SqueezeRow[]
  changes: ChangeRow[]
}

const MOCK: ShortInterestData = {
  mostShorted: [
    { symbol: 'GME',   name: 'GameStop',              shortPct: 24.8, shortShares:  58.2, daysToCover: 3.1, borrowRate: 1.2  },
    { symbol: 'MSTR',  name: 'MicroStrategy',          shortPct: 22.4, shortShares:  14.7, daysToCover: 1.8, borrowRate: 4.6  },
    { symbol: 'BYND',  name: 'Beyond Meat',            shortPct: 41.2, shortShares:  18.9, daysToCover: 6.4, borrowRate: 28.7 },
    { symbol: 'UPST',  name: 'Upstart Holdings',       shortPct: 38.6, shortShares:  29.4, daysToCover: 5.2, borrowRate: 14.3 },
    { symbol: 'RIVN',  name: 'Rivian Automotive',      shortPct: 17.9, shortShares: 164.8, daysToCover: 2.4, borrowRate: 3.8  },
    { symbol: 'LCID',  name: 'Lucid Group',            shortPct: 16.4, shortShares: 212.3, daysToCover: 3.7, borrowRate: 5.1  },
    { symbol: 'SPCE',  name: 'Virgin Galactic',        shortPct: 29.7, shortShares:  44.6, daysToCover: 4.9, borrowRate: 22.4 },
    { symbol: 'SOFI',  name: 'SoFi Technologies',      shortPct: 12.8, shortShares: 118.5, daysToCover: 2.1, borrowRate: 2.3  },
    { symbol: 'OPEN',  name: 'Opendoor Technologies',  shortPct: 15.3, shortShares:  68.7, daysToCover: 3.3, borrowRate: 6.9  },
    { symbol: 'COIN',  name: 'Coinbase Global',        shortPct: 11.4, shortShares:  28.9, daysToCover: 1.6, borrowRate: 2.7  },
    { symbol: 'HOOD',  name: 'Robinhood Markets',      shortPct: 9.8,  shortShares:  52.1, daysToCover: 2.8, borrowRate: 1.9  },
    { symbol: 'CLOV',  name: 'Clover Health',          shortPct: 18.2, shortShares:  31.4, daysToCover: 4.1, borrowRate: 11.6 },
    { symbol: 'AMC',   name: 'AMC Entertainment',      shortPct: 21.9, shortShares:  89.3, daysToCover: 3.8, borrowRate: 8.4  },
  ],
  squeeze: [
    { symbol: 'BYND',  shortPct: 41.2, siChange7d:  2.4, priceChange7d:  12.8, squeezeScore: 9 },
    { symbol: 'UPST',  shortPct: 38.6, siChange7d:  1.8, priceChange7d:   8.4, squeezeScore: 8 },
    { symbol: 'SPCE',  shortPct: 29.7, siChange7d:  3.1, priceChange7d:  15.2, squeezeScore: 8 },
    { symbol: 'CLOV',  shortPct: 18.2, siChange7d: -0.4, priceChange7d:  21.7, squeezeScore: 7 },
    { symbol: 'MSTR',  shortPct: 22.4, siChange7d:  0.9, priceChange7d:   6.1, squeezeScore: 6 },
    { symbol: 'GME',   shortPct: 24.8, siChange7d: -1.2, priceChange7d:   9.3, squeezeScore: 6 },
    { symbol: 'OPEN',  shortPct: 15.3, siChange7d:  1.4, priceChange7d:   4.8, squeezeScore: 5 },
    { symbol: 'AMC',   shortPct: 21.9, siChange7d: -2.1, priceChange7d:   2.4, squeezeScore: 4 },
    { symbol: 'SOFI',  shortPct: 12.8, siChange7d: -0.8, priceChange7d:   1.1, squeezeScore: 3 },
  ],
  changes: [
    { symbol: 'BYND',  prevPct: 38.8, currPct: 41.2, change:  2.4, direction: 'Increasing' },
    { symbol: 'SPCE',  prevPct: 26.6, currPct: 29.7, change:  3.1, direction: 'Increasing' },
    { symbol: 'UPST',  prevPct: 36.8, currPct: 38.6, change:  1.8, direction: 'Increasing' },
    { symbol: 'RIVN',  prevPct: 15.1, currPct: 17.9, change:  2.8, direction: 'Increasing' },
    { symbol: 'OPEN',  prevPct: 13.9, currPct: 15.3, change:  1.4, direction: 'Increasing' },
    { symbol: 'AMC',   prevPct: 24.0, currPct: 21.9, change: -2.1, direction: 'Decreasing' },
    { symbol: 'GME',   prevPct: 26.0, currPct: 24.8, change: -1.2, direction: 'Decreasing' },
    { symbol: 'SOFI',  prevPct: 13.6, currPct: 12.8, change: -0.8, direction: 'Decreasing' },
    { symbol: 'HOOD',  prevPct: 11.4, currPct:  9.8, change: -1.6, direction: 'Decreasing' },
    { symbol: 'COIN',  prevPct: 13.1, currPct: 11.4, change: -1.7, direction: 'Decreasing' },
    { symbol: 'CLOV',  prevPct: 18.6, currPct: 18.2, change: -0.4, direction: 'Decreasing' },
  ],
}

function squeezeColor(score: number) {
  if (score >= 8) return 'text-red-400'
  if (score >= 6) return 'text-orange-400'
  if (score >= 4) return 'text-yellow-400'
  return 'text-emerald-400'
}

export default function ShortInterestPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('most-shorted')

  const { data, loading, error, refresh } = usePolling<ShortInterestData>({
    fetcher: async () => MOCK,
    interval: 60_000,
  })

  const tabCls = (active: boolean) =>
    `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const hdrCls = 'text-[10px] uppercase tracking-wider text-muted-foreground'

  return (
    <PanelWrapper title="Short Interest" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'most-shorted')} onClick={() => setTab('most-shorted')}>Most Shorted</button>
        <button className={tabCls(tab === 'squeeze')}      onClick={() => setTab('squeeze')}>Squeeze</button>
        <button className={tabCls(tab === 'changes')}      onClick={() => setTab('changes')}>Changes</button>
      </div>

      {tab === 'most-shorted' && data && (
        <div className="space-y-0">
          <div className="flex items-center gap-1 pb-1">
            <span className={`${hdrCls} w-[38px]`}>Sym</span>
            {expanded && <span className={`${hdrCls} flex-1`}>Name</span>}
            <span className={`${hdrCls} w-[42px] text-right`}>Si%</span>
            <span className={`${hdrCls} w-[38px] text-right`}>Shrs</span>
            <span className={`${hdrCls} w-[30px] text-right`}>DTC</span>
            <span className={`${hdrCls} w-[38px] text-right`}>Borrow</span>
          </div>
          {(expanded ? data.mostShorted : data.mostShorted.slice(0, 10)).map((r, i) => (
            <div key={i} className="flex items-center gap-1 border-t border-border/15 pt-1">
              <span className="text-[11px] font-bold w-[38px] shrink-0">{r.symbol}</span>
              {expanded && <span className="text-[10px] text-muted-foreground flex-1 min-w-0 truncate">{r.name}</span>}
              <span className={`text-[10px] tabular-nums font-medium w-[42px] text-right shrink-0 ${r.shortPct > 30 ? 'text-red-400' : r.shortPct > 20 ? 'text-orange-400' : 'text-foreground'}`}>
                {r.shortPct.toFixed(1)}%
              </span>
              <span className="text-[10px] tabular-nums text-muted-foreground w-[38px] text-right shrink-0">
                {r.shortShares.toFixed(1)}M
              </span>
              <span className="text-[10px] tabular-nums w-[30px] text-right shrink-0">{r.daysToCover.toFixed(1)}</span>
              <span className={`text-[10px] tabular-nums w-[38px] text-right shrink-0 ${r.borrowRate > 15 ? 'text-red-400' : r.borrowRate > 5 ? 'text-orange-400' : 'text-muted-foreground'}`}>
                {r.borrowRate.toFixed(1)}%
              </span>
            </div>
          ))}
          {!expanded && data.mostShorted.length > 10 && (
            <div className="text-[10px] text-muted-foreground pt-1">{data.mostShorted.length - 10} more — expand panel</div>
          )}
        </div>
      )}

      {tab === 'squeeze' && data && (
        <div>
          <div className="text-[9px] text-muted-foreground mb-2 leading-snug">
            High short interest + rising price = potential short squeeze
          </div>
          <div className="space-y-0">
            <div className="flex items-center gap-1 pb-1">
              <span className={`${hdrCls} w-[38px]`}>Sym</span>
              <span className={`${hdrCls} w-[36px] text-right`}>SI%</span>
              <span className={`${hdrCls} w-[44px] text-right`}>SI 7d</span>
              <span className={`${hdrCls} w-[44px] text-right`}>Px 7d</span>
              <span className={`${hdrCls} w-[32px] text-right`}>Score</span>
            </div>
            {data.squeeze.map((r, i) => (
              <div key={i} className="flex items-center gap-1 border-t border-border/15 pt-1">
                <span className="text-[11px] font-bold w-[38px] shrink-0">{r.symbol}</span>
                <span className={`text-[10px] tabular-nums w-[36px] text-right shrink-0 ${r.shortPct > 30 ? 'text-red-400' : 'text-foreground'}`}>
                  {r.shortPct.toFixed(1)}%
                </span>
                <span className={`text-[10px] tabular-nums w-[44px] text-right shrink-0 ${r.siChange7d > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {r.siChange7d > 0 ? '+' : ''}{r.siChange7d.toFixed(1)}%
                </span>
                <span className={`text-[10px] tabular-nums w-[44px] text-right shrink-0 ${r.priceChange7d > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {r.priceChange7d > 0 ? '+' : ''}{r.priceChange7d.toFixed(1)}%
                </span>
                <span className={`text-[10px] tabular-nums font-bold w-[32px] text-right shrink-0 ${squeezeColor(r.squeezeScore)}`}>
                  {r.squeezeScore}/10
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'changes' && data && (
        <div className="space-y-0">
          <div className="flex items-center gap-1 pb-1">
            <span className={`${hdrCls} w-[38px]`}>Sym</span>
            <span className={`${hdrCls} w-[38px] text-right`}>Prev%</span>
            <span className={`${hdrCls} w-[38px] text-right`}>Curr%</span>
            <span className={`${hdrCls} w-[38px] text-right`}>Chg</span>
            <span className={`${hdrCls} flex-1`}>Dir</span>
          </div>
          {data.changes.map((r, i) => (
            <div key={i} className="flex items-center gap-1 border-t border-border/15 pt-1">
              <span className="text-[11px] font-bold w-[38px] shrink-0">{r.symbol}</span>
              <span className="text-[10px] tabular-nums text-muted-foreground w-[38px] text-right shrink-0">
                {r.prevPct.toFixed(1)}%
              </span>
              <span className="text-[10px] tabular-nums w-[38px] text-right shrink-0">
                {r.currPct.toFixed(1)}%
              </span>
              <span className={`text-[10px] tabular-nums font-medium w-[38px] text-right shrink-0 ${r.change > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {r.change > 0 ? '+' : ''}{r.change.toFixed(1)}%
              </span>
              <span className={`text-[9px] font-medium px-1 py-0.5 rounded-sm uppercase tracking-wide flex-1 w-fit ${r.direction === 'Increasing' ? 'text-red-400' : 'text-emerald-400'}`}>
                {r.direction === 'Increasing' ? '↑' : '↓'} {r.direction}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 pt-1.5 border-t border-border/15 flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground/50">Data: FINRA / twice monthly · Live data coming soon</span>
      </div>
    </PanelWrapper>
  )
}
