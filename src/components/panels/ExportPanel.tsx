import { useState } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useMarketStore } from '@/stores/market-store'
import { exportToCSV, exportToJSON } from '@/services/export'
import type { MarketDataPoint, ForexRate, CryptoAsset } from '@/types'

type DatasetKey = 'markets' | 'crypto' | 'forex'
type Format = 'csv' | 'json'

const DATASETS: { key: DatasetKey; label: string }[] = [
  { key: 'markets', label: 'Markets' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'forex', label: 'Forex' },
]

function toRows(key: DatasetKey, data: unknown[]): Record<string, unknown>[] {
  if (key === 'markets') return (data as MarketDataPoint[]).map((d) => ({ symbol: d.symbol, name: d.name ?? '', price: d.price, change: d.change, changePercent: d.changePercent }))
  if (key === 'crypto') return (data as CryptoAsset[]).map((d) => ({ symbol: d.symbol, name: d.name, price: d.price, change24h: d.change24h, changePercent24h: d.changePercent24h, marketCap: d.marketCap }))
  return (data as ForexRate[]).map((d) => ({ pair: d.pair, rate: d.rate, change: d.change, changePercent: d.changePercent }))
}

export default function ExportPanel() {
  const indices = useMarketStore((s) => s.indices)
  const crypto = useMarketStore((s) => s.crypto)
  const forex = useMarketStore((s) => s.forex)
  const [dataset, setDataset] = useState<DatasetKey>('markets')
  const [format, setFormat] = useState<Format>('csv')

  const dataMap: Record<DatasetKey, unknown[]> = { markets: indices, crypto, forex }

  function handleExport() {
    const raw = dataMap[dataset]
    const filename = `monoth-${dataset}-${new Date().toISOString().slice(0, 10)}.${format}`
    if (format === 'json') exportToJSON(raw, filename)
    else exportToCSV(toRows(dataset, raw), filename)
  }

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Export">
      <div className="flex gap-1 mb-2">
        {DATASETS.map((d) => (
          <button key={d.key} className={tabCls(dataset === d.key)} onClick={() => setDataset(d.key)}>
            {d.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-3">
        {(['csv', 'json'] as Format[]).map((f) => (
          <label key={f} className="flex items-center gap-1 text-[10px] cursor-pointer">
            <input type="radio" name="fmt" value={f} checked={format === f} onChange={() => setFormat(f)} className="accent-foreground" />
            {f.toUpperCase()}
          </label>
        ))}
      </div>

      <button onClick={handleExport} className="text-[10px] font-medium bg-foreground text-background px-2 py-1 rounded-sm">
        Export {dataMap[dataset].length} rows
      </button>
    </PanelWrapper>
  )
}
