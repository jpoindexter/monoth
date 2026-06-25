import { TopBar } from './TopBar'
import { PanelGrid } from './PanelGrid'
import { StatsBar } from './StatsBar'
import { NewsTicker } from './NewsTicker'
import { StatusBar } from './StatusBar'

export function DashboardLayout() {
  return (
    <div className="flex flex-col h-screen bg-zinc-100 dark:bg-bg-base text-foreground">
      <TopBar />
      <StatsBar />
      <PanelGrid />
      <NewsTicker />
      <StatusBar />
    </div>
  )
}
