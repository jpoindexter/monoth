import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { usePanelStore } from '@/stores'
import { useLayoutStore } from '@/stores'
import type { PanelTier } from '@/types'

const TIER_LABELS: Record<PanelTier, string> = {
  1: 'Core',
  2: 'Extended',
  3: 'Pro',
}

export function Sidebar() {
  const { panels, togglePanel } = usePanelStore()
  const { sidebarOpen, toggleSidebar } = useLayoutStore()

  const tiers: PanelTier[] = [1, 2, 3]

  return (
    <aside
      className="h-full border-r border-border bg-white dark:bg-background flex flex-col transition-all duration-200 shrink-0"
      style={{ width: sidebarOpen ? 240 : 48 }}
    >
      {sidebarOpen && (
        <>
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Panels</span>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={toggleSidebar}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="px-3 py-3">
              {tiers.map((tier) => {
                const tierPanels = panels.filter((p) => p.tier === tier)
                return (
                  <div key={tier} className="mb-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2">
                      {TIER_LABELS[tier]}
                    </p>
                    {tierPanels.map((panel) => (
                      <div key={panel.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-accent/60 transition-colors">
                        <span className="text-sm truncate flex-1 mr-2 text-foreground/80">{panel.name}</span>
                        <Switch
                          checked={panel.enabled}
                          onCheckedChange={() => togglePanel(panel.id)}
                          className="shrink-0 scale-90"
                        />
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </>
      )}
      {!sidebarOpen && (
        <div className="flex flex-col items-center pt-3">
          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={toggleSidebar}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </aside>
  )
}
