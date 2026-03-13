import { useRef, useState } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { useMarketStore } from '@/stores/market-store'
import { usePanelStore } from '@/stores/panel-store'
import { useUserStore } from '@/stores/user-store'
import { useAlertStore } from '@/stores/alert-store'
import { useSpanStore } from '@/stores/span-store'
import type { PanelConfig } from '@/types'

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = r[h]
        const s = v == null ? '' : String(v)
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
      }).join(',')
    ),
  ]
  return lines.join('\n')
}

function byteSize(s: string) {
  const b = new Blob([s]).size
  if (b < 1024) return `${b} B`
  return `${(b / 1024).toFixed(1)} KB`
}

export default function ExportPanel() {
  const indices = useMarketStore((s) => s.indices)
  const crypto = useMarketStore((s) => s.crypto)
  const forex = useMarketStore((s) => s.forex)
  const commodities = useMarketStore((s) => s.commodities)
  const panels = usePanelStore((s) => s.panels)
  const togglePanel = usePanelStore((s) => s.togglePanel)
  const resetPanels = usePanelStore((s) => s.resetPanels)
  const watchlist = useUserStore((s) => s.watchlist)
  const alerts = useAlertStore((s) => s.alerts)
  const spans = useSpanStore((s) => s.spans)

  const [tab, setTab] = useState<'panels' | 'export'>('panels')
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const enabledCount = panels.filter((p) => p.enabled).length

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function marketCSV() {
    const rows = [
      ...indices.map((d) => ({ type: 'index', symbol: d.symbol, name: d.name ?? '', price: d.price, change: d.change, changePercent: d.changePercent })),
      ...commodities.map((d) => ({ type: 'commodity', symbol: d.symbol, name: d.name ?? '', price: d.price, change: d.change, changePercent: d.changePercent })),
    ]
    return toCSV(rows)
  }

  function marketJSON() {
    return JSON.stringify({ indices, commodities, forex, crypto }, null, 2)
  }

  function watchlistCSV() {
    const allPrices: Record<string, number> = {}
    for (const d of [...indices, ...commodities]) allPrices[d.symbol] = d.price
    for (const d of crypto) allPrices[d.symbol] = d.price
    for (const d of forex) allPrices[d.pair] = d.rate
    return toCSV(watchlist.map((sym) => ({ symbol: sym, price: allPrices[sym] ?? '' })))
  }

  function alertsJSON() {
    return JSON.stringify(alerts, null, 2)
  }

  function configJSON() {
    return JSON.stringify(
      {
        panels: panels.map((p) => ({ id: p.id, enabled: p.enabled })),
        spans,
        watchlist,
      },
      null,
      2
    )
  }

  const date = new Date().toISOString().slice(0, 10)

  const exportButtons = [
    {
      label: 'Market Data',
      sublabel: 'CSV',
      hint: `${indices.length + commodities.length} rows`,
      size: byteSize(marketCSV()),
      action: () => downloadFile(marketCSV(), `monoth-market-${date}.csv`, 'text/csv'),
    },
    {
      label: 'Market Data',
      sublabel: 'JSON',
      hint: `indices + crypto + forex`,
      size: byteSize(marketJSON()),
      action: () => downloadFile(marketJSON(), `monoth-market-${date}.json`, 'application/json'),
    },
    {
      label: 'Watchlist',
      sublabel: 'CSV',
      hint: `${watchlist.length} symbols`,
      size: byteSize(watchlistCSV()),
      action: () => downloadFile(watchlistCSV(), `monoth-watchlist-${date}.csv`, 'text/csv'),
    },
    {
      label: 'Alerts',
      sublabel: 'JSON',
      hint: `${alerts.length} alerts`,
      size: byteSize(alertsJSON()),
      action: () => downloadFile(alertsJSON(), `monoth-alerts-${date}.json`, 'application/json'),
    },
    {
      label: 'Dashboard Config',
      sublabel: 'JSON',
      hint: 'panels + spans + watchlist',
      size: byteSize(configJSON()),
      action: () => downloadFile(configJSON(), `monoth-config-${date}.json`, 'application/json'),
    },
  ]

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const cfg = JSON.parse(reader.result as string)
        if (!cfg.panels || !Array.isArray(cfg.panels)) throw new Error('Invalid config')

        const panelMap = new Map((cfg.panels as { id: string; enabled: boolean }[]).map((p) => [p.id, p.enabled]))
        const current = usePanelStore.getState().panels

        for (const p of current) {
          const enabled = panelMap.get(p.id)
          if (enabled !== undefined && enabled !== p.enabled) {
            usePanelStore.getState().togglePanel(p.id)
          }
        }

        if (cfg.spans && typeof cfg.spans === 'object') {
          useSpanStore.setState({ spans: cfg.spans })
          localStorage.setItem('monoth-panel-spans', JSON.stringify(cfg.spans))
        }

        if (cfg.watchlist && Array.isArray(cfg.watchlist)) {
          const { watchlist: current, addToWatchlist, removeFromWatchlist } = useUserStore.getState()
          for (const sym of current) removeFromWatchlist(sym)
          for (const sym of cfg.watchlist as string[]) addToWatchlist(sym)
        }

        showToast('Config restored')
      } catch {
        showToast('Failed to parse config')
      } finally {
        if (fileRef.current) fileRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  function handleRestoreClick() {
    fileRef.current?.click()
  }

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Settings">
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'panels')} onClick={() => setTab('panels')}>Panels</button>
        <button className={tabCls(tab === 'export')} onClick={() => setTab('export')}>Export</button>
      </div>

      {tab === 'panels' && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-muted-foreground">{enabledCount} of {panels.length} active</span>
            <button onClick={resetPanels} className="text-[8px] text-muted-foreground hover:text-foreground underline">
              Reset
            </button>
          </div>
          <div className="max-h-[300px] overflow-y-auto -mx-1 px-1">
            {panels.map((p: PanelConfig) => (
              <label key={p.id} className="flex items-center gap-1.5 py-0.5 text-[10px] cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 px-1 rounded-sm">
                <input
                  type="checkbox"
                  checked={p.enabled}
                  onChange={() => togglePanel(p.id)}
                  className="accent-foreground w-3 h-3"
                />
                <span className={p.enabled ? 'text-foreground font-medium' : 'text-muted-foreground'}>{p.name}</span>
                {p.tier === 1 && <span className="text-[7px] text-muted-foreground/50 ml-auto">CORE</span>}
              </label>
            ))}
          </div>
        </div>
      )}

      {tab === 'export' && (
        <div>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Export Data</p>
          <div className="grid grid-cols-1 gap-1 mb-3">
            {exportButtons.map((btn) => (
              <button
                key={`${btn.label}-${btn.sublabel}`}
                onClick={btn.action}
                className="text-[10px] font-medium bg-foreground/5 hover:bg-foreground/10 px-3 py-2 rounded-sm transition-colors text-left flex items-center justify-between"
              >
                <span>
                  {btn.label} <span className="text-muted-foreground font-normal">.{btn.sublabel.toLowerCase()}</span>
                  <span className="text-muted-foreground font-normal ml-1.5">— {btn.hint}</span>
                </span>
                <span className="text-[9px] text-muted-foreground ml-2 shrink-0">{btn.size}</span>
              </button>
            ))}
          </div>

          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Restore Config</p>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button
            onClick={handleRestoreClick}
            className="text-[10px] font-medium bg-foreground/5 hover:bg-foreground/10 px-3 py-2 rounded-sm transition-colors text-left w-full"
          >
            Import dashboard-config.json
          </button>

          {toast && (
            <div className="mt-2 text-[9px] text-foreground bg-foreground/10 px-2 py-1 rounded-sm">
              {toast}
            </div>
          )}
        </div>
      )}
    </PanelWrapper>
  )
}
