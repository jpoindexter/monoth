import { create } from 'zustand'
import type { MarketDataPoint, ForexRate, CryptoAsset, MacroSignal, YieldData } from '@/types'

export interface SectorDataPoint {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

interface MarketStore {
  indices: MarketDataPoint[]
  forex: ForexRate[]
  crypto: CryptoAsset[]
  commodities: MarketDataPoint[]
  yields: YieldData[]
  macroSignals: MacroSignal[]
  sectorData: SectorDataPoint[]
  lastRefresh: Record<string, number>
  setIndices: (data: MarketDataPoint[]) => void
  setForex: (data: ForexRate[]) => void
  setCrypto: (data: CryptoAsset[]) => void
  setCommodities: (data: MarketDataPoint[]) => void
  setYields: (data: YieldData[]) => void
  setMacroSignals: (data: MacroSignal[]) => void
  setSectorData: (data: SectorDataPoint[]) => void
  markRefresh: (key: string) => void
  applyTick: (symbol: string, price: number) => void
}

export const useMarketStore = create<MarketStore>((set) => ({
  indices: [],
  forex: [],
  crypto: [],
  commodities: [],
  yields: [],
  macroSignals: [],
  sectorData: [],
  lastRefresh: {},
  setIndices: (data) => set({ indices: data }),
  setForex: (data) => set({ forex: data }),
  setCrypto: (data) => set({ crypto: data }),
  setCommodities: (data) => set({ commodities: data }),
  setYields: (data) => set({ yields: data }),
  setMacroSignals: (data) => set({ macroSignals: data }),
  setSectorData: (data) => set({ sectorData: data }),
  markRefresh: (key) =>
    set((s) => ({ lastRefresh: { ...s.lastRefresh, [key]: Date.now() } })),
  applyTick: (symbol, price) =>
    set((s) => ({
      indices: s.indices.map((d) =>
        d.symbol === symbol ? { ...d, price, change: price - (d.price - (d.change ?? 0)) } : d
      ),
    })),
}))
