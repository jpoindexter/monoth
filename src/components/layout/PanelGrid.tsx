import { usePanelStore } from '@/stores'
import { PanelRenderer } from '@/components/panels'

export function PanelGrid() {
  const { enabledPanels } = usePanelStore()
  const panels = enabledPanels()

  return (
    <div
      className="flex-1 overflow-auto"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gridAutoRows: 'minmax(200px, 280px)',
        gridAutoFlow: 'row dense',
        gap: '4px',
        padding: '4px',
      }}
    >
      {panels.map((p) => (
        <div key={p.id} className="min-h-0 overflow-hidden">
          <PanelRenderer panelId={p.id} panelName={p.name} />
        </div>
      ))}
    </div>
  )
}
