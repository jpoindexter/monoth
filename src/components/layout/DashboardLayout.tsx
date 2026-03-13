import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { PanelGrid } from './PanelGrid'

export function DashboardLayout() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <PanelGrid />
        </main>
      </div>
    </div>
  )
}
