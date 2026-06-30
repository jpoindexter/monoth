import { create } from 'zustand'

export type Region = 'global' | 'americas' | 'mena' | 'europe' | 'asia' | 'latam' | 'africa' | 'oceania'

export const REGION_LABELS: Record<Region, string> = {
  global: 'Global',
  americas: 'Americas',
  mena: 'MENA',
  europe: 'Europe',
  asia: 'Asia',
  latam: 'Latin America',
  africa: 'Africa',
  oceania: 'Oceania',
}

interface RegionStore {
  region: Region
  setRegion: (region: Region) => void
}

const LS_KEY = 'monoth-region'

function loadRegion(): Region {
  try {
    const saved = localStorage.getItem(LS_KEY)
    if (saved && saved in REGION_LABELS) return saved as Region
  } catch { /* storage unavailable; default to global */ }
  return 'global'
}

export const useRegionStore = create<RegionStore>((set) => ({
  region: loadRegion(),
  setRegion: (region) => {
    localStorage.setItem(LS_KEY, region)
    set({ region })
  },
}))
