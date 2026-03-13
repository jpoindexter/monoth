import { useState } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMarketStore } from '@/stores/market-store'
import { exportToCSV, exportToJSON } from '@/services/export'
import type { MarketDataPoint, ForexRate, CryptoAsset } from '@/types'

type DatasetKey = 'markets' | 'crypto' | 'forex' | 'macro'
type Format = 'csv' | 'json'

const DATASET_LABELS: Record<DatasetKey, string> = {
  markets: 'Markets',
  crypto: 'Crypto',
  forex: 'Forex',
  macro: 'Macro',
}

function toCSVRows(key: DatasetKey, data: unknown[]): Record<string, unknown>[] {
  if (!data.length) return []
  if (key === 'markets') {
    return (data as MarketDataPoint[]).map((d) => ({
      symbol: d.symbol,
      name: d.name ?? '',
      price: d.price,
      change: d.change,
      changePercent: d.changePercent,
      volume: d.volume ?? '',
      timestamp: d.timestamp,
      source: d.source,
    }))
  }
  if (key === 'crypto') {
    return (data as CryptoAsset[]).map((d) => ({
      rank: d.rank,
      symbol: d.symbol,
      name: d.name,
      price: d.price,
      change24h: d.change24h,
      changePercent24h: d.changePercent24h,
      marketCap: d.marketCap,
      volume24h: d.volume24h,
    }))
  }
  if (key === 'forex') {
    return (data as ForexRate[]).map((d) => ({
      pair: d.pair,
      rate: d.rate,
      change: d.change,
      changePercent: d.changePercent,
      timestamp: d.timestamp,
    }))
  }
  return data as Record<string, unknown>[]
}

export default function ExportPanel() {
  const indices = useMarketStore((s) => s.indices)
  const crypto = useMarketStore((s) => s.crypto)
  const forex = useMarketStore((s) => s.forex)
  const macroSignals = useMarketStore((s) => s.macroSignals)

  const [dataset, setDataset] = useState<DatasetKey>('markets')
  const [format, setFormat] = useState<Format>('csv')

  const dataMap: Record<DatasetKey, unknown[]> = {
    markets: indices,
    crypto,
    forex,
    macro: macroSignals,
  }

  function handleExport() {
    const raw = dataMap[dataset]
    const filename = `monoth-${dataset}-${new Date().toISOString().slice(0, 10)}.${format}`
    if (format === 'json') {
      exportToJSON(raw, filename)
    } else {
      exportToCSV(toCSVRows(dataset, raw), filename)
    }
  }

  return (
    <PanelWrapper title="Export Data">
      <div className="flex flex-col gap-4 p-1">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Dataset</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-40 justify-between">
                {DATASET_LABELS[dataset]}
                <span className="text-muted-foreground">▾</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(Object.keys(DATASET_LABELS) as DatasetKey[]).map((key) => (
                <DropdownMenuItem key={key} onSelect={() => setDataset(key)}>
                  {DATASET_LABELS[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Format</label>
          <div className="flex gap-4">
            {(['csv', 'json'] as Format[]).map((f) => (
              <label key={f} className="flex items-center gap-1.5 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="export-format"
                  value={f}
                  checked={format === f}
                  onChange={() => setFormat(f)}
                  className="accent-primary"
                />
                {f.toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        <Button onClick={handleExport} size="sm" className="w-fit">
          Export
        </Button>

        <p className="text-xs text-muted-foreground">
          {dataMap[dataset].length} rows available
        </p>
      </div>
    </PanelWrapper>
  )
}
