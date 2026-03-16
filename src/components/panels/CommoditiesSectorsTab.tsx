import type { MarketDataPoint } from '@/types'

const SECTORS = [
  { name: 'Precious Metals', symbols: ['GLD', 'SLV'], color: '#f59e0b' },
  { name: 'Energy', symbols: ['USO', 'UNG'], color: '#ef4444' },
  { name: 'Industrial', symbols: ['COPX'], color: '#6366f1' },
  { name: 'Agriculture', symbols: ['WEAT', 'DBA'], color: '#10b981' },
]

interface Props {
  data: MarketDataPoint[]
}

export function CommoditiesSectorsTab({ data }: Props) {
  const priceMap = Object.fromEntries(data.map((q) => [q.symbol, q]))

  const sectorData = SECTORS.map((s) => {
    const quotes = s.symbols.map((sym) => priceMap[sym]).filter((q): q is NonNullable<typeof q> => q != null)
    const avg = quotes.length > 0 ? quotes.reduce((sum, q) => sum + q.changePercent, 0) / quotes.length : 0
    return { ...s, avg }
  }).sort((a, b) => b.avg - a.avg)

  const maxAbs = Math.max(...sectorData.map((s) => Math.abs(s.avg)), 0.01)

  const preciousAvg = sectorData.find((s) => s.name === 'Precious Metals')?.avg ?? 0
  const energyAvg = sectorData.find((s) => s.name === 'Energy')?.avg ?? 0
  const spread = preciousAvg - energyAvg

  const spreadLabel = Math.abs(spread) < 0.15 ? 'BALANCED' : spread > 0 ? 'SAFE HAVEN BID' : 'GROWTH BID'
  const spreadLabelCls = Math.abs(spread) < 0.15
    ? 'text-muted-foreground bg-muted'
    : spread > 0
    ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
    : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'

  const gldPrice = priceMap['GLD']?.price
  const slvPrice = priceMap['SLV']?.price
  const usoPrice = priceMap['USO']?.price
  const ungPrice = priceMap['UNG']?.price

  const goldSilverRatio = gldPrice && slvPrice ? gldPrice / slvPrice : null
  const oilGasRatio = usoPrice && ungPrice ? usoPrice / ungPrice : null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {sectorData.map((sector) => {
          const isPositive = sector.avg >= 0
          const barWidth = Math.min(Math.abs(sector.avg) / maxAbs * 100, 100)
          return (
            <div key={sector.name}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[11px] font-medium text-foreground">{sector.name}</span>
                <span className={`text-[11px] tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{sector.avg.toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-muted/40 rounded-sm h-3">
                <div className="h-3 rounded-sm" style={{ width: `${barWidth}%`, backgroundColor: sector.color }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-border/20 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] text-muted-foreground">Gold/Oil Spread: </span>
            <span className={`text-[11px] tabular-nums font-medium ${spread >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {spread >= 0 ? '+' : ''}{spread.toFixed(2)}%
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${spreadLabelCls}`}>{spreadLabel}</span>
        </div>
      </div>

      <div className="border-t border-border/20 pt-2 flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-muted-foreground">Gold/Silver ratio</span>
          {goldSilverRatio != null ? (
            <div className="text-right">
              <span className="text-[11px] tabular-nums font-medium text-foreground">{goldSilverRatio.toFixed(1)}x</span>
              <span className="text-[11px] text-muted-foreground ml-1.5">
                {goldSilverRatio > 80 ? '(Silver cheap)' : goldSilverRatio < 60 ? '(Silver pricey)' : '(Normal range)'}
              </span>
            </div>
          ) : <span className="text-[11px] text-muted-foreground">—</span>}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-muted-foreground">Oil/Gas ratio</span>
          {oilGasRatio != null ? (
            <div className="text-right">
              <span className="text-[11px] tabular-nums font-medium text-foreground">{oilGasRatio.toFixed(1)}x</span>
              <span className="text-[11px] text-muted-foreground ml-1.5">
                {oilGasRatio > 25 ? '(Gas cheap)' : oilGasRatio < 10 ? '(Gas pricey)' : '(Normal range)'}
              </span>
            </div>
          ) : <span className="text-[11px] text-muted-foreground">—</span>}
        </div>
      </div>
    </div>
  )
}
