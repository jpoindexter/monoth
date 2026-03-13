import { TopBar } from './TopBar'
import { PanelGrid } from './PanelGrid'
import { StatsBar } from './StatsBar'
import { StatusBar } from './StatusBar'

export function DashboardLayout() {
  return (
    <div className="flex flex-col h-screen bg-zinc-100 dark:bg-[#0e0e0e] text-foreground">
      <TopBar />
      <StatsBar />
      <PanelGrid />
      <StatusBar />
    </div>
  )
}
