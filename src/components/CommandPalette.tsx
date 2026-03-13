import { useEffect, useState } from 'react'
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

const POPULAR_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META',
  'SPY', 'QQQ', 'DIA', 'IWM', 'GLD', 'TLT', 'BTC', 'ETH',
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const panels = usePanelStore((s) => s.panels)
  const togglePanel = usePanelStore((s) => s.togglePanel)
  const resetPanels = usePanelStore((s) => s.resetPanels)
  const toggleLock = useLayoutStore((s) => s.toggleLock)
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

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

  function run(fn: () => void) {
    fn()
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search symbols, panels, commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Symbols">
          {POPULAR_SYMBOLS.map((sym) => (
            <CommandItem
              key={sym}
              value={`symbol ${sym}`}
              onSelect={() => run(() => navigate(`/symbol/${sym}`))}
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
      </CommandList>
    </CommandDialog>
  )
}
