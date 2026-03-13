import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { usePanelStore, useLayoutStore } from '@/stores'
import { useTheme } from '@/components/theme-provider'
import { PANELS } from '@/config/panels'

const POPULAR_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META',
  'SPY', 'QQQ', 'DIA', 'IWM', 'GLD', 'TLT', 'BTC', 'ETH',
]

const RECENTS_KEY = 'monoth-recent-searches'
const MAX_RECENTS = 10

interface RecentSearch {
  symbol: string
  searchedAt: number
}

function loadRecents(): RecentSearch[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveRecent(symbol: string) {
  const recents = loadRecents().filter((r) => r.symbol !== symbol)
  recents.unshift({ symbol, searchedAt: Date.now() })
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)))
}

function clearRecents() {
  localStorage.removeItem(RECENTS_KEY)
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function exportMarketData() {
  const data = {
    exportedAt: new Date().toISOString(),
    note: 'Monoth market data snapshot',
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `monoth-export-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [recents, setRecents] = useState<RecentSearch[]>([])
  const panels = usePanelStore((s) => s.panels)
  const togglePanel = usePanelStore((s) => s.togglePanel)
  const resetPanels = usePanelStore((s) => s.resetPanels)
  const toggleLock = useLayoutStore((s) => s.toggleLock)
  const isLocked = useLayoutStore((s) => s.layoutLocked)
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const listRef = useRef<HTMLDivElement>(null)

  const isPanelMode = query.startsWith('>')
  const panelQuery = isPanelMode ? query.slice(1).trim().toLowerCase() : ''

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setRecents(loadRecents())
    }
  }, [open])

  function run(fn: () => void) {
    fn()
    setOpen(false)
  }

  const handleNavigateSymbol = useCallback((sym: string) => {
    saveRecent(sym)
    run(() => navigate(`/symbol/${sym}`))
  }, [navigate])

  function handleClearRecents() {
    clearRecents()
    setRecents([])
  }

  function handleFocusPanel(panelId: string) {
    run(() => window.dispatchEvent(new CustomEvent('monoth:focus-panel', { detail: { panelId } })))
  }

  const filteredPanels = isPanelMode
    ? PANELS.filter((p) => p.name.toLowerCase().includes(panelQuery) || p.id.includes(panelQuery))
    : []

  const showRecents = !query && recents.length > 0
  const showQuickActions = !isPanelMode

  const quickActions = [
    {
      value: 'toggle dark light mode theme',
      label: `Toggle Dark Mode (${theme === 'dark' ? 'switch to light' : 'switch to dark'})`,
      icon: theme === 'dark' ? '☀' : '☾',
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
    {
      value: 'refresh all data panels',
      label: 'Refresh All Data',
      icon: '↺',
      action: () => window.dispatchEvent(new CustomEvent('monoth:refresh-all')),
    },
    {
      value: 'export data json download',
      label: 'Export Data (JSON)',
      icon: '↓',
      action: exportMarketData,
    },
    {
      value: `${isLocked ? 'unlock' : 'lock'} layout drag`,
      label: `${isLocked ? 'Unlock' : 'Lock'} Layout`,
      icon: isLocked ? '⊘' : '⊙',
      action: toggleLock,
    },
  ]

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={isPanelMode ? 'Filter panels...' : 'Search symbols, panels, commands... (> for panels)'}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList ref={listRef}>
        <CommandEmpty>No results found.</CommandEmpty>

        {isPanelMode ? (
          <CommandGroup heading="Panels">
            {filteredPanels.map((panel) => (
              <CommandItem
                key={panel.id}
                value={`panel ${panel.name} ${panel.id}`}
                onSelect={() => handleFocusPanel(panel.id)}
              >
                <span className="flex-1 text-[11px]">{panel.name}</span>
                <span className="text-[10px] text-muted-foreground ml-2">scroll to panel</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : (
          <>
            {showRecents && (
              <>
                <CommandGroup heading={<span className="text-[10px] text-muted-foreground">Recent Searches</span>}>
                  {recents.map((r) => (
                    <CommandItem
                      key={r.symbol}
                      value={`recent ${r.symbol}`}
                      onSelect={() => handleNavigateSymbol(r.symbol)}
                    >
                      <span className="font-medium text-[11px]">{r.symbol}</span>
                      <span className="ml-2 text-[10px] text-muted-foreground">{timeAgo(r.searchedAt)}</span>
                    </CommandItem>
                  ))}
                  <CommandItem
                    value="clear recent searches"
                    onSelect={handleClearRecents}
                    className="text-[10px] text-muted-foreground"
                  >
                    Clear recents
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {showQuickActions && (
              <>
                <CommandGroup heading={<span className="text-[10px] text-muted-foreground">Quick Actions</span>}>
                  {quickActions.map((a) => (
                    <CommandItem
                      key={a.value}
                      value={a.value}
                      onSelect={() => run(a.action)}
                    >
                      <span className="mr-2 text-[11px] w-4 inline-block text-center select-none">{a.icon}</span>
                      <span className="text-[11px]">{a.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            <CommandGroup heading="Symbols">
              {POPULAR_SYMBOLS.map((sym) => (
                <CommandItem
                  key={sym}
                  value={`symbol ${sym}`}
                  onSelect={() => handleNavigateSymbol(sym)}
                >
                  <span className="font-medium">{sym}</span>
                  <span className="ml-2 text-muted-foreground text-xs">View chart & quote</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Panels">
              {panels.map((panel) => (
                <CommandItem
                  key={panel.id}
                  value={`panel ${panel.name}`}
                  onSelect={() => run(() => togglePanel(panel.id))}
                >
                  <span className="flex-1">{panel.name}</span>
                  <Badge variant={panel.enabled ? 'default' : 'secondary'} className="ml-2 text-xs">
                    {panel.enabled ? 'on' : 'off'}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Actions">
              <CommandItem value="toggle theme dark light" onSelect={() => run(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}>
                Toggle theme ({theme === 'dark' ? 'switch to light' : 'switch to dark'})
              </CommandItem>
              <CommandItem value="lock unlock layout drag" onSelect={() => run(toggleLock)}>
                Toggle layout lock
              </CommandItem>
              <CommandItem value="refresh all panels data" onSelect={() => run(() => window.dispatchEvent(new CustomEvent('monoth:refresh-all')))}>
                Refresh all data
              </CommandItem>
              <CommandItem value="reset panels default layout" onSelect={() => run(resetPanels)}>
                Reset to default layout
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Navigation">
              <CommandItem value="go to dashboard home" onSelect={() => run(() => navigate('/dashboard'))}>
                Dashboard
              </CommandItem>
              <CommandItem value="go to landing page" onSelect={() => run(() => navigate('/'))}>
                Landing page
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
