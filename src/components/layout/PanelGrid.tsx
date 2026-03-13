import { usePanelStore } from '@/stores'
import { useSpanStore } from '@/stores/span-store'
import { PanelRenderer } from '@/components/panels'
import { PanelIdProvider } from '@/components/layout/PanelWrapper'

export function PanelGrid() {
  const { enabledPanels } = usePanelStore()
  const panels = enabledPanels()
  const getSpan = useSpanStore((s) => s.getSpan)

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
      {panels.map((p) => {
        const span = getSpan(p.id)
        return (
          <div
            key={p.id}
            className="min-h-0 overflow-hidden"
            style={{
              gridColumn: span.col > 1 ? `span ${span.col}` : undefined,
              gridRow: span.row > 1 ? `span ${span.row}` : undefined,
            }}
          >
            <PanelIdProvider id={p.id}>
              <PanelRenderer panelId={p.id} panelName={p.name} />
            </PanelIdProvider>
          </div>
        )
      })}
    </div>
  )
}
