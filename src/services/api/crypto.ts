import type { CryptoAsset } from '@/types'

export async function fetchCryptoPrices(): Promise<CryptoAsset[]> {
  const res = await fetch('/api/crypto/prices')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
