import 'react-grid-layout/css/styles.css'
import { useMemo } from 'react'
import { ResponsiveGridLayout } from 'react-grid-layout'
import type { Layout, Layouts } from 'react-grid-layout'
import { usePanelStore } from '@/stores'
import { useLayoutStore } from '@/stores'
import { PanelRenderer } from '@/components/panels'

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768 }
const COLS = { lg: 12, md: 8, sm: 4 }
const ROW_HEIGHT = 80

export function PanelGrid() {
  const { enabledPanels } = usePanelStore()
  const { layouts: savedLayouts, setLayouts, layoutLocked } = useLayoutStore()

  const panels = enabledPanels()

  const lgLayout = useMemo<Layout[]>(() => {
    let x = 0
    let y = 0
    return panels.map((p) => {
      const item: Layout = {
        i: p.id,
        x,
        y,
        w: p.defaultWidth,
        h: p.defaultHeight,
        minW: p.minWidth,
        minH: p.minHeight,
      }
      x += p.defaultWidth
      if (x >= COLS.lg) {
        x = 0
        y += p.defaultHeight
      }
      return item
    })
  }, [panels.map((p) => p.id).join(',')])

  const layouts: Layouts = savedLayouts.length > 0
    ? { lg: savedLayouts as Layout[] }
    : { lg: lgLayout }

  function handleLayoutChange(_layout: Layout[], allLayouts: Layouts) {
    if (allLayouts.lg) {
      setLayouts(allLayouts.lg)
    }
  }

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={BREAKPOINTS}
      cols={COLS}
      rowHeight={ROW_HEIGHT}
      isDraggable={!layoutLocked}
      isResizable={!layoutLocked}
      onLayoutChange={handleLayoutChange}
      margin={[8, 8]}
    >
      {panels.map((p) => (
        <div key={p.id}>
          <PanelRenderer panelId={p.id} panelName={p.name} />
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}
