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
      className="h-full border-r bg-background flex flex-col transition-all duration-200 shrink-0"
      style={{ width: sidebarOpen ? 240 : 0 }}
    >
      {sidebarOpen && (
        <>
          <div className="flex items-center justify-between px-3 py-2 shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Panels</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={toggleSidebar}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="p-2">
              {tiers.map((tier) => {
                const tierPanels = panels.filter((p) => p.tier === tier)
                return (
                  <div key={tier} className="mb-4">
                    <p className="text-xs text-muted-foreground px-1 mb-1 font-medium">
                      Tier {tier}: {TIER_LABELS[tier]}
                    </p>
                    {tierPanels.map((panel) => (
                      <div key={panel.id} className="flex items-center justify-between py-1 px-1 rounded hover:bg-accent">
                        <span className="text-sm truncate flex-1 mr-2">{panel.name}</span>
                        <Switch
                          checked={panel.enabled}
                          onCheckedChange={() => togglePanel(panel.id)}
                          className="shrink-0"
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
        <Button size="icon" variant="ghost" className="h-8 w-8 mx-auto mt-2" onClick={toggleSidebar}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </aside>
  )
}
