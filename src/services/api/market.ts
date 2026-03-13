import type { MarketDataPoint } from '@/types'

export async function fetchIndices(): Promise<MarketDataPoint[]> {
  const res = await fetch('/api/market/indices')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchQuotes(symbols: string[]): Promise<MarketDataPoint[]> {
  const res = await fetch(`/api/market/quote?symbols=${symbols.join(',')}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchSectors(): Promise<{ symbol: string; name: string; price: number; change: number; changePercent: number }[]> {
  const res = await fetch('/api/market/sectors')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
