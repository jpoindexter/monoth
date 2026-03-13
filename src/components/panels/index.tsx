import { lazy, Suspense } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import type { PanelId } from '@/types'

const panels: Record<string, React.LazyExoticComponent<() => React.JSX.Element>> = {
  'live-markets': lazy(() => import('./LiveMarketsPanel')),
  'headlines': lazy(() => import('./HeadlinesPanel')),
  'forex': lazy(() => import('./ForexPanel')),
  'fixed-income': lazy(() => import('./FixedIncomePanel')),
  'commodities': lazy(() => import('./CommoditiesPanel')),
  'crypto': lazy(() => import('./CryptoPanel')),
  'central-banks': lazy(() => import('./CentralBanksPanel')),
  'economic-data': lazy(() => import('./EconomicDataPanel')),
  'sector-heatmap': lazy(() => import('./SectorHeatmapPanel')),
  'market-radar': lazy(() => import('./MarketRadarPanel')),
  'correlation': lazy(() => import('./CorrelationPanel')),
  'ipo-earnings': lazy(() => import('./IpoEarningsPanel')),
  'derivatives': lazy(() => import('./DerivativesPanel')),
  'fintech': lazy(() => import('./FintechPanel')),
  'regulation': lazy(() => import('./RegulationPanel')),
  'hedge-funds': lazy(() => import('./HedgeFundsPanel')),
  'market-analysis': lazy(() => import('./MarketAnalysisPanel')),
  'btc-etf': lazy(() => import('./BtcEtfPanel')),
  'stablecoins': lazy(() => import('./StablecoinsPanel')),
  'watchlist': lazy(() => import('./WatchlistPanel')),
}

interface PanelRendererProps {
  panelId: PanelId
  panelName: string
}

export function PanelRenderer({ panelId, panelName }: PanelRendererProps) {
  const Panel = panels[panelId]

  if (!Panel) {
    return (
      <PanelWrapper title={panelName}>
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          {panelName}
        </div>
      </PanelWrapper>
    )
  }

  return (
    <Suspense fallback={<PanelWrapper title={panelName} loading />}>
      <Panel />
    </Suspense>
  )
}
