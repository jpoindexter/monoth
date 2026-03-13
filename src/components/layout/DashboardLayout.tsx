import { TopBar } from './TopBar'
import { PanelGrid } from './PanelGrid'
import { StatsBar } from './StatsBar'
import { NewsTicker } from './NewsTicker'
import { StatusBar } from './StatusBar'
import { TickerTape } from './TickerTape'

export function DashboardLayout() {
  return (
    <div className="flex flex-col h-screen bg-zinc-100 dark:bg-[#0e0e0e] text-foreground">
      <TopBar />
      <TickerTape />
      <StatsBar />
      <PanelGrid />
      <NewsTicker />
      <StatusBar />
    </div>
  )
}
