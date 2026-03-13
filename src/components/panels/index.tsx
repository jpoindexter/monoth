import { PanelWrapper } from '@/components/layout/PanelWrapper'
import type { PanelId } from '@/types'

interface PanelRendererProps {
  panelId: PanelId
  panelName: string
}

export function PanelRenderer({ panelId: _panelId, panelName }: PanelRendererProps) {
  return (
    <PanelWrapper title={panelName}>
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        {panelName}
      </div>
    </PanelWrapper>
  )
}
