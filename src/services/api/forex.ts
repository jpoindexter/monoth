import type { ForexRate } from '@/types'

export async function fetchForexRates(): Promise<ForexRate[]> {
  const res = await fetch('/api/forex/rates')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
