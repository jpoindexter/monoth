import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { usePanelStore } from '@/stores'
import type { PanelId } from '@/types'

const CATEGORIES = [
  { label: 'All', filter: () => true },
  { label: 'Markets', filter: (id: string) => ['live-markets', 'sector-heatmap', 'commodities', 'volatility', 'market-radar', 'correlation-engine', 'macro-signals'].includes(id) },
  { label: 'Fixed Income & FX', filter: (id: string) => ['fixed-income', 'forex', 'bond-news'].includes(id) },
  { label: 'Crypto', filter: (id: string) => ['crypto', 'btc-etf', 'stablecoins'].includes(id) },
  { label: 'News', filter: (id: string) => ['headlines', 'central-banks', 'geopolitics', 'regulation', 'hedge-funds-news', 'market-analysis-news', 'ipos-earnings', 'derivatives-news', 'fintech-news', 'energy', 'real-estate', 'supply-chain'].includes(id) },
  { label: 'Tools', filter: (id: string) => ['world-clock', 'daily-brief', 'predictions', 'economic-data', 'watchlist', 'ai-insights', 'export'].includes(id) },
]

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const panels = usePanelStore((s) => s.panels)
  const togglePanel = usePanelStore((s) => s.togglePanel)
  const resetPanels = usePanelStore((s) => s.resetPanels)

  const catFilter = CATEGORIES.find((c) => c.label === category)?.filter ?? (() => true)
  const filtered = panels.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (category !== 'All' && !catFilter(p.id)) return false
    return true
  })

  const enabledCount = panels.filter((p) => p.enabled).length

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-x-[10%] md:inset-y-[5%] z-50 bg-white dark:bg-[#141414] rounded-sm border border-border/40 flex flex-col overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border/30 flex items-center">
              <h2 className="text-[12px] font-semibold uppercase tracking-[1px] text-foreground flex-1">
                Panel Settings
              </h2>
              <span className="text-[10px] text-muted-foreground mr-3">{enabledCount} panels active</span>
              <button onClick={onClose} className="p-1 rounded-sm text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="px-4 py-2 border-b border-border/20 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Filter panels..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-7 px-2 text-[11px] bg-transparent border border-border/40 rounded-sm focus:outline-none focus:border-foreground/30"
              />
              <div className="flex gap-1 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => setCategory(cat.label)}
                    className={`text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${
                      category === cat.label
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filtered.map((panel) => (
                  <button
                    key={panel.id}
                    onClick={() => togglePanel(panel.id as PanelId)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-sm border text-left transition-colors ${
                      panel.enabled
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-border/40 hover:border-border/80'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${
                      panel.enabled
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-border'
                    }`}>
                      {panel.enabled && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wider truncate">
                      {panel.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-3 border-t border-border/30 flex items-center justify-end gap-2">
              <button
                onClick={resetPanels}
                className="text-[10px] uppercase tracking-wider px-3 h-6 rounded-sm border border-border/40 text-muted-foreground hover:text-foreground"
              >
                Reset Layout
              </button>
              <button
                onClick={onClose}
                className="text-[10px] uppercase tracking-wider px-3 h-6 rounded-sm bg-foreground text-background font-medium"
              >
                Save
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
