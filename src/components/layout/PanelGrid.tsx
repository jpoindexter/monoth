import { useMemo } from 'react'
import { usePanelStore } from '@/stores'
import { useLayoutStore } from '@/stores'
import { PanelRenderer } from '@/components/panels'

export function PanelGrid() {
  const { enabledPanels } = usePanelStore()
  const { layoutLocked } = useLayoutStore()

  const panels = enabledPanels()

  const gridStyle: React.CSSProperties = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '8px',
    padding: '8px',
  }), [])

  return (
    <div style={gridStyle}>
      {panels.map((p) => (
        <div
          key={p.id}
          style={{
            minHeight: '80px',
            pointerEvents: layoutLocked ? 'none' : 'auto',
          }}
        >
          <PanelRenderer panelId={p.id} panelName={p.name} />
        </div>
      ))}
    </div>
  )
}
