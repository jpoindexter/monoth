import { useCallback, useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { fetchQuotes } from '@/services/api/market'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { tabCls, changeColor } from '@/lib/panel-utils'
import type { MarketDataPoint } from '@/types'

const TABS = ['metals', 'energy', 'agriculture', 'softs'] as const
type Tab = typeof TABS[number]

interface Commodity {
  symbol: string
  name: string
  unit: string
  prominent?: boolean
}

const METALS: Commodity[] = [
  { symbol: 'GC=F', name: 'Gold', unit: '$/oz', prominent: true },
  { symbol: 'SI=F', name: 'Silver', unit: '$/oz', prominent: true },
  { symbol: 'PL=F', name: 'Platinum', unit: '$/oz' },
  { symbol: 'PA=F', name: 'Palladium', unit: '$/oz' },
  { symbol: 'HG=F', name: 'Copper', unit: '$/lb' },
]

const ENERGY: Commodity[] = [
  { symbol: 'CL=F', name: 'WTI Crude', unit: '$/bbl' },
  { symbol: 'BZ=F', name: 'Brent Crude', unit: '$/bbl' },
  { symbol: 'NG=F', name: 'Natural Gas', unit: '$/MMBtu' },
  { symbol: 'HO=F', name: 'Heating Oil', unit: '$/gal' },
  { symbol: 'RB=F', name: 'RBOB Gas', unit: '$/gal' },
]

const AGRICULTURE: Commodity[] = [
  { symbol: 'ZC=F', name: 'Corn', unit: '¢/bu' },
  { symbol: 'ZW=F', name: 'Wheat', unit: '¢/bu' },
  { symbol: 'ZS=F', name: 'Soybeans', unit: '¢/bu' },
  { symbol: 'SB=F', name: 'Sugar', unit: '¢/lb' },
  { symbol: 'CT=F', name: 'Cotton', unit: '¢/lb' },
  { symbol: 'LBS=F', name: 'Lumber', unit: '$/MBF' },
]

const SOFTS: Commodity[] = [
  { symbol: 'KC=F', name: 'Coffee', unit: '¢/lb' },
  { symbol: 'CC=F', name: 'Cocoa', unit: '$/MT' },
  { symbol: 'OJ=F', name: 'Orange Juice', unit: '¢/lb' },
  { symbol: 'HE=F', name: 'Lean Hogs', unit: '¢/lb' },
  { symbol: 'LE=F', name: 'Live Cattle', unit: '¢/lb' },
]

const TAB_COMMODITIES: Record<Tab, Commodity[]> = {
  metals: METALS,
  energy: ENERGY,
  agriculture: AGRICULTURE,
  softs: SOFTS,
}

function fmt52w(price: number, low: number, high: number): number {
  if (high <= low) return 50
  return Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100))
}

interface RowProps {
  commodity: Commodity
  quote: MarketDataPoint | undefined
  showRange?: boolean
}

function CommodityRow({ commodity, quote, showRange }: RowProps) {
  const price = quote?.price
  const change = quote?.change ?? 0
  const changePct = quote?.changePercent ?? 0
  const isPos = changePct >= 0
  const clr = changeColor(changePct)

  const low52 = price ? price * 0.85 : 0
  const high52 = price ? price * 1.15 : 0
  const barPct = price ? fmt52w(price, low52, high52) : 50

  return (
    <tr className="border-t border-border/20">
      <td className="py-1 pr-2 w-[30%]">
        <span className={`text-foreground leading-none ${commodity.prominent ? 'text-[12px] font-semibold' : 'text-[11px] font-medium'}`}>
          {commodity.name}
        </span>
        <span className="text-[9px] text-muted-foreground block">{commodity.unit}</span>
      </td>
      <td className="text-right tabular-nums pr-2 w-[22%]">
        {price != null ? (
          <span className={commodity.prominent ? 'text-[12px] font-semibold text-foreground' : 'text-[11px] font-medium text-foreground'}>
            {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">--</span>
        )}
      </td>
      <td className={`text-right tabular-nums text-[11px] pr-2 w-[18%] ${clr}`}>
        {price != null ? `${isPos ? '+' : ''}${change.toFixed(2)}` : '--'}
      </td>
      <td className={`text-right tabular-nums text-[11px] w-[18%] ${clr}`}>
        {price != null ? `${isPos ? '+' : ''}${changePct.toFixed(2)}%` : '--'}
      </td>
      {showRange && (
        <td className="pl-2 w-[12%]">
          <div className="w-full bg-muted/40 rounded-sm h-1.5 relative">
            <div
              className="absolute top-0 left-0 h-1.5 rounded-sm bg-foreground/30"
              style={{ width: `${barPct}%` }}
            />
            <div
              className="absolute top-0 h-1.5 w-[2px] rounded-sm bg-foreground/70"
              style={{ left: `${barPct}%` }}
            />
          </div>
        </td>
      )}
    </tr>
  )
}

export default function CommoditiesSpotPanel() {
  const [tab, setTab] = useState<Tab>('metals')

  const commodities = TAB_COMMODITIES[tab]
  const symbols = commodities.map((c) => c.symbol)

  const fetcher = useCallback(async () => {
    return fetchQuotes(symbols)
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data, loading, error, refresh } = usePolling({
    fetcher,
    interval: 60_000,
  })

  const priceMap: Record<string, MarketDataPoint> = {}
  for (const q of data ?? []) priceMap[q.symbol] = q

  return (
    <PanelWrapper title="Spot Prices" loading={loading} error={error} onRetry={refresh}>
      <div className="flex flex-wrap gap-1 mb-2">
        {TABS.map((t) => (
          <button key={t} className={tabCls(tab === t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left text-[10px] font-medium pb-1.5 w-[30%]">Name</th>
            <th className="text-right text-[10px] font-medium pb-1.5 pr-2 w-[22%]">Price</th>
            <th className="text-right text-[10px] font-medium pb-1.5 pr-2 w-[18%]">Chg $</th>
            <th className="text-right text-[10px] font-medium pb-1.5 w-[18%]">Chg %</th>
            {tab === 'metals' && (
              <th className="text-right text-[10px] font-medium pb-1.5 pl-2 w-[12%]">52w</th>
            )}
          </tr>
        </thead>
        <tbody>
          {commodities.map((c) => (
            <CommodityRow
              key={c.symbol}
              commodity={c}
              quote={priceMap[c.symbol]}
              showRange={tab === 'metals'}
            />
          ))}
        </tbody>
      </table>
    </PanelWrapper>
  )
}
