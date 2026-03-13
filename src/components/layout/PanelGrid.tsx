import { useState, useRef, useEffect } from 'react'
import { usePanelStore } from '@/stores'
import { useSpanStore } from '@/stores/span-store'
import { PanelRenderer } from '@/components/panels'
import { PanelIdProvider } from '@/components/layout/PanelWrapper'

export function PanelGrid() {
  const { enabledPanels, reorderPanels } = usePanelStore()
  const panels = enabledPanels()
  const spans = useSpanStore((s) => s.spans)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)

  useEffect(() => {
    function onFocusPanel(e: Event) {
      const { panelId } = (e as CustomEvent<{ panelId: string }>).detail
      const el = document.getElementById(`panel-${panelId}`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('panel-highlight')
      setTimeout(() => el.classList.remove('panel-highlight'), 2000)
    }
    window.addEventListener('monoth:focus-panel', onFocusPanel)
    return () => window.removeEventListener('monoth:focus-panel', onFocusPanel)
  }, [])

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
        const span = spans[p.id] ?? { col: 1, row: 1 }
        return (
          <div
            key={p.id}
            id={`panel-${p.id}`}
            draggable
            onDragStart={() => { dragId.current = p.id }}
            onDragOver={(e) => {
              e.preventDefault()
              if (dragId.current !== p.id) setDragOverId(p.id)
            }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={(e) => {
              e.preventDefault()
              if (dragId.current && dragId.current !== p.id) {
                reorderPanels(dragId.current, p.id)
              }
              dragId.current = null
              setDragOverId(null)
            }}
            onDragEnd={() => {
              dragId.current = null
              setDragOverId(null)
            }}
            className={`min-h-0 overflow-hidden transition-shadow ${
              dragOverId === p.id ? 'ring-2 ring-foreground/20 ring-inset' : ''
            }`}
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
