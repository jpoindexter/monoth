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

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const panels = usePanelStore((s) => s.panels)
  const togglePanel = usePanelStore((s) => s.togglePanel)
  const toggleLock = useLayoutStore((s) => s.toggleLock)
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

  function toggleTheme() {
    document.documentElement.classList.toggle('dark')
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Panels">
          {panels.map((panel) => (
            <CommandItem
              key={panel.id}
              value={`panel ${panel.name}`}
              onSelect={() => run(() => togglePanel(panel.id))}
            >
              <span className="flex-1">{panel.name}</span>
              <Badge variant={panel.enabled ? 'default' : 'secondary'} className="ml-2 text-xs">
                {panel.enabled ? 'enabled' : 'disabled'}
              </Badge>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem value="toggle theme dark light" onSelect={() => run(toggleTheme)}>
            Toggle theme
          </CommandItem>
          <CommandItem value="lock layout" onSelect={() => run(toggleLock)}>
            Lock layout
          </CommandItem>
          <CommandItem value="refresh all panels" onSelect={() => run(() => window.dispatchEvent(new CustomEvent('monoth:refresh-all')))}>
            Refresh all
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem value="go to dashboard" onSelect={() => run(() => navigate('/dashboard'))}>
            Go to Dashboard
          </CommandItem>
          <CommandItem value="go to settings" onSelect={() => run(() => navigate('/settings'))}>
            Go to Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
