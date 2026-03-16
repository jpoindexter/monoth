import { lazy, Suspense } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { ErrorBoundary } from '@/components/ErrorBoundary'
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
  'macro-signals': lazy(() => import('./MacroSignalsPanel')),
  'world-clock': lazy(() => import('./WorldClockPanel')),
  'watchlist': lazy(() => import('./WatchlistPanel')),
  'ai-insights': lazy(() => import('./AiInsightsPanel')),
  'export': lazy(() => import('./ExportPanel')),
  'predictions': lazy(() => import('./PredictionsPanel')),
  'daily-brief': lazy(() => import('./DailyBriefPanel')),
  'supply-chain': lazy(() => import('./SupplyChainPanel')),
  'market-video': lazy(() => import('./MarketVideoPanel')),
  'earnings-calendar': lazy(() => import('./EarningsCalendarPanel')),
  'analyst-ratings': lazy(() => import('./AnalystRatingsPanel')),
  'insider-trading': lazy(() => import('./InsiderTradingPanel')),
  'economic-calendar': lazy(() => import('./EconomicCalendarPanel')),
  'stock-analysis': lazy(() => import('./StockAnalysisPanel')),
  'trade-policy': lazy(() => import('./TradePolicyPanel')),
  'fundamentals': lazy(() => import('./FundamentalsPanel')),
  'stock-screener': lazy(() => import('./StockScreenerPanel')),
  'options-chain': lazy(() => import('./OptionsChainPanel')),
  'crypto-markets': lazy(() => import('./CryptoMarketsPanel')),
  'commodities-spot': lazy(() => import('./CommoditiesSpotPanel')),
  'shipping-freight': lazy(() => import('./ShippingFreightPanel')),
  'options-flow': lazy(() => import('./OptionsFlowPanel')),
  'short-interest': lazy(() => import('./ShortInterestPanel')),
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
    <ErrorBoundary fallback={
      <PanelWrapper title={panelName}>
        <div className="flex items-center justify-center h-full text-[10px] text-destructive">Panel error</div>
      </PanelWrapper>
    }>
      <Suspense fallback={<PanelWrapper title={panelName} loading />}>
        <Panel />
      </Suspense>
    </ErrorBoundary>
  )
}
