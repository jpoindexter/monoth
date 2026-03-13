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
  'correlation-engine': lazy(() => import('./CorrelationPanel')),
  'ipos-earnings': lazy(() => import('./IpoEarningsPanel')),
  'derivatives-news': lazy(() => import('./DerivativesPanel')),
  'fintech-news': lazy(() => import('./FintechPanel')),
  'regulation': lazy(() => import('./RegulationPanel')),
  'hedge-funds-news': lazy(() => import('./HedgeFundsPanel')),
  'market-analysis-news': lazy(() => import('./MarketAnalysisPanel')),
  'btc-etf': lazy(() => import('./BtcEtfPanel')),
  'stablecoins': lazy(() => import('./StablecoinsPanel')),
  'geopolitics': lazy(() => import('./GeopoliticsPanel')),
  'real-estate': lazy(() => import('./RealEstatePanel')),
  'energy': lazy(() => import('./EnergyPanel')),
  'volatility': lazy(() => import('./VolatilityPanel')),
  'bond-news': lazy(() => import('./BondNewsPanel')),
  'watchlist': lazy(() => import('./WatchlistPanel')),
  'ai-insights': lazy(() => import('./AiInsightsPanel')),
  'export': lazy(() => import('./ExportPanel')),
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
