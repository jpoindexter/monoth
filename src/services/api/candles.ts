export interface CandleData {
  time: string
  open: number
  high: number
  low: number
  close: number
  value: number
}

export async function fetchCandles(symbol: string, resolution = 'D'): Promise<CandleData[]> {
  const res = await fetch(`/api/market/candles?symbol=${symbol}&resolution=${resolution}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
